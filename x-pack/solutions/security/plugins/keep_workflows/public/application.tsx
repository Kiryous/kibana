import React from 'react';
import ReactDOM from 'react-dom';
import type { AppMountParameters, CoreStart } from '@kbn/core/public';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppPluginStartDependencies } from './types';
import { KeepWorkflowsApp } from './components/app';

const queryClient = new QueryClient();

export const renderApp = (
  { notifications, http }: CoreStart,
  { navigation }: AppPluginStartDependencies,
  { appBasePath, element }: AppMountParameters
) => {
  ReactDOM.render(
    <QueryClientProvider client={queryClient}>
      <KeepWorkflowsApp
        basename={appBasePath}
        notifications={notifications}
        http={http}
        navigation={navigation}
      />
    </QueryClientProvider>,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};
