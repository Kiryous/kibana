import type {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '@kbn/core/server';
import {
  ExecutionStatus,
  EsWorkflowExecution,
  WorkflowExecutionEngineModel,
  EsWorkflowStepExecution,
} from '@kbn/workflows';

import { Client } from '@elastic/elasticsearch';

import type {
  WorkflowsExecutionEnginePluginSetup,
  WorkflowsExecutionEnginePluginStart,
  WorkflowsExecutionEnginePluginSetupDeps,
  WorkflowsExecutionEnginePluginStartDeps,
} from './types';
import { StepRunner } from './step-runner/step-runner';
import { TemplatingEngine } from './templating-engine';

import { ConnectorExecutor } from './connector-executor';
import { WORKFLOWS_EXECUTIONS_INDEX, WORKFLOWS_STEP_EXECUTIONS_INDEX } from '../common';

export class WorkflowsExecutionEnginePlugin
  implements Plugin<WorkflowsExecutionEnginePluginSetup, WorkflowsExecutionEnginePluginStart>
{
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

  public setup(core: CoreSetup, plugins: WorkflowsExecutionEnginePluginSetupDeps) {
    this.logger.debug('workflows-execution-engine: Setup');

    return {};
  }

  public start(core: CoreStart, plugins: WorkflowsExecutionEnginePluginStartDeps) {
    this.logger.debug('workflows-execution-engine: Start');

    const executeWorkflow = async (
      workflow: WorkflowExecutionEngineModel,
      context: Record<string, any>
    ) => {
      const workflowRunId = context.workflowRunId;
      const workflowCreatedAt = new Date();
      const workflowStartedAt = new Date();
      let workflowExecutionStatus: ExecutionStatus = ExecutionStatus.RUNNING;
      let workflowExecutionError: string | null = null;
      const triggeredBy = context.triggeredBy || 'manual'; // 'manual' or 'scheduled'
      await this.esClient.index({
        index: WORKFLOWS_EXECUTIONS_INDEX,
        id: workflowRunId,
        refresh: true,
        document: {
          id: workflowRunId,
          workflowId: workflow.id,
          triggers: workflow.triggers,
          steps: workflow.steps,
          status: workflowExecutionStatus,
          createdAt: workflowCreatedAt.toISOString(),
          startedAt: workflowStartedAt.toISOString(),
          error: null,
          createdBy: '', // TODO: set if available
          lastUpdatedAt: workflowCreatedAt.toISOString(),
          lastUpdatedBy: '', // TODO: set if available
          finishedAt: null,
          duration: null,
          tags: [],
          description: '',
          triggeredBy, // <-- new field
        } as any, // EsWorkflowExecution (add triggeredBy to type if needed)
      });

      try {
        const stepRunner = new StepRunner(
          new ConnectorExecutor(
            context.connectorCredentials,
            await plugins.actions.getUnsecuredActionsClient()
          ),
          new TemplatingEngine()
        );

        const stepsContext: any = {
          workflowRunId,
          event: context.event,
          steps: {},
        };

        for (const currentStep of workflow.steps) {
          const workflowExecutionId = `${workflowRunId}-${currentStep.id}`;
          const stepStartedAt = new Date();

          await this.esClient.index({
            index: WORKFLOWS_STEP_EXECUTIONS_INDEX,
            id: workflowExecutionId,
            refresh: true,
            document: {
              id: workflowExecutionId,
              workflowId: workflow.id,
              workflowRunId,
              stepId: currentStep.id,
              status: ExecutionStatus.RUNNING,
              startedAt: stepStartedAt.toISOString(),
              completedAt: null,
              executionTimeMs: null,
              error: null,
              output: null,
            } as any, // EsWorkflowStepExecution
          });

          const stepResult = await stepRunner.runStep(currentStep, stepsContext);

          stepsContext.steps[currentStep.id] = { outputs: stepResult.output };

          let stepStatus: ExecutionStatus;

          if (stepResult.error) {
            stepStatus = ExecutionStatus.FAILED;
          } else {
            stepStatus = ExecutionStatus.COMPLETED;
          }

          const completedAt = new Date();
          const executionTimeMs = completedAt.getTime() - stepStartedAt.getTime();

          await this.esClient.update({
            index: WORKFLOWS_STEP_EXECUTIONS_INDEX,
            id: workflowExecutionId,
            refresh: true,
            doc: {
              status: stepStatus,
              completedAt: completedAt.toISOString(),
              executionTimeMs,
              error: stepResult.error,
              output: stepResult.output,
            } as any, // EsWorkflowStepExecution
          });

          if (stepStatus === ExecutionStatus.FAILED) {
            throw new Error(
              `Step "${currentStep.id}" failed with error: ${stepResult.error || 'Unknown error'}`
            );
          }
        }

        workflowExecutionStatus = ExecutionStatus.COMPLETED;
      } catch (error) {
        workflowExecutionStatus = ExecutionStatus.FAILED;
        workflowExecutionError = error instanceof Error ? error.message : String(error);
      } finally {
        await this.esClient.update({
          index: WORKFLOWS_EXECUTIONS_INDEX,
          id: workflowRunId,
          refresh: true,
          doc: {
            status: workflowExecutionStatus,
            error: workflowExecutionError,
            finishedAt: new Date().toISOString(),
            duration: new Date().getTime() - workflowStartedAt.getTime(),
            lastUpdatedAt: new Date().toISOString(),
            lastUpdatedBy: '', // TODO: set if available
          } as any, // EsWorkflowExecution
        });
      }
    };

    return {
      executeWorkflow,
    };
  }

  public stop() {}
}
