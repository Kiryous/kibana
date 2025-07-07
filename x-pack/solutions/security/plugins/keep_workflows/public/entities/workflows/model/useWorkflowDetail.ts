import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import type { StartServices } from '@kbn/cases-plugin/public/types';
import { useKibana } from '@kbn/cases-plugin/public/common/lib/kibana';
import { Workflow } from '../../../shared/model/types';

const useHttp = (): StartServices['http'] => useKibana().services.http;

export function useWorkflowDetail(
  workflowId: string | null,
  workflowRevision: number | null,
  options?: Omit<UseQueryOptions<Workflow>, 'queryKey' | 'queryFn'>
) {
  const http = useHttp();
  const requestUrl = workflowRevision
    ? `/api/workflows/${workflowId}/versions/${workflowRevision}`
    : `/api/workflows/${workflowId}`;

  const {
    data: workflow,
    error,
    isLoading,
  } = useQuery<Workflow>({
    queryKey: ['workflows', 'detail', workflowId, workflowRevision],
    queryFn: () => http.get(requestUrl),
    enabled: !!workflowId,
    ...options,
  });

  return {
    workflow,
    isLoading,
    error,
  };
}
