import React, { useEffect, useRef } from 'react';
import { EuiSpacer, EuiPanel, EuiButton, EuiButtonIcon } from '@elastic/eui';
import { css } from '@emotion/react';
import { StepEditorV2 } from './StepEditor';
import { WorkflowEditorV2 } from './WorkflowEditor';
import { TriggerEditor } from './TriggerEditor';
import { useWorkflowStore } from '../../../../../entities/workflows';
import { WorkflowToolbox } from '../WorkflowToolbox';

const WorkflowStatus = ({ className }: { className?: string }) => {
  // TODO: Replace with proper workflow status component
  return null;
  // <EuiPanel paddingSize="s" className={className}>
  //   <div>Workflow Status (mock)</div>
  // </EuiPanel>
};

const triggerTypes = ['alert', 'incident', 'interval', 'manual'];

const ReactFlowEditor = () => {
  const { selectedNode, selectedEdge, setEditorOpen, editorOpen } = useWorkflowStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  const isTrigger = triggerTypes.includes(selectedNode || '');
  const isStepEditor = !selectedNode?.includes('empty') && !isTrigger;

  useEffect(
    function scrollRelevantEditorIntoView() {
      if (!selectedNode && !selectedEdge) {
        return;
      }
      // Scroll the view to the divider into view when the editor is opened, so the relevant editor is visible
      const timer = setTimeout(() => {
        if (!containerRef.current || !dividerRef.current) {
          return;
        }
        const containerRect = containerRef.current.getBoundingClientRect();
        const dividerRect = dividerRef.current.getBoundingClientRect();
        // Check if the divider is already at the top of the container
        const isAtTop = dividerRect.top <= containerRect.top;

        if (isAtTop) {
          return;
        }
        // Scroll the divider into view
        dividerRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
      return () => clearTimeout(timer); // Cleanup the timer on unmount
    },
    [selectedNode, selectedEdge]
  );

  const showDivider = Boolean(selectedNode || selectedEdge);

  return (
    <div
      css={css`
        transition: transform 0.3s ease;
        position: relative;
        z-index: 50;
      `}
      ref={containerRef}
    >
      <div
        css={css`
          position: absolute;
          top: 0;
          width: 2.5rem;
          height: 2.5rem;
          ${editorOpen ? 'left: 0; transform: translateX(calc(-100% + 3px));' : 'right: 0;'}
        `}
      >
        {!editorOpen ? (
          <div
            css={css`
              display: flex;
              gap: 0.125rem;
              height: 100%;
            `}
          >
            <EuiButtonIcon
              color="primary"
              iconType="gear"
              onClick={() => setEditorOpen(true)}
              data-testid="wf-open-editor-button"
              aria-label="Show step editor"
              style={{
                width: '100%',
                height: '100%',
                borderBottomLeftRadius: '8px',
                borderTopRightRadius: '0',
                borderTopLeftRadius: '0',
                borderBottomRightRadius: '0',
              }}
            />
          </div>
        ) : (
          <div
            css={css`
              display: flex;
              gap: 0.125rem;
              height: 100%;
            `}
          >
            <EuiButtonIcon
              iconType="arrowRight"
              color="primary"
              onClick={() => setEditorOpen(false)}
              data-testid="wf-close-editor-button"
              aria-label="Hide step editor"
              style={{
                width: '100%',
                height: '100%',
                borderBottomLeftRadius: '8px',
                borderTopRightRadius: '0',
                borderTopLeftRadius: '0',
                borderBottomRightRadius: '0',
              }}
            />
          </div>
        )}
      </div>
      {editorOpen && (
        <div
          css={css`
            position: relative;
            flex: 1;
            display: flex;
            flex-direction: column;
            background-color: white;
            border-left: 1px solid #d3dae6;
            overflow-y: auto;
            height: 100%;
            width: 20rem;
            @media (min-width: 1536px) {
              width: 24rem;
            }
          `}
        >
          <WorkflowStatus
            css={css`
              margin: 0.5rem;
              flex-shrink: 0;
            `}
          />
          <WorkflowEditorV2 />
          {showDivider && (
            <div ref={dividerRef}>
              <EuiSpacer size="m" />
            </div>
          )}
          {isTrigger && <TriggerEditor />}
          {isStepEditor && <StepEditorV2 key={selectedNode} />}
          <WorkflowToolbox isDraggable={false} />
        </div>
      )}
    </div>
  );
};

export { ReactFlowEditor };
