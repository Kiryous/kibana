interface LastWorkflowExecution {
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
  providers: any[];
  triggers: any[];
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

export interface WorkflowsPaginatedResponse {
  count: number;
  results: Workflow[];
  limit: number;
  offset: number;
}
