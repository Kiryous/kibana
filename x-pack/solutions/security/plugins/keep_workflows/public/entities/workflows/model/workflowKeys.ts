import { WorkflowsQuery, WorkflowTemplatesQuery } from './useWorkflowsV2';

export const workflowKeys = {
  all: ['workflows'],
  list: (query: WorkflowsQuery) =>
    [
      workflowKeys.all,
      'list',
      query.cel,
      query.limit,
      query.offset,
      query.sortBy,
      query.sortDir,
    ].filter((p) => p !== undefined && p !== null),
  templates: (query: WorkflowTemplatesQuery) =>
    [workflowKeys.all, 'templates', query.cel, query.limit, query.offset].filter(
      (p) => p !== undefined && p !== null
    ),
  detail: (id: string, revision: number | null) => [workflowKeys.all, 'detail', id, revision],
  revisions: (workflowId: string) => [workflowKeys.all, 'revisions', workflowId],
  getListMatcher: () => (key: string[]) => key[0] === workflowKeys.all[0] && key[1] === 'list',
};
