import React, { Suspense } from 'react';
import { EuiPanel, EuiCallOut, EuiLoadingSpinner } from '@elastic/eui';
import { css } from '@emotion/react';
import { EmptyBuilderState } from './empty-builder-state';
import { KeepLoader } from '../../components/KeepLoader';
import { useProviders } from '../../shared/model/useProviders';
import { WorkflowBuilder } from './workflow-builder';

// // Using React.lazy instead of Next.js dynamic import
// const Builder = React.lazy(() =>
//   import('./workflow-builder').then((mod) => ({ default: mod.WorkflowBuilder }))
// );

interface Props {
  loadedYamlFileContents: string | null;
  workflowRaw?: string;
  workflowId?: string;
  standalone?: boolean;
}

export function WorkflowBuilderCard({
  loadedYamlFileContents,
  workflowRaw,
  workflowId,
  standalone = false,
}: Props) {
  const {
    data: { providers, installed_providers: installedProviders } = {},
    error,
    isLoading,
  } = useProviders();

  const cardStyles = css`
    padding: 0;
    overflow: hidden;
    ${standalone
      ? `
        height: calc(100vh - 100px);
      `
      : `
        // height: 100%;
        height: calc(100vh - 200px);
        border-radius: 0;
        border-top: 1px solid #d3dae6;
        box-shadow: none;
        outline: none;
      `}
  `;

  if (!providers || isLoading)
    return (
      <EuiPanel css={cardStyles}>
        <KeepLoader loadingText="Loading providers..." />
      </EuiPanel>
    );

  if (error) {
    return (
      <EuiPanel css={cardStyles}>
        <EuiCallOut
          css={css`
            margin-top: 1rem;
          `}
          title="Error"
          iconType="error"
          color="danger"
        >
          Failed to load providers
        </EuiCallOut>
      </EuiPanel>
    );
  }

  if (loadedYamlFileContents === '' && !workflowRaw) {
    return (
      <EuiPanel css={cardStyles}>
        <EmptyBuilderState />
      </EuiPanel>
    );
  }

  return (
    <Suspense fallback={<EuiLoadingSpinner size="l" aria-label="Loading workflow builder..." />}>
      <EuiPanel css={cardStyles}>
        <WorkflowBuilder
          providers={providers}
          installedProviders={installedProviders}
          loadedYamlFileContents={loadedYamlFileContents}
          workflowRaw={workflowRaw}
          workflowId={workflowId}
        />
      </EuiPanel>
    </Suspense>
  );
}
