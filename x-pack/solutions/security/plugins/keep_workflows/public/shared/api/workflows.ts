export interface Provider {
  id: string;
  type: string; // This corresponds to the name of the icon, e.g., "slack", "github", etc.
  name: string;
  installed: boolean;
}

export interface Filter {
  key: string;
  value: string;
}

interface IncidentFilter {
  type: 'incident';
  events: string[];
}

interface AlertFilter {
  type: 'alert';
  filters: Filter[];
  cel: string;
  only_on_change: string[];
}

interface IntervalFilter {
  type: 'interval';
  value: string;
}

interface ManualFilter {
  type: 'manual';
}

export type Trigger = IncidentFilter | AlertFilter | IntervalFilter | ManualFilter;

export interface LastWorkflowExecution {
  id: string;
  execution_time: number;
  status: string;
  started: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  created_by: string;
  creation_time: string;
  interval: string;
  providers: Provider[];
  triggers: Trigger[];
  disabled: boolean;
  last_execution_time: string;
  last_execution_status: string;
  last_updated: string;
  workflow_raw: string;
  workflow_raw_id: string;
  last_execution_started?: string;
  last_executions?: LastWorkflowExecution[];
  provisioned?: boolean;
  alertRule?: boolean;
  revision?: number;
  canRun?: boolean;
}

export interface MockProvider {
  type: string;
  config: string;
  with?: {
    command?: string;
    timeout?: number;
    _from?: string;
    to?: string;
    subject?: string;
    html?: string;
  };
}

export interface MockCondition {
  assert: string;
  name: string;
  type: string;
}

export interface MockAction {
  condition: MockCondition[];
  name: string;
  provider: MockProvider;
}

export interface MockStep {
  name: string;
  provider: MockProvider;
}

export interface MockTrigger {
  type: string;
}

export interface MockWorkflow {
  id: string;
  description: string;
  triggers: MockTrigger[];
  owners: any[]; // Adjust the type if you have more specific information about the owners
  services: any[]; // Adjust the type if you have more specific information about the services
  steps: MockStep[];
  actions: MockAction[];
}

export interface WorkflowTemplate {
  name: string;
  workflow: MockWorkflow;
  workflow_raw: string;
  workflow_raw_id: string;
}

export interface PaginatedWorkflowsResults {
  count: number;
  results: Workflow[];
  limit: number;
  offset: number;
}

export interface WorkflowRevision {
  revision: number;
  updated_by: string;
  updated_at: string;
}

export interface WorkflowRevisionList {
  versions: WorkflowRevision[];
}
