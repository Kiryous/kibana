import React from 'react';
import { EuiButton, EuiTitle } from '@elastic/eui';
import { useRef, useState } from 'react';
import { css } from '@emotion/react';
import { WorkflowBuilderCard } from './workflow-builder-card';
import { useWorkflowStore } from '../../entities/workflows';
// import { WorkflowMetadataModal } from '../../features/workflows/edit-metadata';
// import { WorkflowEnabledSwitch } from '../../features/workflows/enable-disable';
// import { WorkflowSyncStatus } from '../../features/workflows/sync-status/workflow-sync-status';
import { parseWorkflowYamlStringToJSON } from '../../entities/workflows/lib/yaml-utils';
// import { WorkflowTestRunButton } from '../../features/workflows/test-run/ui/workflow-test-run-button';
import { useUIBuilderUnsavedChanges } from '../../entities/workflows/model/workflow-store';

function WorkflowSyncStatus() {
  return <div>WorkflowSyncStatus (mock)</div>;
}

export interface WorkflowBuilderWidgetProps {
  workflowRaw: string | undefined;
  workflowId: string | undefined;
  standalone?: boolean;
}

export function WorkflowBuilderWidget({
  workflowRaw,
  workflowId,
  standalone,
}: WorkflowBuilderWidgetProps) {
  const [fileContents, setFileContents] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const {
    triggerSave,
    updateV2Properties,
    isInitialized,
    lastDeployedAt,
    isEditorSyncedWithNodes,
    canDeploy,
    isSaving,
    v2Properties,
    definition,
  } = useWorkflowStore();
  const isUIBuilderUnsaved = useUIBuilderUnsavedChanges();
  const isChangesSaved = !isUIBuilderUnsaved;

  const isValid = useWorkflowStore((state) => !!state.definition?.isValid);

  // Mock toast function - in a real Kibana plugin, this would come from the notifications service
  const showErrorToast = (error: unknown, title: string) => {
    console.error(`${title}:`, error);
    // In real implementation, you would use:
    // notifications.toasts.addError(error as Error, { title });
  };

  function loadWorkflow() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const fName = file.name;
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      setFileName(fName);
      const contents = readerEvent.target?.result as string;
      try {
        const _ = parseWorkflowYamlStringToJSON(contents);
        setFileContents(contents);
      } catch (error) {
        showErrorToast(error, 'Failed to parse workflow');
        setFileName('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  }

  const handleMetadataSubmit = ({ name, description }: { name: string; description: string }) => {
    updateV2Properties({ name, description });
    setIsEditModalOpen(false);
    // Properties are now synced immediately in the store
    triggerSave();
  };

  return (
    <>
      <main
        css={css`
          margin: 0 auto;
          max-width: 100%;
          display: flex;
          flex-direction: column;
          height: 100%;
        `}
      >
        <div
          css={css`
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            padding: 0.5rem;
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
              workflowId={workflowId ?? null}
              isInitialized={isInitialized}
              lastDeployedAt={lastDeployedAt}
              isChangesSaved={isChangesSaved}
            />
          </div>
          <div
            css={css`
              display: flex;
              gap: 0.5rem;
            `}
          >
            {!workflowRaw && (
              <>
                <EuiButton
                  color="warning"
                  size="m"
                  onClick={loadWorkflow}
                  css={css`
                    min-width: 7rem;
                  `}
                  fill={false}
                  iconType="importAction"
                  isDisabled={!isInitialized}
                >
                  Import from YAML
                </EuiButton>
                <input
                  type="file"
                  id="workflowFile"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </>
            )}
            {/* {isInitialized && <WorkflowEnabledSwitch />} */}
            {workflowRaw && (
              <EuiButton
                color="warning"
                size="m"
                onClick={() => setIsEditModalOpen(true)}
                iconType="pencil"
                css={css`
                  min-width: 7rem;
                `}
                fill={false}
                isDisabled={!isInitialized}
              >
                Edit Metadata
              </EuiButton>
            )}
            <EuiButton
              color="primary"
              size="m"
              css={css`
                min-width: 7rem;
              `}
              onClick={() => triggerSave()}
            >
              Test run
            </EuiButton>
            {/* <WorkflowTestRunButton
              workflowId={workflowId ?? ''}
              definition={definition}
              isValid={isValid}
              data-testid="wf-builder-main-test-run-button"
            /> */}
            <EuiButton
              color="warning"
              size="m"
              css={css`
                min-width: 7rem;
                position: relative;
                &:disabled {
                  opacity: 0.7;
                }
              `}
              isDisabled={!canDeploy || isSaving || !isEditorSyncedWithNodes}
              onClick={() => triggerSave()}
              data-testid="wf-builder-main-save-deploy-button"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </EuiButton>
          </div>
        </div>
        <WorkflowBuilderCard
          loadedYamlFileContents={fileContents}
          workflowRaw={workflowRaw}
          workflowId={workflowId}
          standalone={standalone}
        />
      </main>
      {/* <WorkflowMetadataModal
        isOpen={isEditModalOpen}
        workflow={{
          name: v2Properties?.name || '',
          description: v2Properties?.description || '',
        }}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleMetadataSubmit}
      /> */}
    </>
  );
}
