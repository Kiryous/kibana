import React, { useState, useEffect, useMemo } from 'react';
import { EuiAccordion, EuiTitle, EuiFieldSearch, EuiText, EuiPanel } from '@elastic/eui';
import { css } from '@emotion/react';
import clsx from 'clsx';
import { useWorkflowStore } from '../../../../entities/workflows';
import { V2Step, V2StepTrigger } from '../../../../entities/workflows/model/types';
// import { DynamicImageProviderIcon, TextInput } from '../../../../components/ui';
import { NodeTriggerIcon } from '../../../../entities/workflows/ui/NodeTriggerIcon';
import { triggerTypes } from '../lib/utils';

const DynamicImageProviderIcon = ({
  src,
  alt,
  className,
  width,
  height,
}: {
  src: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      css={css`
        object-fit: contain;
        aspect-ratio: auto;
      `}
    />
  );
};

const TextInput = ({
  type,
  placeholder,
  className,
  value,
  onChange,
}: {
  type: string;
  placeholder: string;
  className?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return <EuiFieldSearch placeholder={placeholder} value={value} onChange={onChange} fullWidth />;
};

interface GroupedMenuBaseProps {
  searchTerm: string;
  resetSearchTerm: () => void;
  isDraggable?: boolean;
}

type GroupedMenuProps = GroupedMenuBaseProps &
  (
    | {
        name: 'Triggers';
        steps: V2StepTrigger[];
      }
    | {
        name: string;
        steps: Array<Omit<V2Step, 'id'>>;
      }
  );

const GroupedMenu = ({
  name,
  steps,
  searchTerm,
  resetSearchTerm,
  isDraggable = true,
}: GroupedMenuProps) => {
  const [isOpen, setIsOpen] = useState(!!searchTerm || isDraggable);
  const { selectedNode, selectedEdge, addNodeBetweenSafe } = useWorkflowStore();

  useEffect(() => {
    setIsOpen(!!searchTerm || !isDraggable);
  }, [searchTerm, isDraggable]);

  const handleAddNode = (
    e: React.MouseEvent<HTMLLIElement>,
    step: V2StepTrigger | Omit<V2Step, 'id'>
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (isDraggable) {
      return;
    }
    const nodeOrEdgeId = selectedNode || selectedEdge;
    const type = selectedNode ? 'node' : 'edge';
    if (!nodeOrEdgeId) {
      return;
    }
    const newNodeId = addNodeBetweenSafe(nodeOrEdgeId, step, type);
    if (newNodeId) {
      resetSearchTerm();
    }
  };

  function IconUrlProvider(data: any) {
    const { type } = data || {};
    if (type === 'alert' || type === 'workflow') return '/keep.png';
    if (type === 'incident' || type === 'workflow') return '/keep.png';
    return `/icons/${type
      ?.replace('step-', '')
      ?.replace('action-', '')
      ?.replace('condition-', '')}-icon.png`;
  }

  const handleDragStart = (event: React.DragEvent<HTMLLIElement>, step: any) => {
    if (!isDraggable) {
      event.stopPropagation();
      event.preventDefault();
    }
    event.dataTransfer.setData('application/reactflow', JSON.stringify(step));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <EuiAccordion
      id={`grouped-menu-${name}`}
      buttonContent={
        <EuiTitle size="xs">
          <h3
            css={css`
              color: #1a1a1a;
              font-weight: 500;
              text-transform: uppercase;
              margin-left: 8px;
            `}
          >
            {name}
          </h3>
        </EuiTitle>
      }
      initialIsOpen={isOpen}
      css={css`
        margin-bottom: 4px;
      `}
    >
      {(isOpen || !isDraggable) && (
        <div
          css={css`
            margin-top: 8px;
            overflow: auto;
            min-width: max-content;
            padding: 8px;
            padding-right: 16px;
          `}
        >
          {steps.length > 0 &&
            steps.map((step) => (
              <div
                key={step.type}
                className={clsx('dndnode', triggerTypes.includes(step.type) && 'rounded-full')}
                onDragStart={(event) => handleDragStart(event, { ...step })}
                draggable={isDraggable}
                title={step.name}
                onClick={(e) => handleAddNode(e, step)}
                css={css`
                  padding: 8px;
                  margin: 4px 0;
                  border: 1px solid #d3d3d3;
                  border-radius: ${triggerTypes.includes(step.type) ? '9999px' : '6px'};
                  cursor: pointer;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  display: flex;
                  justify-content: flex-start;
                  gap: 8px;
                  align-items: center;
                  transition: background-color 0.2s;
                  &:hover {
                    background-color: #f5f5f5;
                  }
                `}
              >
                {step.componentType === 'trigger' ? (
                  <NodeTriggerIcon nodeData={step} />
                ) : (
                  <DynamicImageProviderIcon
                    src={IconUrlProvider(step) || '/keep.png'}
                    alt={step?.type}
                    className="object-contain aspect-auto"
                    width={32}
                    height={32}
                  />
                )}
                <EuiText
                  size="s"
                  css={css`
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  `}
                >
                  {step.name}
                </EuiText>
              </div>
            ))}
        </div>
      )}
    </EuiAccordion>
  );
};

export const WorkflowToolbox = ({ isDraggable }: { isDraggable?: boolean }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [open, setOpen] = useState(true);
  const { toolboxConfiguration, selectedNode, selectedEdge, nodes } = useWorkflowStore();

  const showOnlyTriggers = selectedEdge?.startsWith('etrigger_start');
  // User cannot add conditions inside a condition
  const showConditions =
    !selectedEdge?.endsWith('empty_true') &&
    !selectedEdge?.endsWith('empty_false') &&
    !selectedNode?.endsWith('empty_true') &&
    !selectedNode?.endsWith('empty_false');
  // User cannot add foreach inside a foreach
  const showForeach =
    !selectedEdge?.endsWith('foreach') && !selectedNode?.endsWith('empty_foreach');

  useEffect(() => {
    const isOpen = (!!selectedNode && selectedNode.includes('empty')) || !!selectedEdge;
    setOpen(isOpen);
    setIsVisible(isDraggable || isOpen);
  }, [selectedNode, selectedEdge, isDraggable]);

  const triggerNodeMap = nodes
    .filter((node) => ['interval', 'manual', 'alert', 'incident'].includes(node?.id))
    .reduce((obj: any, node) => {
      obj[node.id] = true;
      return obj;
    }, {} as Record<string, boolean>);

  const filteredGroups = useMemo(() => {
    if (!toolboxConfiguration) {
      return [];
    }
    return (
      toolboxConfiguration.groups
        .filter((group) => {
          if (showOnlyTriggers) {
            return group?.name === 'Triggers';
          }
          if (!showConditions) {
            return group?.name !== 'Conditions' && group?.name !== 'Triggers';
          }
          if (!showForeach) {
            return group?.name !== 'Misc' && group?.name !== 'Triggers';
          }
          return group?.name !== 'Triggers';
        })
        .map((group) => ({
          ...group,
          steps: group?.steps?.filter(
            (step) =>
              step?.name?.toLowerCase().includes(searchTerm?.toLowerCase()) &&
              (!('id' in step) || !triggerNodeMap[step?.id])
          ),
        })) || []
    );
  }, [
    toolboxConfiguration,
    showOnlyTriggers,
    searchTerm,
    triggerNodeMap,
    showConditions,
    showForeach,
  ]);

  const checkForSearchResults =
    searchTerm && !!filteredGroups?.find((group) => group?.steps?.length > 0);

  if (!open) {
    return null;
  }

  return (
    <EuiPanel
      paddingSize="none"
      css={css`
        background-color: white;
        transition: transform 0.3s;
        z-index: 40;
        flex-shrink: 0;
        height: ${isVisible ? '100%' : 'auto'};
        ${!isVisible && 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'}
      `}
    >
      <div
        css={css`
          position: relative;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 0 8px;
        `}
      >
        {/* Sticky header */}
        <div
          css={css`
            position: sticky;
            top: 0;
            left: 0;
            z-index: 10;
            background-color: white;
          `}
        >
          <EuiTitle
            size="s"
            css={css`
              font-weight: 500;
              padding: 8px;
            `}
          >
            <h2>Add {showOnlyTriggers ? 'trigger' : 'step'}</h2>
          </EuiTitle>
          <div
            css={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 8px;
              padding-top: 0;
              background-color: white;
            `}
          >
            <TextInput
              type="text"
              placeholder="Search..."
              className="w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Scrollable list */}
        {(isVisible || checkForSearchResults) && (
          <div
            css={css`
              flex: 1;
              overflow-y: auto;
              padding-top: 8px;
              margin-bottom: 16px;
              overflow-x: hidden;
            `}
          >
            {filteredGroups.length > 0 &&
              filteredGroups.map((group) => (
                <GroupedMenu
                  key={group.name}
                  name={group.name}
                  // TODO: fix type
                  steps={group.steps as any}
                  searchTerm={searchTerm}
                  resetSearchTerm={() => setSearchTerm('')}
                  isDraggable={isDraggable}
                />
              ))}
          </div>
        )}
      </div>
    </EuiPanel>
  );
};
