/**
 * Modal adapter (ComputeSDK-backed, provider baked in as "modal" so results are
 * labeled per provider rather than the generic "computesdk").
 *
 * Setup (from sandbox_bench/):
 *   npm i computesdk @computesdk/modal
 *   export MODAL_TOKEN_ID=...
 *   export MODAL_TOKEN_SECRET=...
 *
 * Config (bench.config.example.json → providers.modal):
 *   { "providerOptions": { "tokenId": "...", "tokenSecret": "..." },
 *     "createOptions": { "templateId": "buildpack-deps:bookworm" } }
 * Credentials also resolve from MODAL_TOKEN_ID / MODAL_TOKEN_SECRET if omitted.
 *
 * Sizing: Modal takes cpu (cores) and memory (MB) directly on sandbox create.
 * We translate the runner's spec into cpu = spec.cpus, memory = spec.memGb*1024
 * and merge over config.createOptions. Modal's default image is node:20, which
 * lacks git/useradd for the root→user drop; we default templateId to
 * buildpack-deps:bookworm (has bash/git/curl/useradd) to match the docker
 * baseline image. Override via config if desired.
 *
 * Snapshot: Modal supports filesystem snapshots (snapshotFilesystem), but that
 * restores disk only (like `docker commit`), not a live process/memory image,
 * so it is not wired here — L6 warm resume is left to memory-snapshot providers
 * (docker commit + Namespace suspend/resume). Noted in findings.
 */

const DEFAULT_IMAGE = 'buildpack-deps:bookworm';

let compute;
let settings;

export const capabilities = { snapshot: false };

export async function init(providerConfig) {
  settings = { providerOptions: {}, createOptions: {}, ...providerConfig };
  let sdk;
  let providerPkg;
  try {
    sdk = await import('computesdk');
    providerPkg = await import('@computesdk/modal');
  } catch (err) {
    throw new Error(
      `Missing dependencies for the modal adapter (${err.message}). ` +
        `Run: npm i computesdk @computesdk/modal`
    );
  }
  const factory = providerPkg.modal ?? providerPkg.default;
  if (typeof factory !== 'function') {
    throw new Error('@computesdk/modal does not export a "modal" factory');
  }
  ({ compute } = sdk);
  compute.setConfig({ provider: factory(settings.providerOptions) });
}

export async function create(spec) {
  const sandbox = await compute.sandbox.create({
    // Sandbox lifetime; generous so it never undercuts the level ceiling.
    timeout: 3 * 60 * 60 * 1000,
    templateId: DEFAULT_IMAGE,
    cpu: spec?.cpus ?? 2,
    memoryMiB: (spec?.memGb ?? 4) * 1024,
    metadata: { bench: 'kbn-sandbox-bench', requestedSpec: JSON.stringify(spec ?? {}) },
    ...settings.createOptions,
  });
  return { sandbox };
}

export async function exec(handle, script, { timeoutMs }) {
  const path = `/tmp/kbn_bench_task_${Date.now()}.sh`;
  await handle.sandbox.filesystem.writeFile(path, script);

  let timer;
  const timedOut = new Promise((resolve) => {
    timer = setTimeout(
      () => resolve({ exitCode: 124, stdout: '', stderr: `host-side timeout after ${timeoutMs}ms` }),
      timeoutMs
    );
  });
  try {
    const result = await Promise.race([handle.sandbox.runCommand(`bash ${path}`), timedOut]);
    return {
      exitCode: result.exitCode ?? 0,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function destroy(handle) {
  await handle.sandbox.destroy();
}
