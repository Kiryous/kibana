import React from 'react';
import { EuiTitle } from '@elastic/eui';
import { css } from '@emotion/react';

// TODO: Replace with proper Kibana relative path when available
// This is a temporary mock for migration
const WorkflowSyncStatus = ({
  workflowId,
  isInitialized,
  lastDeployedAt,
  isChangesSaved,
}: {
  workflowId: string | null;
  isInitialized: boolean;
  lastDeployedAt: number | null;
  isChangesSaved: boolean;
}) => {
  // TODO: Implement real WorkflowSyncStatus component
  return (
    <span
      css={css`
        font-size: 0.875rem;
        color: #6b7280;
      `}
    >
      {isChangesSaved ? 'Saved' : 'Unsaved changes'}
    </span>
  );
};

interface WorkflowYamlEditorHeaderProps {
  workflowId: string | null;
  isInitialized: boolean;
  lastDeployedAt: number | null;
  hasChanges: boolean;
  children: React.ReactNode;
}

export function WorkflowYamlEditorHeader({
  workflowId,
  hasChanges,
  isInitialized,
  lastDeployedAt,
  children,
}: WorkflowYamlEditorHeaderProps) {
  return (
    <div
      css={css`
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        padding: 0.5rem;
        border-bottom: 1px solid #e5e7eb;
      `}
    >
      <div
        css={css`
          display: flex;
          align-items: center;
          gap: 0.5rem;
        `}
      >
        <EuiTitle
          size="m"
          css={css`
            margin-left: ${workflowId ? '0.5rem' : '0'};
            margin-right: ${workflowId ? '0.5rem' : '0'};
          `}
        >
          <h2>{workflowId ? 'Edit' : 'New'} Workflow</h2>
        </EuiTitle>
        <WorkflowSyncStatus
          workflowId={workflowId}
          isInitialized={isInitialized}
          lastDeployedAt={lastDeployedAt}
          isChangesSaved={!hasChanges}
        />
      </div>
      <div
        css={css`
          display: flex;
          gap: 0.5rem;
        `}
      >
        {children}
      </div>
    </div>
  );
}
