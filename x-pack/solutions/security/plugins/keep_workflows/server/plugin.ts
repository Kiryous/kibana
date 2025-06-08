import type {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '@kbn/core/server';

import type { KeepWorkflowsPluginSetup, KeepWorkflowsPluginStart } from './types';
import { defineRoutes } from './routes';

export class KeepWorkflowsPlugin
  implements Plugin<KeepWorkflowsPluginSetup, KeepWorkflowsPluginStart>
{
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('KeepWorkflows: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('KeepWorkflows: Started');
    return {};
  }

  public stop() {}
}
