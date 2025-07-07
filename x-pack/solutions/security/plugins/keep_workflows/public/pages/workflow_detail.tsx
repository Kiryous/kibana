'use client';

import { EuiPanel, EuiTabs, EuiTab, EuiSpacer, EuiSkeletonText, EuiIcon } from '@elastic/eui';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Workflow } from '../shared/api/workflows';
import { WorkflowBuilderWidget } from '../widgets/workflow-builder';
// import WorkflowOverview from './workflow-overview';
// import WorkflowSecrets from "./workflow-secrets";
// import { ErrorComponent } from '../shared/ui';
import { useWorkflowDetail } from '../entities/workflows/model/useWorkflowDetail';
import { WorkflowYAMLEditorStandalone } from '../shared/ui/WorkflowYAMLEditor/ui/WorkflowYAMLEditorStandalone';
import { getOrderedWorkflowYamlString } from '../entities/workflows/lib/yaml-utils';
// import { WorkflowVersions } from "./workflow-versions";
import { useUIBuilderUnsavedChanges } from '../entities/workflows/model/workflow-store';
import { useWorkflowYAMLEditorStore } from '../entities/workflows/model/workflow-yaml-editor-store';

interface TabDefinition {
  id: string;
  name: string;
  icon: string;
  hasUnsavedIndicator?: boolean;
}

export function WorkflowDetailPage({
  params,
  initialData,
}: {
  params: { workflow_id: string };
  initialData?: Workflow;
}) {
  const history = useHistory();
  const location = useLocation();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [selectedTabId, setSelectedTabId] = useState(searchParams.get('tab') || 'overview');

  const isUIBuilderUnsaved = useUIBuilderUnsavedChanges();
  const { hasUnsavedChanges: isYamlEditorUnsaved } = useWorkflowYAMLEditorStore();

  const { workflow, isLoading, error } = useWorkflowDetail(params.workflow_id, null);

  const handleTabClick = useCallback(
    (tabId: string) => {
      setSelectedTabId(tabId);
      const newSearchParams = new URLSearchParams(location.search);
      newSearchParams.set('tab', tabId);
      history.push({
        pathname: location.pathname,
        search: newSearchParams.toString(),
      });
    },
    [history, location]
  );

  // Set initial tab based on URL query param
  useEffect(() => {
    const tab = searchParams.get('tab');
    setSelectedTabId(tab || 'overview');
  }, [searchParams]);

  if (error) {
    return <div>Error</div>;
    // return <ErrorComponent error={error} />;
  }

  const tabs: TabDefinition[] = [
    { id: 'overview', name: 'Overview', icon: 'merge' },
    { id: 'builder', name: 'Builder', icon: 'wrench', hasUnsavedIndicator: isUIBuilderUnsaved },
    {
      id: 'yaml',
      name: 'YAML Definition',
      icon: 'console',
      hasUnsavedIndicator: isYamlEditorUnsaved,
    },
    { id: 'versions', name: 'Versions', icon: 'clock' },
    { id: 'secrets', name: 'Secrets', icon: 'lock' },
  ];

  const renderTabContent = () => {
    switch (selectedTabId) {
      case 'overview':
        return <div>Overview</div>;
      // return <WorkflowOverview workflow={workflow ?? null} workflow_id={params.workflow_id} />;
      case 'builder':
        if (!workflow) {
          return <EuiSkeletonText lines={5} />;
        }
        return (
          <EuiPanel className="h-[calc(100vh-12rem)] p-0 overflow-hidden" hasShadow={false}>
            <WorkflowBuilderWidget workflowRaw={workflow.workflow_raw} workflowId={workflow.id} />
          </EuiPanel>
        );
      case 'yaml':
        if (!workflow || !workflow.workflow_raw) {
          return <EuiSkeletonText lines={5} />;
        }
        return (
          <EuiPanel className="h-[calc(100vh-12rem)] p-0" hasShadow={false}>
            <WorkflowYAMLEditorStandalone
              workflowId={workflow.id}
              yamlString={getOrderedWorkflowYamlString(workflow.workflow_raw)}
              data-testid="wf-detail-yaml-editor"
            />
          </EuiPanel>
        );
      case 'versions':
        return (
          <EuiPanel>
            {/* <WorkflowVersions
              workflowId={params.workflow_id}
              currentRevision={workflow?.revision ?? null}
            /> */}
            <p>Versions panel - coming soon</p>
          </EuiPanel>
        );
      case 'secrets':
        return (
          <EuiPanel>
            {/* <WorkflowSecrets workflowId={params.workflow_id} /> */}
            <p>Secrets panel - coming soon</p>
          </EuiPanel>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <EuiTabs>
        {tabs.map((tab) => (
          <EuiTab
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            isSelected={selectedTabId === tab.id}
          >
            <div className="flex items-center gap-2">
              <EuiIcon type={tab.icon} size="m" />
              {tab.name}
              {tab.hasUnsavedIndicator && (
                <div className="inline-block text-xs size-1.5 rounded-full bg-yellow-500" />
              )}
            </div>
          </EuiTab>
        ))}
      </EuiTabs>
      <EuiSpacer size="m" />
      {renderTabContent()}
    </div>
  );
}
