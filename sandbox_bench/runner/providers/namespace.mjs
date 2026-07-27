/**
 * Namespace (nsc) native adapter.
 *
 * Model: `nsc create --ephemeral` provisions a Namespace instance (a fast
 * microVM-backed Linux box) that ships with a Docker daemon. The instance's own
 * ssh shell is a minimal Wolfi image without `useradd` (only `adduser`), so the
 * harness root→user drop can't run there directly; instead we run the payload in
 * a `buildpack-deps:bookworm` container on the instance's Docker — exactly like
 * the docker adapter, but with DOCKER_HOST pointed at the remote instance via
 * `nsc exec-scoped --service=docker`. That image has bash/git/curl/useradd, so
 * the root drop and Kibana/ES's refuse-root behaviour work as designed.
 *
 * Auth: the runner's environment must carry a valid `NAMESPACE_TOKEN` (the
 * single-line JSON `{"bearer_token":"nsrt_…"}` emitted by
 * `nsc token create --output token`, granted instance create/get/list/wait/ssh/
 * exec/refresh/destroy). nsc reads it directly.
 *
 * Sizing: Namespace machine shapes are `<vCPU>x<GB>` — 2x4 / 4x8 / 8x16 map 1:1
 * onto the harness small/medium/large tiers (disk 48/64/96 GB). spec.cpus/memGb
 * are translated automatically and also passed to `docker run` as caps.
 *
 * Snapshot/resume: nsc v0.0.528 exposes no suspend/resume/snapshot verb, so L6
 * warm resume is recorded unsupported (documented in findings).
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let settings = {
  duration: '3h',
  createWaitTimeout: '300s',
  image: 'buildpack-deps:bookworm',
  extraCreateArgs: [],
};

export const capabilities = { snapshot: false };

export async function init(providerConfig) {
  settings = { ...settings, ...providerConfig };
}

const machineType = (spec) => {
  const cpus = spec?.cpus ?? 2;
  const memGb = spec?.memGb ?? cpus * 2;
  return `${cpus}x${memGb}`;
};

const nsc = (args, { stdin, timeoutMs } = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn('nsc', args, { env: process.env });
    let stdout = '';
    let stderr = '';
    const timer = timeoutMs ? setTimeout(() => child.kill('SIGKILL'), timeoutMs) : null;
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', reject);
    child.on('close', (code) => {
      if (timer) clearTimeout(timer);
      resolve({ exitCode: code ?? 124, stdout, stderr });
    });
    if (stdin !== undefined) child.stdin.end(stdin);
    else child.stdin.end();
  });

export async function create(spec) {
  const dir = mkdtempSync(join(tmpdir(), 'nsc-bench-'));
  const cidfile = join(dir, 'cid');
  const args = [
    'create',
    '--ephemeral',
    '--machine_type',
    machineType(spec),
    '--cidfile',
    cidfile,
    '--duration',
    settings.duration,
    '--wait_timeout',
    settings.createWaitTimeout,
    '--purpose',
    'kbn-sandbox-bench',
    '--output',
    'plain',
    ...(settings.region ? ['--region', settings.region] : []),
    ...settings.extraCreateArgs,
  ];
  const res = await nsc(args, { timeoutMs: 6 * 60 * 1000 });
  let id;
  try {
    id = readFileSync(cidfile, 'utf8').trim();
  } catch {
    rmSync(dir, { recursive: true, force: true });
    throw new Error(`nsc create failed (exit ${res.exitCode}): ${res.stderr || res.stdout}`);
  }
  rmSync(dir, { recursive: true, force: true });
  if (!id) throw new Error(`nsc create produced no instance id (stdout: ${res.stdout})`);
  // Pre-pull the workload image on the instance's Docker so provision time
  // reflects a ready-to-run box (fresh ephemeral instance => cold pull each time).
  const pull = await nsc(
    ['exec-scoped', '--service=docker', id, '--', 'docker', 'pull', settings.image],
    { timeoutMs: 5 * 60 * 1000 }
  );
  if (pull.exitCode !== 0) {
    await nsc(['destroy', id, '--force'], { timeoutMs: 3 * 60 * 1000 }).catch(() => {});
    throw new Error(`docker pull on instance failed: ${pull.stderr || pull.stdout}`);
  }
  return { id, spec };
}

// Run a docker subcommand on the instance's daemon via exec-scoped.
const idocker = (id, dockerArgs, opts) =>
  nsc(['exec-scoped', '--service=docker', id, '--', 'docker', ...dockerArgs], opts);

export async function exec(handle, script, { timeoutMs }) {
  const { id, spec } = handle;
  // exec-scoped forwards the docker CLI's own stdout (e.g. `docker logs`) but NOT
  // a container's attached stdout, so we run detached, wait, then pull logs —
  // the same indirection the Cloud Run adapter uses. Payload is shipped base64
  // in the container command to avoid stdin streaming (also unattached remotely).
  const b64 = Buffer.from(script).toString('base64');
  const runArgs = ['run', '-d'];
  if (spec?.cpus) runArgs.push('--cpus', String(spec.cpus));
  if (spec?.memGb) runArgs.push('--memory', `${spec.memGb}g`);
  runArgs.push(settings.image, 'bash', '-c', `echo ${b64} | base64 -d | bash`);

  const run = await idocker(id, runArgs, { timeoutMs: 60_000 });
  const cid = (run.stdout || '').trim().split('\n').filter(Boolean).pop();
  if (run.exitCode !== 0 || !cid || !/^[0-9a-f]{12,}$/.test(cid)) {
    return { exitCode: run.exitCode || 1, stdout: '', stderr: `docker run failed: ${run.stderr || run.stdout}` };
  }

  const wait = await idocker(id, ['wait', cid], { timeoutMs });
  let exitCode;
  if (wait.exitCode === 0) {
    exitCode = Number.parseInt((wait.stdout || '').trim(), 10);
    if (Number.isNaN(exitCode)) exitCode = 0;
  } else {
    // host-side timeout (nsc killed) — stop the still-running container.
    await idocker(id, ['kill', cid], { timeoutMs: 30_000 }).catch(() => {});
    exitCode = 124;
  }

  const logs = await idocker(id, ['logs', cid], { timeoutMs: 60_000 });
  await idocker(id, ['rm', '-f', cid], { timeoutMs: 30_000 }).catch(() => {});
  return { exitCode, stdout: logs.stdout || '', stderr: logs.stderr || wait.stderr || '' };
}

export async function destroy(handle) {
  if (!handle?.id) return;
  await nsc(['destroy', handle.id, '--force'], { timeoutMs: 3 * 60 * 1000 });
}
