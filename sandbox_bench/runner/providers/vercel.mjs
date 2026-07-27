/**
 * Vercel Sandbox adapter (ComputeSDK-backed, provider baked in as "vercel" so
 * results are labeled per provider rather than the generic "computesdk").
 *
 * Setup (from sandbox_bench/):
 *   npm i computesdk @computesdk/vercel
 *   export VERCEL_TOKEN=...          # account/team token
 *   export VERCEL_TEAM_ID=...        # e.g. team_xxx
 *   export VERCEL_PROJECT_ID=...     # prj_xxx
 *
 * Config (bench.config.example.json → providers.vercel):
 *   { "providerOptions": { "token": "...", "teamId": "...", "projectId": "..." },
 *     "createOptions": {} }
 * Credentials also resolve from the env vars above if omitted.
 *
 * Sizing: Vercel Sandbox exposes vCPU count (1–8); memory scales at 2 GB per
 * vCPU, which lines up exactly with the harness spec tiers (2→4 GB, 4→8 GB,
 * 8→16 GB). We translate the runner's spec.cpus into resources.vcpus (capped
 * at 8) and pass it straight through the ComputeSDK create() options, which
 * spreads unknown keys into VercelSandbox.create(). There is no disk knob —
 * Vercel Sandbox disk is fixed, so L2+ (node_modules > 10 GB) may fail on disk;
 * that is a real result, recorded as unsupported rather than worked around.
 */

const VERCEL_MAX_VCPUS = 8;
// Vercel Sandbox hard cap on lifetime is 45 min; keep the sandbox alive to the
// longest level ceiling (L5 = 45 min) so it never undercuts the task.
const SANDBOX_TIMEOUT_MS = 45 * 60 * 1000;

let compute;
let settings;

export const capabilities = { snapshot: false };

export async function init(providerConfig) {
  settings = { providerOptions: {}, createOptions: {}, ...providerConfig };
  let sdk;
  let providerPkg;
  try {
    sdk = await import('computesdk');
    providerPkg = await import('@computesdk/vercel');
  } catch (err) {
    throw new Error(
      `Missing dependencies for the vercel adapter (${err.message}). ` +
        `Run: npm i computesdk @computesdk/vercel`
    );
  }
  const factory = providerPkg.vercel ?? providerPkg.default;
  if (typeof factory !== 'function') {
    throw new Error('@computesdk/vercel does not export a "vercel" factory');
  }
  ({ compute } = sdk);
  compute.setConfig({ provider: factory(settings.providerOptions) });
}

export async function create(spec) {
  const vcpus = Math.min(spec?.cpus ?? 2, VERCEL_MAX_VCPUS);
  const sandbox = await compute.sandbox.create({
    timeout: SANDBOX_TIMEOUT_MS,
    resources: { vcpus },
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
