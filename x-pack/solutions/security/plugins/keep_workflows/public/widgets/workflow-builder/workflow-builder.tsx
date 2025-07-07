import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EuiPanel, EuiButtonIcon, EuiLoadingSpinner } from '@elastic/eui';
import { css } from '@emotion/react';
import { v4 as uuidv4 } from 'uuid';
import { debounce } from 'lodash';
import { ReactFlowProvider } from '@xyflow/react';
import { ReactFlowBuilder } from '../../features/workflows/builder';
import { useWorkflowStore } from '../../entities/workflows';
// import { useWorkflowActions } from '../../entities/workflows/model/useWorkflowActions';
import { WorkflowYAMLEditor } from '../../shared/ui/WorkflowYAMLEditor/ui/WorkflowYAMLEditor';
import {
  getWorkflowDefinition,
  getYamlWorkflowDefinition,
  parseWorkflow,
  wrapDefinitionV2,
} from '../../entities/workflows/lib/parser';
import { ResizableColumns } from '../../shared/ui/ResizableColumns';
import { getOrderedWorkflowYamlStringFromJSON } from '../../entities/workflows/lib/yaml-utils';
// import { useWorkflowSecrets } from '../../utils/hooks/useWorkflowSecrets';

const useWorkflowSecrets = (workflowId: string | null) => {
  return useMemo(
    () => ({
      getSecrets: { data: {} },
    }),
    []
  );
};

interface Provider {
  id: string;
  type: string;
  name: string;
  // Add other provider properties as needed
}

interface Props {
  loadedYamlFileContents: string | null;
  providers: Provider[];
  workflowRaw?: string;
  workflowId?: string;
  installedProviders?: Provider[] | undefined | null;
}

