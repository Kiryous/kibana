import React, { useCallback, useEffect, useRef, useState } from 'react';
import { monaco } from '@kbn/monaco';
import { EuiButton } from '@elastic/eui';
import { css } from '@emotion/react';
import { parseWorkflow } from '../../../../entities/workflows/lib/parser';
import { WorkflowYAMLEditor } from './WorkflowYAMLEditor';
import { WorkflowYamlEditorHeader } from './WorkflowYamlEditorHeader';
import { useProviders } from '../../../model/useProviders';

// Mock types
interface DefinitionV2 {
  isValid: boolean;
  [key: string]: any;
}

interface ValidationError {
  severity: 'error' | 'warning';
  [key: string]: any;
}

// Mock functions
const wrapDefinitionV2 = (definition: any): DefinitionV2 => {
  // TODO: Implement real definition wrapper
  return { ...definition, isValid: true };
};

const getOrderedWorkflowYamlString = (yamlString: string) => {
  // TODO: Implement real YAML ordering
  return yamlString;
};

const useWorkflowActions = () => {
  // TODO: Implement real workflow actions hook
  return {
    updateWorkflow: async (id: string, content: string) => {
      // Mock update
      // console.log('Updating workflow:', id, content);
    },
  };
};

const useWorkflowYAMLEditorStore = () => {
  // TODO: Implement real store hook
  const [workflowId, setWorkflowId] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [saveRequestCount, setSaveRequestCount] = useState(0);

  return {
    setWorkflowId,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    validationErrors,
    setValidationErrors,
    saveRequestCount,
  };
};

// Mock WorkflowTestRunButton component
const WorkflowTestRunButton = ({
  workflowId,
  definition,
  isValid,
  ...props
}: {
  workflowId: string;
  definition: DefinitionV2 | null;
  isValid: boolean;
  [key: string]: any;
}) => {
  // TODO: Implement real test run button
  return (
    <EuiButton size="s" color="primary" disabled={!isValid} {...props}>
      Test Run
    </EuiButton>
  );
};

export function WorkflowYAMLEditorStandalone({
  workflowId,
  yamlString,
  'data-testid': dataTestId = 'wf-yaml-standalone-editor',
}: {
  workflowId: string;
  yamlString: string;
  'data-testid'?: string;
}) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);
  const [isEditorMounted, setIsEditorMounted] = useState(false);
  const [lastDeployedAt, setLastDeployedAt] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [originalContent, setOriginalContent] = useState('');
  const [definition, setDefinition] = useState<DefinitionV2 | null>(null);

  const {
    setWorkflowId,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    validationErrors,
    setValidationErrors,
    saveRequestCount,
  } = useWorkflowYAMLEditorStore();

  useEffect(() => {
    setWorkflowId(workflowId);
  }, [workflowId, setWorkflowId]);

  const isValid = validationErrors?.filter((e) => e.severity === 'error').length === 0;

  const { updateWorkflow } = useWorkflowActions();
  const { data: { providers } = {} } = useProviders();

  const parseYamlToDefinition = useCallback(
    (yamlContent: string) => {
      try {
        setDefinition(
          wrapDefinitionV2({
            ...parseWorkflow(yamlContent, providers ?? []),
            // isValid is not used in the standalone editor, so we set it to true
            isValid: true,
          })
        );
      } catch (error) {
        // console.error('Failed to parse YAML:', error);
      }
    },
    [providers]
  );

  const handleContentChange = (value: string | undefined) => {
    if (!value) {
      return;
    }
    setHasUnsavedChanges(value !== originalContent);
    parseYamlToDefinition(value);
  };

  useEffect(() => {
    setOriginalContent(getOrderedWorkflowYamlString(yamlString));
  }, [yamlString]);

  const handleSaveWorkflow = useCallback(async () => {
    if (!editorRef.current) {
      return;
    }
    if (!workflowId) {
      // console.error('Workflow ID is required to save the workflow');
      return;
    }
    setIsSaving(true);
    const content = editorRef.current.getValue();
    try {
      // sending the yaml string to the backend
      // TODO: validate the yaml content and show useful (inline) errors
      await updateWorkflow(workflowId, content);

      setOriginalContent(content);
      setHasUnsavedChanges(false);
    } catch (err) {
      // console.error('Failed to save workflow:', err);
    } finally {
      setLastDeployedAt(Date.now());
      setIsSaving(false);
    }
  }, [workflowId, updateWorkflow, setHasUnsavedChanges]);

  useEffect(() => {
    if (saveRequestCount > 0) {
      handleSaveWorkflow();
    }
  }, [saveRequestCount, handleSaveWorkflow]);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const model = editor?.getModel();
    if (model) {
      parseYamlToDefinition(model.getValue());
    }

    setIsEditorMounted(true);
  };

  return (
    <div
      css={css`
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
      `}
    >
      <WorkflowYamlEditorHeader
        workflowId={workflowId}
        isInitialized={isEditorMounted}
        lastDeployedAt={lastDeployedAt}
        hasChanges={hasUnsavedChanges}
      >
        <WorkflowTestRunButton
          workflowId={workflowId}
          definition={definition}
          isValid={isValid}
          data-testid="wf-yaml-editor-test-run-button"
        />
        <EuiButton
          color="warning"
          size="s"
          css={css`
            min-width: 7rem;
            position: relative;
            &:disabled {
              opacity: 0.7;
            }
          `}
          isDisabled={!hasUnsavedChanges || isSaving}
          onClick={handleSaveWorkflow}
          data-testid="wf-yaml-editor-save-button"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </EuiButton>
      </WorkflowYamlEditorHeader>
      <WorkflowYAMLEditor
        value={yamlString}
        filename={workflowId ?? 'workflow'}
        workflowId={workflowId}
        onMount={handleEditorDidMount}
        onChange={handleContentChange}
        // @ts-ignore TODO: fix types
        onValidationErrors={setValidationErrors}
        data-testid={dataTestId}
      />
    </div>
  );
}
