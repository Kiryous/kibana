/**
 * Google Cloud Run adapter, modeled as Cloud Run Jobs.
 *
 * Cloud Run has no interactive/persistent exec, so we map the harness interface
 * onto Jobs:
 *   - create()  is a no-op that just mints a unique job name (provision ~0 ms).
 *   - exec()    deploys a job (gen2, configurable CPU/mem, task-timeout from the
 *               level ceiling) whose container runs the payload, executes it
 *               with --wait, then pulls the task's stdout back from Cloud Logging
 *               and reconstructs the ##BENCH## markers.
 *   - destroy() deletes the job.
 *
 * Because deploy + execute happen inside exec(), the "provision" phase (~0) and
 * the "exec" phase are folded together — an honest property of the platform
 * (there is no long-lived box to provision separately). Recorded in findings.
 *
 * Consequences of the Jobs model, all real results rather than worked-around:
 *   - No persistent background processes across sessions and no preview URL, so
 *     L4/L5/L6 (live ES/Kibana on a reachable port, warm resume) are not
 *     meaningfully supported; only L0–L3 (self-contained, exit-code tasks) fit.
 *   - The payload is shipped as a base64 env var (tasks are ~6 KB base64, far
 *     under Cloud Run's 32 KiB env limit) and decoded+run by the container.
 *
 * Config (bench.config.example.json → providers.cloudrun):
 *   { "project": "my-gcp-project", "region": "us-central1",
 *     "image": "buildpack-deps:bookworm", "cpu": "8", "memory": "32Gi" }
 * project defaults to the active gcloud project if omitted.
 */

import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';

let settings = {
  region: 'us-central1',
  image: 'buildpack-deps:bookworm',
  cpu: '8',
  memory: '32Gi',
  // How long to keep re-reading Cloud Logging after the job finishes, since log
  // ingestion lags the execution by a few seconds.
  logPollAttempts: 12,
  logPollDelayMs: 5000,
};

export const capabilities = { snapshot: false };

const gcloud = (args, { timeoutMs } = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn('gcloud', args, { env: process.env });
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
    child.stdin.end();
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function init(providerConfig) {
  settings = { ...settings, ...providerConfig };
  if (!settings.project) {
    const res = await gcloud(['config', 'get-value', 'project'], { timeoutMs: 30_000 });
    settings.project = res.stdout.trim();
  }
  if (!settings.project) throw new Error('cloudrun: no GCP project (set providers.cloudrun.project or `gcloud config set project`)');
}

export async function create(spec) {
  // No long-lived resource; just name the job this iteration will use.
  const jobName = `kbn-bench-${randomBytes(4).toString('hex')}`;
  return { jobName, spec };
}

const projectFlags = () => ['--project', settings.project, '--region', settings.region];

const readLogs = async (jobName) => {
  const filter = `resource.type="cloud_run_job" AND resource.labels.job_name="${jobName}" AND (severity>=DEFAULT OR textPayload:"")`;
  for (let attempt = 0; attempt < settings.logPollAttempts; attempt++) {
    const res = await gcloud(
      [
        'logging',
        'read',
        filter,
        '--project',
        settings.project,
        '--order',
        'asc',
        '--limit',
        '2000',
        '--format',
        'value(textPayload)',
      ],
      { timeoutMs: 60_000 }
    );
    const stdout = res.stdout ?? '';
    // Every task ends with `bench_phase done`; wait for that terminal marker (or
    // an explicit fail) so we don't parse a truncated, still-ingesting log tail.
    if (/##BENCH## phase=done /.test(stdout) ||
        /##BENCH## fail /.test(stdout) ||
        attempt === settings.logPollAttempts - 1) {
      return stdout;
    }
    await sleep(settings.logPollDelayMs);
  }
  return '';
};

export async function exec(handle, script, { timeoutMs }) {
  const { jobName } = handle;
  const b64 = Buffer.from(script).toString('base64');
  const taskTimeoutSec = Math.ceil(timeoutMs / 1000);
  const inner = 'echo "$BENCH_PAYLOAD_B64" | base64 -d > /tmp/t.sh && bash /tmp/t.sh';

  const deploy = await gcloud(
    [
      'run',
      'jobs',
      'deploy',
      jobName,
      '--image',
      settings.image,
      ...projectFlags(),
      '--cpu',
      String(settings.cpu),
      '--memory',
      String(settings.memory),
      '--task-timeout',
      `${taskTimeoutSec}s`,
      '--max-retries',
      '0',
      '--execution-environment',
      'gen2',
      // Custom delimiter (^##^) so a base64 value containing no '##' is passed
      // intact regardless of commas.
      '--set-env-vars',
      `^##^BENCH_PAYLOAD_B64=${b64}`,
      '--command',
      'bash',
      // --args splits on commas; `inner` has none, so this yields ['-c', inner].
      `--args=-c,${inner}`,
      '--quiet',
    ],
    { timeoutMs: 5 * 60 * 1000 }
  );
  if (deploy.exitCode !== 0) {
    return { exitCode: deploy.exitCode, stdout: '', stderr: `job deploy failed: ${deploy.stderr}` };
  }

  const execRes = await gcloud(
    ['run', 'jobs', 'execute', jobName, ...projectFlags(), '--wait', '--quiet'],
    { timeoutMs: timeoutMs + 120_000 }
  );

  const logs = await readLogs(jobName);
  return {
    // execute --wait exits nonzero if the task container exited nonzero.
    exitCode: execRes.exitCode,
    stdout: logs,
    stderr: execRes.stderr,
  };
}

export async function destroy(handle) {
  if (!handle?.jobName) return;
  await gcloud(['run', 'jobs', 'delete', handle.jobName, ...projectFlags(), '--quiet'], {
    timeoutMs: 3 * 60 * 1000,
  });
}
