// import { useKibana } from '@kbn/kibana-react-plugin/public';

export function showErrorToast(error: unknown, title?: string) {
  //   const notifications = useKibana().services.notifications;
  //   notifications.toasts.addSuccess(error.message);
  alert((error as Error).message);
}
