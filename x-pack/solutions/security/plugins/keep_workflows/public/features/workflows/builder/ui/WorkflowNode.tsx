import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { EuiToolTip, EuiIcon } from '@elastic/eui';
import { css } from '@emotion/react';
import { NodeMenu } from './NodeMenu';
import { FlowNode, useWorkflowStore } from '../../../../entities/workflows';
import { ValidationError } from '../../../../entities/workflows/lib/validate-definition';

function useConfig() {
  return { data: { KEEP_WORKFLOW_DEBUG: false } };
}

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
        object-fit: cover;
      `}
    />
  );
};

const NodeTriggerIcon = ({ nodeData }: { nodeData: any }) => {
  return <EuiIcon type="play" size="l" />;
};

const Tooltip = ({
  content,
  className,
  children,
}: {
  content: string;
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <EuiToolTip content={content}>
      <div className={className}>{children}</div>
    </EuiToolTip>
  );
};

const normalizeStepType = (type: string) =>
  type?.replace('step-', '')?.replace('action-', '')?.replace('condition-', '') || '';
const triggerTypes = ['manual', 'alert', 'incident', 'interval'];

const getTriggerDescriptionFromStep = (data: any) => {
  return data?.type || 'Trigger';
};

export function DebugNodeInfo({ id, data }: Pick<FlowNode, 'id' | 'data'>) {
  const { data: config } = useConfig();
  if (!config?.KEEP_WORKFLOW_DEBUG) {
    return null;
  }
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 0;
        bottom: 0;
        margin: auto 0;
        right: 0;
        transform: translateX(calc(100% + 20px));
      `}
    >
      <div
        css={css`
          height: fit-content;
          background-color: black;
          color: #ec4899;
          font-family: monospace;
          font-size: 10px;
          padding: 4px;
        `}
      >
        {id}
      </div>
      <details
        css={css`
          background-color: black;
          color: #ec4899;
          font-family: monospace;
          font-size: 10px;
          padding: 4px;
        `}
      >
        <summary>data=</summary>
        <pre
          css={css`
            font-size: 12px;
            line-height: 1;
            color: #6b7280;
          `}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function IconUrlProvider(data: FlowNode['data']) {
  const { type } = data || {};
  if (type === 'alert' || type === 'workflow' || type === 'trigger' || !type) return '/keep.png';
  if (type === 'incident' || type === 'workflow' || type === 'trigger' || !type) return '/keep.png';
  return `/icons/${normalizeStepType(type)}-icon.png`;
}

function ErrorIcon({ error }: { error: ValidationError | null }) {
  if (!error) {
    return null;
  }
  const errorMessage = error?.[0];
  const severity = error?.[1];
  switch (severity) {
    case 'error': {
      return (
        <Tooltip
          content={errorMessage}
          css={css`
            text-align: center;
            max-width: 12rem;
            font-size: 0.875rem;
          `}
        >
          <EuiIcon type="crossInACircleFilled" color="danger" size="m" />
        </Tooltip>
      );
    }
    case 'warning': {
      return (
        <Tooltip
          content={errorMessage}
          css={css`
            text-align: center;
            max-width: 12rem;
            font-size: 0.875rem;
          `}
        >
          <EuiIcon type="alert" color="warning" size="m" />
        </Tooltip>
      );
    }
    default: {
      return null;
    }
  }
}

