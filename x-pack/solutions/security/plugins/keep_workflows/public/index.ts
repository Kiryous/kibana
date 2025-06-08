import { KeepWorkflowsPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, Kibana Platform `plugin()` initializer.
export function plugin() {
  return new KeepWorkflowsPlugin();
}
export type { KeepWorkflowsPluginSetup, KeepWorkflowsPluginStart } from './types';
