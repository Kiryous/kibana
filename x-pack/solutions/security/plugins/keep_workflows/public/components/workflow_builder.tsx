import { EuiFlexGroup, EuiFlexItem, EuiLoadingSpinner } from '@elastic/eui';
import { css } from '@emotion/react';
import { CodeEditor } from '@kbn/code-editor';
import { CoreStart } from '@kbn/core/public';
import { i18n } from '@kbn/i18n';
import { configureMonacoYamlSchema } from '@kbn/monaco';
import React, { useState, useEffect } from 'react';
import { Graph } from '@kbn/cloud-security-posture-graph';
import type { NodeViewModel, EdgeViewModel } from '@kbn/cloud-security-posture-graph';
import yaml from 'yaml';
import { name } from 'mustache';

export const YAMLCodeEditor = ({
  http,
  notifications,
  workflowYaml,
}: {
  http: CoreStart['http'];
  notifications: CoreStart['notifications'];
  workflowYaml: string;
}) => {
  // Editor-related, TODO: move to a separate component
  const [jsonSchema, setJsonSchema] = useState<any>(null);
  const [monacoYamlInitialized, setMonacoYamlInitialized] = useState(false);

  useEffect(() => {
    http.get('/api/workflow-json-schema').then((res) => {
      setJsonSchema(res);
      // Use the core notifications service to display a success message.
      // notifications.toasts.addSuccess(
      //   i18n.translate('keepWorkflows.dataUpdated', {
      //     defaultMessage: 'Data updated',
      //   })
      // );
    });
  }, []);

  useEffect(() => {
    configureMonacoYamlSchema([
      {
        uri: 'file:///workflow-schema.json',
        // uri: '/api/workflow-json-schema',
        fileMatch: ['*'],
        schema: jsonSchema,
      },
    ]);
    setMonacoYamlInitialized(true);
  }, [jsonSchema]);

  if (!monacoYamlInitialized) {
    return <EuiLoadingSpinner />;
  }
  return (
    <CodeEditor
      languageId="yaml"
      width="100%"
      height="calc(100vh - 300px)"
      value={workflowYaml}
      options={{
        minimap: { enabled: false },
        lineNumbers: 'on',
        glyphMargin: true,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        lineNumbersMinChars: 2,
        insertSpaces: true,
        fontSize: 14,
        renderWhitespace: 'all',
        wordWrap: 'on',
        wordWrapColumn: 80,
        wrappingIndent: 'indent',
        quickSuggestions: {
          other: true,
          comments: false,
          strings: true,
        },
        formatOnType: true,
      }}
    />
  );
};

function getNodesAndEdgesFromYaml(workflowYaml: string) {
  const workflow = yaml.parse(workflowYaml);
  const nodes: NodeViewModel[] = [];
  const edges: EdgeViewModel[] = [];
  const allSteps = [
    ...workflow.workflow.steps.map((s: any) => ({ ...s, type: 'step' })),
    ...workflow.workflow.actions.map((a: any) => ({ ...a, type: 'action' })),
  ];
  allSteps.forEach((step: any, index: number) => {
    nodes.push({
      id: step.name,
      // name: step.name,
      color: step.type === 'step' ? 'primary' : 'warning',
      shape: 'rectangle',
      data: {
        label: step.name,
      },
    });
    if (index > 0) {
      const prevStep = workflow.workflow.steps[index - 1];
      edges.push({
        id: `${prevStep.name}-${step.name}`,
        source: prevStep.name,
        target: step.name,
        color: 'primary',
      });
    }
  });
  return { nodes, edges };
}

const WorkflowGraphPreview = ({ workflowYaml }: { workflowYaml: string }) => {
  if (!workflowYaml) {
    return <EuiLoadingSpinner />;
  }
  const { nodes, edges } = getNodesAndEdgesFromYaml(workflowYaml);
  return (
    <Graph
      css={css`
        height: 500px;
        width: 100%;
      `}
      nodes={nodes}
      edges={edges}
      interactive={true}
      isLocked={false}
    />
  );
};

export const WorkflowBuilder = ({
  http,
  notifications,
  workflowYaml,
}: {
  http: CoreStart['http'];
  notifications: CoreStart['notifications'];
  workflowYaml: string;
}) => {
  return (
    <EuiFlexGroup>
      <EuiFlexItem>
        <YAMLCodeEditor http={http} notifications={notifications} workflowYaml={workflowYaml} />
      </EuiFlexItem>
      <EuiFlexItem>
        <WorkflowGraphPreview workflowYaml={workflowYaml} />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
