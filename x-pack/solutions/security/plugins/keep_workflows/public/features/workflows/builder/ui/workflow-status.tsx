import React from 'react';
import { EuiCallOut, EuiText, EuiPanel } from '@elastic/eui';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { ValidationError } from '../../../../entities/workflows/lib/validate-definition';
import { useWorkflowStore } from '../../../../entities/workflows';

function ErrorList({
  validationErrors,
  onErrorClick,
}: {
  validationErrors: Record<string, ValidationError>;
  onErrorClick: (id: string) => void;
}) {
  const textSummary = `${Object.keys(validationErrors).length} error${
    Object.keys(validationErrors).length === 1 ? '' : 's'
  }`;
  return (
    <EuiPanel
      paddingSize="s"
      css={css`
        margin-top: 8px;
      `}
    >
      <details
        css={css`
          display: flex;
          flex-direction: column;
          gap: 4px;
        `}
      >
        <summary
          css={css`
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
          `}
        >
          {textSummary}
        </summary>
        <div
          css={css`
            display: flex;
            flex-direction: column;
            gap: 4px;
          `}
        >
          {Object.entries(validationErrors).map(([id, error]) => (
            <div key={id}>
              {!id.startsWith('workflow_') && (
                <span
                  css={css`
                    font-weight: 500;
                    &:hover {
                      text-decoration: underline;
                    }
                    cursor: pointer;
                  `}
                  onClick={() => onErrorClick(id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onErrorClick(id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  {id}:
                </span>
              )}{' '}
              {error[0]}
            </div>
          ))}
        </div>
      </details>
    </EuiPanel>
  );
}

export const WorkflowStatus = ({ className }: { className?: string }) => {
  const { validationErrors, canDeploy, nodes, edges, setSelectedNode, setSelectedEdge } =
    useWorkflowStore();

  const handleErrorClick = (id: string) => {
    if (id === 'trigger_end') {
      const addStepEdge = edges.find((edge) => edge.source === 'trigger_end');
      if (addStepEdge) {
        setSelectedEdge(addStepEdge.id);
      }
    } else if (id === 'trigger_start') {
      const addTriggerEdge = edges.find((edge) => edge.source === 'trigger_start');
      if (addTriggerEdge) {
        setSelectedEdge(addTriggerEdge.id);
      }
    } else {
      const node = nodes.find((node) => node.id === id || node.data.name === id);
      if (node) {
        setSelectedNode(node.id);
      }
    }
  };

  if (Object.keys(validationErrors).length === 0) {
    return (
      <EuiCallOut
        title="Workflow is valid"
        color="success"
        iconType="checkInCircleFilled"
        size="s"
        className={clsx(className)}
        css={css`
          border-radius: 6px;
          padding: 8px;
          font-size: 14px;
        `}
      >
        <EuiText size="s">It can be deployed and run</EuiText>
      </EuiCallOut>
    );
  }
  if (canDeploy) {
    return (
      <EuiCallOut
        title="Workflow has errors"
        color="warning"
        iconType="alert"
        size="s"
        className={clsx(className)}
        css={css`
          border-radius: 6px;
          padding: 8px;
          font-size: 14px;
        `}
      >
        <EuiText size="s">It can be saved, but to run it, fix errors</EuiText>
        {/* TODO: fix In HTML, <summary> cannot be a descendant of <p>. */}
        <ErrorList validationErrors={validationErrors} onErrorClick={handleErrorClick} />
      </EuiCallOut>
    );
  }
  return (
    <EuiCallOut
      title="Fix the errors before saving"
      color="danger"
      iconType="cross"
      size="s"
      className={clsx(className)}
      css={css`
        border-radius: 6px;
        padding: 8px;
        font-size: 14px;
      `}
    >
      <ErrorList validationErrors={validationErrors} onErrorClick={handleErrorClick} />
    </EuiCallOut>
  );
};
