import React, { useMemo } from 'react';
import { FormattedMessage, I18nProvider } from '@kbn/i18n-react';
import { Route, BrowserRouter as Router, Routes } from '@kbn/shared-ux-router';
import {
  EuiButton,
  EuiPageTemplate,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPageHeader,
  EuiLoadingSpinner,
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiLink,
} from '@elastic/eui';
import type { CoreStart } from '@kbn/core/public';
import type { NavigationPublicPluginStart } from '@kbn/navigation-plugin/public';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Chart, BarSeries, ScaleType, Settings } from '@elastic/charts';
import { WorkflowDetail } from './workflow_detail';
import { Workflow, WorkflowsPaginatedResponse } from '../shared/model/types';

interface KeepWorkflowsAppDeps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  navigation: NavigationPublicPluginStart;
}

const Workflows = ({ http, basename }: { http: CoreStart['http']; basename: string }) => {
  const { data: workflows, isLoading: isLoadingWorkflows } = useQuery<WorkflowsPaginatedResponse>({
    queryKey: ['workflows'],
    queryFn: () => http.post('/api/workflows'),
  });

  const queryClient = useQueryClient();

  const onClickRefreshHandler = () => {
    queryClient.invalidateQueries({ queryKey: ['workflows'] });
  };

  const columns = useMemo<Array<EuiBasicTableColumn<Workflow>>>(
    () => [
      // {
      //   field: 'id',
      //   name: 'ID',
      //   dataType: 'string',
      // },
      {
        field: 'name',
        name: 'Name',
        dataType: 'string',
        render: (name: string, item: Workflow) => (
          <EuiLink>
            <Link to={`/${item.id}`}>{name}</Link>
          </EuiLink>
        ),
      },
      {
        field: 'description',
        name: 'Description',
        dataType: 'string',
      },
      {
        name: 'Last executions',
        render: (item: Workflow) => {
          // return (
          //   <EuiText>
          //     {item.last_executions
          //       ?.map((execution) => `${execution.status} (${execution.execution_time}s)`)
          //       .join(', ')}
          //   </EuiText>
          // );
          const start = item.last_executions?.[item.last_executions.length - 1]?.started;
          if (!start) {
            return (
              <EuiText size="s" color="subdued">
                No executions
              </EuiText>
            );
          }
          const data = item.last_executions?.map((execution) => [
            new Date(execution.started).getTime(),
            execution.execution_time === 0 ? 0.5 : execution.execution_time,
          ]);
          return (
            <Chart size={{ width: 100, height: 20 }}>
              <Settings />
              <BarSeries
                id="data"
                xScaleType={ScaleType.Time}
                yScaleType={ScaleType.Linear}
                xAccessor={0}
                yAccessors={[1]}
                data={data ?? []}
              />
            </Chart>
          );
        },
      },
      {
        name: 'Actions',
        actions: [
          {
            isPrimary: true,
            type: 'button',
            name: 'View logs',
            description: 'View logs',
            color: 'text',
            onClick: (item: Workflow) => {
              // console.log(item);
            },
          },
          {
            isPrimary: true,
            type: 'icon',
            color: 'primary',
            name: 'Run',
            icon: 'play',
            description: 'Run',
            onClick: (item: Workflow) => {},
          },
        ],
      },
    ],
    []
  );

  return (
    <EuiPageTemplate offset={0}>
      <EuiPageTemplate.Header>
        <EuiFlexGroup justifyContent={'spaceBetween'}>
          <EuiFlexItem>
            <EuiPageHeader pageTitle={'Workflows'} />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup>
              <EuiButton color="text" size="s" onClick={onClickRefreshHandler}>
                <FormattedMessage
                  id="keepWorkflows.buttonText"
                  defaultMessage="Refresh"
                  ignoreTag
                />
              </EuiButton>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPageTemplate.Header>
      <EuiPageTemplate.Section>
        {isLoadingWorkflows ? (
          <EuiFlexGroup justifyContent={'center'} alignItems={'center'}>
            <EuiFlexItem grow={false}>
              <EuiLoadingSpinner />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText>Loading workflows...</EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        ) : (
          <EuiBasicTable
            columns={columns}
            items={workflows?.results ?? []}
            responsiveBreakpoint={false}
          />
        )}
      </EuiPageTemplate.Section>
    </EuiPageTemplate>
  );
};

export const KeepWorkflowsApp = ({
  basename,
  notifications,
  http,
  navigation,
}: KeepWorkflowsAppDeps) => {
  // Render the application DOM.
  // Note that `navigation.ui.TopNavMenu` is a stateful component exported on the `navigation` plugin's start contract.
  return (
    <Router basename={basename}>
      <I18nProvider>
        <Routes>
          <Route
            path="/:id"
            render={(props) => (
              <WorkflowDetail
                basename={basename}
                http={http}
                notifications={notifications}
                workflowId={props.match.params.id}
              />
            )}
          />
          <Route path="/" exact render={() => <Workflows http={http} basename={basename} />} />
        </Routes>
      </I18nProvider>
    </Router>
  );
};
