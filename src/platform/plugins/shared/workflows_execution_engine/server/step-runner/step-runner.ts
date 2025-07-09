import { WorkflowStep } from '@kbn/workflows';
import { TemplatingEngine } from '../templating-engine';
import { ProviderExecutor } from '../provider-executor';

export interface RunStepResult {
  output: Record<string, any> | undefined;
  error: any;
}

export class StepRunner {
  constructor(
    private providerExecutor: ProviderExecutor,
    private templatingEngine: TemplatingEngine
  ) {}

  public async runStep(step: WorkflowStep, context: Record<string, any>): Promise<RunStepResult> {
    const providerInputs = step.inputs || {};

    const renderedInputs = Object.entries(providerInputs).reduce((accumulator, [key, value]) => {
      if (typeof value === 'string') {
        accumulator[key] = this.templatingEngine.render('nunjucks', value, context);
      } else {
        accumulator[key] = value;
      }
      return accumulator;
    }, {} as Record<string, any>);

    try {
      const stepOutput = await this.providerExecutor.execute(
        step.providerType,
        step.providerName,
        renderedInputs
      );
      return {
        output: stepOutput || undefined,
        error: undefined,
      };
    } catch (error) {
      return {
        output: undefined,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