export function WorkflowNode({ id, data }: FlowNode) {
  const {
    selectedNode,
    setSelectedNode,
    isEditorSyncedWithNodes: synced,
    validationErrors,
  } = useWorkflowStore();
  const type = normalizeStepType(data?.type ?? '');

  const isEmptyNode = !!data?.type?.includes('empty');
  const specialNodeCheck = ['start', 'end'].includes(type);
  const error = validationErrors?.[data?.name || ''] || validationErrors?.[data?.id || ''];
  const isError = error?.[1] === 'error';
  const isWarning = error?.[1] === 'warning';
  const isTrigger = data?.componentType === 'trigger' && triggerTypes.includes(type);

  function handleNodeClick(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    if (!synced) {
      toast('Please save the previous step or wait while properties sync with the workflow.');
      return;
    }
    if (data?.notClickable) {
      return;
    }
    if (specialNodeCheck || id?.includes('end')) {
      return;
    }
    setSelectedNode(id);
  }

  if (data.id === 'trigger_start' || data.id === 'trigger_end' || data.id === 'end') {
    return (
      <div
        css={css`
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          ${data.id === 'end' && 'opacity: 0;'}
        `}
      >
        <DebugNodeInfo id={id} data={data} />
        <div
          css={css`
            background-color: #f9fafb;
            border: 1px solid #6b7280;
            padding: 4px 12px;
            position: relative;
            text-transform: capitalize;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            border-radius: ${data.id === 'trigger_start' ? '9999px' : '6px'};
          `}
        >
          {data.name}
        </div>
        {data.id !== 'trigger_start' && <Handle type="target" position={Position.Top} />}
        {data.id !== 'end' && <Handle type="source" position={Position.Bottom} />}
      </div>
    );
  }

  const displayName = data?.name;
  const subtitle = isTrigger ? getTriggerDescriptionFromStep(data) : data?.type;

  return (
    <>
      {!specialNodeCheck && (
        <div
          css={css`
            display: flex;
            border: 2px solid
              ${id === selectedNode
                ? '#f97316'
                : isError && id !== selectedNode
                ? '#ef4444'
                : isWarning && id !== selectedNode
                ? '#eab308'
                : '#a8a29e'};
            width: 100%;
            height: 100%;
            cursor: pointer;
            transition: colors 0.2s;
            background-color: ${id === selectedNode ? '#fff7ed' : '#ffffff'};
            border-radius: ${isTrigger ? '9999px' : '6px'};
            border-style: ${isEmptyNode ? 'dashed' : 'solid'};
            opacity: ${data.isLayouted ? 1 : 0};

            &:hover {
              background-color: ${id !== selectedNode ? '#f9fafb' : '#fff7ed'};
            }
          `}
          onClick={handleNodeClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNodeClick(e as any);
            }
          }}
          role="button"
          tabIndex={0}
          data-testid="workflow-node"
        >
          <DebugNodeInfo id={id} data={data} />
          {isEmptyNode && (
            <div
              css={css`
                padding: 8px;
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
              `}
            >
              <EuiIcon type="plus" size="xl" color="#4b5563" />
              {selectedNode === id && (
                <div
                  css={css`
                    color: #4b5563;
                    font-weight: bold;
                    text-align: center;
                  `}
                >
                  Go to Toolbox
                </div>
              )}
            </div>
          )}
          {!isEmptyNode && (
            <div
              css={css`
                padding: 8px 16px;
                flex: 1;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                flex-wrap: wrap;
              `}
            >
              {data.componentType === 'trigger' ? (
                <NodeTriggerIcon
                  key={data?.type === 'alert' ? data?.properties?.filters?.source : data?.id}
                  nodeData={data}
                />
              ) : (
                <DynamicImageProviderIcon
                  src={IconUrlProvider(data) || '/keep.png'}
                  alt={data?.type}
                  css={css`
                    object-fit: cover;
                    width: 2rem;
                    height: 2rem;
                  `}
                  width={32}
                  height={32}
                />
              )}
              <div
                css={css`
                  flex: 1;
                  display: flex;
                  flex-direction: column;
                  flex-wrap: wrap;
                  min-width: 0;
                `}
              >
                <div
                  css={css`
                    font-size: 18px;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    line-height: 1.25;
                  `}
                >
                  <span
                    css={css`
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                    `}
                    title={displayName}
                  >
                    {displayName}
                  </span>
                  <ErrorIcon error={error} />
                </div>
                <div
                  css={css`
                    color: #6b7280;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  `}
                >
                  {subtitle}
                </div>
              </div>
              <div>
                <NodeMenu data={data as any} id={id} />
              </div>
            </div>
          )}

          <Handle type="target" position={Position.Top} />
          <Handle type="source" position={Position.Bottom} />
        </div>
      )}

      {specialNodeCheck && (
        <div
          css={css`
            opacity: ${data.isLayouted ? 1 : 0};
          `}
          onClick={(e) => {
            e.stopPropagation();
            if (!synced) {
              alert(
                'Please save the previous step or wait while properties sync with the workflow.'
              );
              return;
            }
            if (specialNodeCheck || id?.includes('end')) {
              return;
            }
            setSelectedNode(id);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              if (!synced) {
                alert(
                  'Please save the previous step or wait while properties sync with the workflow.'
                );
                return;
              }
              if (specialNodeCheck || id?.includes('end')) {
                return;
              }
              setSelectedNode(id);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div
            css={css`
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            `}
          >
            {type === 'start' && (
              <div
                css={css`
                  width: 80px;
                  height: 80px;
                  background-color: #f97316;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin-bottom: 8px;
                `}
              >
                <EuiIcon type="play" size="xxl" color="white" />
              </div>
            )}
            {type === 'end' && (
              <div
                css={css`
                  width: 80px;
                  height: 80px;
                  background-color: #f97316;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin-bottom: 8px;
                `}
              >
                <EuiIcon type="stop" size="xxl" color="white" />
              </div>
            )}
            {['threshold', 'assert', 'foreach'].includes(type) && (
              <div
                css={css`
                  border: 2px solid ${id === selectedNode ? '#f97316' : '#a8a29e'};
                `}
              >
                {id.includes('end') ? (
                  <div
                    css={css`
                      width: 80px;
                      height: 80px;
                      border-radius: 4px;
                      background-color: rgba(255, 255, 255, 0.4);
                      padding: 8px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    `}
                  >
                    <EuiIcon type="stop" size="xxl" />
                  </div>
                ) : (
                  <DynamicImageProviderIcon
                    src={IconUrlProvider(data) || '/keep.png'}
                    alt={data?.type}
                    css={css`
                      object-fit: contain;
                      width: 5rem;
                      height: 5rem;
                      border-radius: 4px;
                      background-color: rgba(255, 255, 255, 0.4);
                      padding: 0.5rem;
                    `}
                    width={32}
                    height={32}
                  />
                )}
              </div>
            )}
            {'start' === type && <Handle type="source" position={Position.Bottom} />}

            {'end' === type && <Handle type="target" position={Position.Top} />}
          </div>
        </div>
      )}
    </>
  );
}

export const MemoizedWorkflowNode = memo(WorkflowNode);