export function WorkflowBuilder({
  loadedYamlFileContents,
  providers,
  workflowRaw,
  workflowId,
  installedProviders,
}: Props) {
  // const { createWorkflow, updateWorkflow } = useWorkflowActions();
  const {
    getSecrets: { data: workflowSecrets },
  } = useWorkflowSecrets(workflowId ?? null);
  const {
    // Definition
    definition,
    setDefinition,
    isLoading,
    setIsLoading,
    // UI State
    saveRequestCount,
    setIsSaving,
    setLastDeployedAt,
    isEditorSyncedWithNodes: synced,
    reset,
    canDeploy,
    initializeWorkflow,
    setProviders,
    setInstalledProviders,
    setSecrets,
    updateFromYamlString,
  } = useWorkflowStore();

  // Mock navigation functions for Kibana context
  const navigateToWorkflow = useCallback((id: string) => {
    // In a real Kibana plugin, this would use:
    // const { services } = useKibana();
    // services.application.navigateToUrl(`/workflows/${id}`);
    // console.log(`Navigate to workflow: ${id}`);
  }, []);

  const [leftColumnMode, setLeftColumnMode] = useState<'yaml' | 'chat' | null>('yaml');

  // Mock search params - in Kibana, this would come from URL state management
  const alertNameFromUrl = null; // searchParams?.get('alertName');
  const alertSourceFromUrl = null; // searchParams?.get('alertSource');

  // Mock toast function - in a real Kibana plugin, this would come from the notifications service
  const showErrorToast = useCallback((error: unknown, title?: string) => {
    // console.error(`${title || 'Error'}:`, error);
    // In real implementation, you would use:
    // const { services } = useKibana();
    // services.notifications.toasts.addError(error as Error, { title });
  }, []);

  useEffect(
    function syncProviders() {
      setProviders(providers);
      setInstalledProviders(installedProviders ?? []);
    },
    [providers, installedProviders, setProviders, setInstalledProviders]
  );

  useEffect(
    function syncSecrets() {
      setSecrets(workflowSecrets ?? {});
    },
    [workflowSecrets, setSecrets]
  );

  // TODO: move to workflow initialization
  useEffect(
    function updateDefinitionFromInput() {
      setIsLoading(true);
      try {
        if (workflowRaw) {
          setDefinition(
            wrapDefinitionV2({
              ...parseWorkflow(workflowRaw, providers),
              isValid: true,
            })
          );
          initializeWorkflow(workflowId ?? null, {
            providers,
            installedProviders: installedProviders ?? [],
            secrets: workflowSecrets ?? {},
          });
        } else if (loadedYamlFileContents == null) {
          const alertUuid = uuidv4();
          let triggers = {};
          if (alertNameFromUrl && alertSourceFromUrl) {
            triggers = {
              alert: { source: alertSourceFromUrl, name: alertNameFromUrl },
            };
          }
          const workflowDefinition = getWorkflowDefinition(
            alertUuid,
            '',
            '',
            false,
            {},
            [],
            [],
            triggers
          );
          const wrappedDefinition = wrapDefinitionV2({
            ...workflowDefinition,
            isValid: true,
          });
          setDefinition(wrappedDefinition);
          initializeWorkflow(workflowId ?? null, {
            providers,
            installedProviders: installedProviders ?? [],
            secrets: workflowSecrets ?? {},
          });
        } else {
          const parsedDefinition = parseWorkflow(loadedYamlFileContents!, providers);
          setDefinition(
            wrapDefinitionV2({
              ...parsedDefinition,
              isValid: true,
            })
          );
          initializeWorkflow(workflowId ?? null, {
            providers,
            installedProviders: installedProviders ?? [],
            secrets: workflowSecrets ?? {},
          });
        }
      } catch (error) {
        showErrorToast(error, 'Failed to load workflow');
      }
      setIsLoading(false);
    },
    [
      loadedYamlFileContents,
      workflowRaw,
      alertNameFromUrl,
      alertSourceFromUrl,
      providers,
      installedProviders,
      workflowSecrets,
      workflowId,
      setDefinition,
      setIsLoading,
      initializeWorkflow,
      showErrorToast,
    ]
  );

  const workflowYaml = useMemo(() => {
    if (!definition?.value) {
      return null;
    }
    return getOrderedWorkflowYamlStringFromJSON({
      workflow: getYamlWorkflowDefinition(definition.value),
    });
  }, [definition?.value]);

  const saveWorkflow = useCallback(async () => {
    // console.log('saveWorkflow', definition?.value);
  }, []);

  // // TODO: move to workflow initialization or somewhere upper
  // const saveWorkflow = useCallback(async () => {
  //   if (!definition?.value) {
  //     showErrorToast(new Error('Workflow is not initialized'));
  //     return;
  //   }
  //   if (!synced) {
  //     showErrorToast(
  //       new Error('Please save the previous step or wait while properties sync with the workflow.')
  //     );
  //     return;
  //   }
  //   if (!canDeploy) {
  //     showErrorToast(new Error('Please fix the errors in the workflow before saving.'));
  //     return;
  //   }
  //   try {
  //     setIsSaving(true);
  //     if (workflowId) {
  //       await updateWorkflow(workflowId, definition.value);
  //       // TODO: mark workflow as deployed to cloud
  //     } else {
  //       const response = await createWorkflow(definition.value);
  //       if (response?.workflow_id) {
  //         navigateToWorkflow(response.workflow_id);
  //       }
  //     }
  //     setLastDeployedAt(Date.now());
  //   } catch (error) {
  //     showErrorToast(error);
  //   } finally {
  //     setIsSaving(false);
  //   }
  // }, [
  //   synced,
  //   canDeploy,
  //   definition?.value,
  //   setIsSaving,
  //   workflowId,
  //   updateWorkflow,
  //   createWorkflow,
  //   navigateToWorkflow,
  //   setLastDeployedAt,
  //   showErrorToast,
  // ]);

  const lastSaveRequestCount = useRef(saveRequestCount);
  // save workflow on "Deploy" button click
  // useEffect(() => {
  //   if (saveRequestCount && saveRequestCount !== lastSaveRequestCount.current) {
  //     saveWorkflow();
  //     lastSaveRequestCount.current = saveRequestCount;
  //   }
  // }, [saveRequestCount, saveWorkflow]);

  // useEffect(
  //   function resetZustandStateOnUnMount() {
  //     return () => {
  //       // Remove console.log in production
  //       // console.log('resetting zustand state');
  //       reset();
  //     };
  //   },
  //   [reset]
  // );

  const handleYamlChange = useMemo(
    () =>
      debounce((yamlString: string | undefined) => {
        if (!yamlString) {
          return;
        }
        updateFromYamlString(yamlString);
      }, 1000),
    [updateFromYamlString]
  );

  if (isLoading) {
    return (
      <EuiPanel
        css={css`
          padding: 1rem;
          margin: 1.5rem auto 0 auto;
          @media (min-width: 768px) {
            padding: 2.5rem;
          }
        `}
        paddingSize="l"
      >
        <div
          css={css`
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
          `}
        >
          <EuiLoadingSpinner size="xl" />
          <div
            css={css`
              margin-top: 1rem;
              font-size: 1.125rem;
            `}
          >
            Loading workflow...
          </div>
        </div>
      </EuiPanel>
    );
  }

  return (
    <ResizableColumns initialLeftWidth={leftColumnMode !== null ? 33 : 0}>
      <>
        <div
          css={css`
            visibility: ${leftColumnMode === 'yaml' ? 'visible' : 'hidden'};
            height: ${leftColumnMode === 'yaml' ? '100%' : '0'};
            display: ${leftColumnMode === 'yaml' ? 'block' : 'none'};
            position: relative;
          `}
        >
          <WorkflowYAMLEditor
            value={workflowYaml ?? ''}
            filename={workflowId ?? 'workflow'}
            workflowId={workflowId}
            data-testid="wf-builder-yaml-editor"
            onChange={handleYamlChange}
          />
        </div>
        <div
          css={css`
            visibility: ${leftColumnMode === 'chat' ? 'visible' : 'hidden'};
            height: ${leftColumnMode === 'chat' ? '100%' : '0'};
            display: ${leftColumnMode === 'chat' ? 'block' : 'none'};
          `}
        >
          {/* <WorkflowBuilderChatSafe
            definition={definition}
            installedProviders={installedProviders ?? []}
          /> */}
        </div>
      </>
      <>
        <div
          css={css`
            position: relative;
            height: 100%;
          `}
        >
          <div
            css={css`
              position: absolute;
              top: 0;
              left: 0;
              width: 2.5rem;
              height: 2.5rem;
              z-index: 50;
            `}
          >
            {leftColumnMode !== 'yaml' ? (
              <EuiButtonIcon
                css={css`
                  width: 100%;
                  height: 100%;
                `}
                onClick={() => setLeftColumnMode('yaml')}
                iconType="editorCodeBlock"
                aria-label="Show YAML editor"
                data-testid="wf-open-editor-button"
              />
            ) : (
              <EuiButtonIcon
                css={css`
                  width: 100%;
                  height: 100%;
                `}
                onClick={() => setLeftColumnMode(null)}
                iconType="editorCodeBlock"
                aria-label="Hide YAML editor"
                data-testid="wf-close-yaml-editor-button"
                color="warning"
              />
            )}
          </div>
          <div
            css={css`
              position: absolute;
              top: 2.5rem;
              left: 0;
              width: 2.5rem;
              height: 2.5rem;
              z-index: 50;
            `}
          >
            {leftColumnMode !== 'chat' ? (
              <EuiButtonIcon
                css={css`
                  width: 100%;
                  height: 100%;
                `}
                onClick={() => setLeftColumnMode('chat')}
                iconType="sparkles"
                aria-label="Show AI Assistant"
                data-testid="wf-open-chat-button"
              />
            ) : (
              <EuiButtonIcon
                css={css`
                  width: 100%;
                  height: 100%;
                `}
                onClick={() => setLeftColumnMode(null)}
                iconType="sparkles"
                aria-label="Hide AI Assistant"
                data-testid="wf-close-chat-button"
                color="warning"
              />
            )}
          </div>
          <ReactFlowProvider>
            <ReactFlowBuilder />
          </ReactFlowProvider>
        </div>
      </>
    </ResizableColumns>
  );
}
