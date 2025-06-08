import type { NavigationPublicPluginStart } from '@kbn/navigation-plugin/public';

export interface KeepWorkflowsPluginSetup {
  getGreeting: () => string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface KeepWorkflowsPluginStart {}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
