import type {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '@kbn/core/server';
import { TaskManagerStartContract } from '@kbn/task-manager-plugin/server';

import type { WorkflowsPluginSetup, WorkflowsPluginStart } from './types';
import { defineRoutes } from './workflows_management/workflows_management_routes';
import { WorkflowsManagementApi } from './workflows_management/workflows_management_api';
import { WorkflowsService } from './workflows_management/workflows_management_service';
import { Client } from '@elastic/elasticsearch';

export class WorkflowsPlugin implements Plugin<WorkflowsPluginSetup, WorkflowsPluginStart> {
  private readonly logger: Logger;
  private esClient: Client = new Client({
    node: 'http://localhost:9200', // or your ES URL
    auth: {
      username: 'elastic',
      password: 'changeme',
    },
  });

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.info('Workflows Management: Setup');
    const router = core.http.createRouter();
    const workflowsService = new WorkflowsService(
      Promise.resolve(this.esClient),
      this.logger,
      '.workflows'
    );
    const api = new WorkflowsManagementApi(workflowsService);

    // Register server side APIs
    defineRoutes(router, api);

    return {
      management: api,
    };
  }

  public start(core: CoreStart, plugins: { taskManager: TaskManagerStartContract }) {
    this.logger.debug('workflows: Start');

    this.logger.debug('workflows: Started');

    const pushEvent = (eventType: string, eventData: Record<string, any>) => {
      try {
        plugins.taskManager.schedule({
          taskType: 'workflow-event',
          params: {
            eventType,
            rawEvent: eventData,
          },
          state: {},
        });
      } catch (error) {
        this.logger.error(`Failed to push event: ${error.message}`);
      }
    };

    // TODO: REMOVE THIS AFTER TESTING
    // Simulate pushing events every 10 seconds for testing purposes
    setInterval(() => {
      pushEvent('detection-rule', {
        ruleId: '123',
        ruleName: 'Example Detection Rule',
        timestamp: new Date().toISOString(),
        severity: 'high',
        description: 'This is an example detection rule that was triggered.',
        additionalData: {
          user: 'jdoe',
          ip: '109.87.123.433',
          action: 'login',
          location: 'New York, USA',
        },
      });
    }, 10000);

    return {
      // async execute workflow
      pushEvent,
    };
  }

  public stop() {}
}
