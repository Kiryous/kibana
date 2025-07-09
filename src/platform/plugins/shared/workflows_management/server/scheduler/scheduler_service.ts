import { Logger } from '@kbn/core/server';
import { WorkflowExecutionEngineModel, WorkflowModel } from '@kbn/workflows';
import { WorkflowsService } from '../workflows_management/workflows_management_service';

export class SchedulerService {
  constructor(
    private readonly logger: Logger,
    private readonly workflowsService: WorkflowsService,
    private readonly workflowsExecutionEngine: {
      // mock
      scheduleStep: (
        workflowRunId: string,
        workflow: WorkflowExecutionEngineModel,
        stepsStack: string[],
        context: Record<string, any>
      ) => Promise<void>;
    }
  ) {}

  public async start() {
    this.logger.info('SchedulerService: Starting');
    const response = await this.workflowsService.searchWorkflows({
      triggerType: 'schedule',
      limit: 100,
      offset: 0,
      _full: true,
    });
    for (const workflow of response.results) {
      this.scheduleWorkflow(workflow);
    }
  }

  public async scheduleWorkflow(workflow: WorkflowModel) {
    this.logger.info(`Scheduling workflow ${workflow.id}`);
    const firstStep = workflow.steps[0];
    if (!firstStep) {
      this.logger.warn(`Workflow ${workflow.id} has no steps`);
      return;
    }
    this.workflowsExecutionEngine.scheduleStep(workflow.id, workflow, [firstStep.id], {});
  }
}
