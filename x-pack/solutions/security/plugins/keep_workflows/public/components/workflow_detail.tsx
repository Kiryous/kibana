import {
  EuiPageTemplate,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiIcon,
  EuiText,
  EuiPageHeader,
  EuiButton,
} from '@elastic/eui';
import { CoreStart } from '@kbn/core/public';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { FormattedMessage } from '@kbn/i18n-react';
import { Link } from 'react-router-dom';
import { Workflow } from '../model/types';
import { WorkflowBuilder } from './workflow_builder';

export const WorkflowDetail = ({
  basename,
  http,
  notifications,
  workflowId,
}: {
  basename: string;
  http: CoreStart['http'];
  notifications: CoreStart['notifications'];
  workflowId: string;
}) => {
  const { data: workflow, isLoading: isLoadingWorkflow } = useQuery<Workflow>({
    queryKey: ['workflow', workflowId],
    queryFn: () => http.get(`/api/workflows/${workflowId}`),
    enabled: !!workflowId,
  });
  const onClickHandler = () => {};

  return (
    <>
      <EuiPageTemplate offset={0}>
        <EuiPageTemplate.Header>
          <EuiFlexGroup>
            <EuiFlexGroup justifyContent={'spaceBetween'} alignItems={'flexEnd'}>
              <EuiFlexItem>
                <EuiLink>
                  <Link to="/">
                    <EuiFlexGroup justifyContent={'flexStart'} alignItems={'center'} gutterSize="s">
                      <EuiFlexItem grow={false} shrink={true}>
                        <EuiIcon type="arrowLeft" size="s" />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false} shrink={true}>
                        <EuiText>Back to all workflows</EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </Link>
                </EuiLink>
                <EuiPageHeader pageTitle={workflow?.name ?? ''} />
                <EuiText>{workflow?.description ?? ''}</EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiFlexGroup gutterSize="s">
                  <EuiButton color="text" size="s" onClick={onClickHandler}>
                    <FormattedMessage
                      id="keepWorkflows.buttonText"
                      defaultMessage="Save"
                      ignoreTag
                    />
                  </EuiButton>
                  <EuiButton iconType="play" size="s" onClick={onClickHandler}>
                    <FormattedMessage
                      id="keepWorkflows.buttonText"
                      defaultMessage="Run"
                      ignoreTag
                    />
                  </EuiButton>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexGroup>
        </EuiPageTemplate.Header>
        <EuiPageTemplate.Section>
          <WorkflowBuilder
            http={http}
            notifications={notifications}
            workflowYaml={workflow?.workflow_raw ?? ''}
          />
        </EuiPageTemplate.Section>
      </EuiPageTemplate>
    </>
  );
};
