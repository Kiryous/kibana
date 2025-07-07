import { useHttp } from '@kbn/cases-plugin/public/common/lib/kibana';
import { HttpFetchOptions } from '@kbn/core/public';

export function useApi() {
  const http = useHttp();
  return {
    get: (path: string, options?: HttpFetchOptions) =>
      http.get(path, options).then((res) => res.response?.json()),
    post: (path: string, options?: HttpFetchOptions) =>
      http.post(path, options).then((res) => res.response?.json()),
    put: (path: string, options?: HttpFetchOptions) =>
      http.put(path, options).then((res) => res.response?.json()),
    delete: (path: string, options?: HttpFetchOptions) =>
      http.delete(path, options).then((res) => res.response?.json()),
  };
}
