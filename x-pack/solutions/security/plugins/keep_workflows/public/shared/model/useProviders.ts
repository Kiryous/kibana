import { useQuery } from '@tanstack/react-query';
import { useKibana } from '@kbn/kibana-react-plugin/public';
import { ProvidersResponse } from '../api/providers';

export const useProviders = () => {
  const http = useKibana().services.http;
  // const api = useApi();

  return useQuery<ProvidersResponse>(['providers'], () =>
    http ? http.get('/api/providers') : Promise.resolve({ providers: [] })
  );
};
