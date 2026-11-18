/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { EuiBasicTableColumn } from '@elastic/eui';
import {
  EuiBadge,
  EuiBadgeGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiPopover,
  EuiPopoverTitle,
  EuiSwitch,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { css } from '@emotion/react';
import React, { useCallback, useState } from 'react';
import type { useHistory } from 'react-router-dom';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { hasActiveModifierKey } from '@kbn/shared-ux-utility';
import type { WorkflowListItemDto } from '@kbn/workflows';
import { WorkflowTriggersAndSteps } from './workflow_triggers_and_steps';
import { ManagedWorkflowBadge, StatusBadge, WorkflowStatus } from '../../../shared/ui';
import { getWorkflowDetailRouteState } from '../../../shared/utils/workflow_navigation';

const MAX_VISIBLE_TAGS = 2;

export interface WorkflowDataColumnsOptions {
  canReadWorkflow: boolean;
  canReadWorkflowExecution: boolean;
  canUpdateWorkflow: boolean;
  routerHistory: ReturnType<typeof useHistory>;
  workflowsListSearch: string;
  onToggleWorkflow: (item: WorkflowListItemDto) => void;
  sortable: boolean;
}

/**
 * Name, Tags, Triggers and Steps, Last run and Enabled columns.
 * The workflow list and its child workflow rows share these columns.
 */
export const getWorkflowDataColumns = <T extends WorkflowListItemDto>({
  canReadWorkflow,
  canReadWorkflowExecution,
  canUpdateWorkflow,
  routerHistory,
  workflowsListSearch,
  onToggleWorkflow,
  sortable,
}: WorkflowDataColumnsOptions): Array<EuiBasicTableColumn<T>> => [
  {
    field: 'name',
    name: i18n.translate('workflows.workflowList.column.name', { defaultMessage: 'Name' }),
    dataType: 'string',
    sortable,
    render: (name: string, item) => (
      <div
        css={css`
          max-width: 100%;
          overflow: hidden;
        `}
      >
        <EuiFlexGroup direction="column" gutterSize="xs">
          <EuiFlexItem>
            <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false} wrap={false}>
              <EuiFlexItem
                grow={false}
                css={css`
                  min-width: 0;
                `}
              >
                {canReadWorkflow ? (
                  <EuiLink
                    href={routerHistory.createHref({ pathname: `/${item.id}` })}
                    onClick={(event: React.MouseEvent) => {
                      if (hasActiveModifierKey(event)) return;
                      event.preventDefault();
                      routerHistory.push({
                        pathname: `/${item.id}`,
                        state: getWorkflowDetailRouteState(workflowsListSearch),
                      });
                    }}
                    css={css`
                      white-space: nowrap;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      display: block;
                      max-width: 100%;
                    `}
                    title={name}
                    data-test-subj="workflowNameLink"
                  >
                    {name}
                  </EuiLink>
                ) : (
                  <EuiText
                    size="s"
                    css={css`
                      white-space: nowrap;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      display: block;
                      max-width: 100%;
                    `}
                    title={name}
                    data-test-subj="workflowNameText"
                  >
                    {name}
                  </EuiText>
                )}
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText
              size="xs"
              color="subdued"
              title={item.description}
              css={css`
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
                display: block;
                width: 100%;
              `}
            >
              {item.description || (
                <FormattedMessage
                  id="workflows.workflowList.noDescription"
                  defaultMessage="No description"
                />
              )}
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    ),
  },
  {
    field: 'tags',
    name: i18n.translate('workflows.workflowList.column.tags', {
      defaultMessage: 'Tags',
    }),
    width: '18%',
    render: (value: unknown, item: WorkflowListItemDto) => (
      <WorkflowTagsCell tags={item.definition?.tags} isManaged={item.managed === true} />
    ),
  },
  {
    field: 'triggers',
    name: i18n.translate('workflows.workflowList.column.triggersAndSteps', {
      defaultMessage: 'Triggers and Steps',
    }),
    width: '24%',
    render: (value: unknown, item: WorkflowListItemDto) => {
      const triggers = item.definition?.triggers ?? [];
      const steps = item.definition?.steps ?? [];
      const history = item.history ?? [];

      return <WorkflowTriggersAndSteps triggers={triggers} steps={steps} history={history} />;
    },
  },
  {
    name: i18n.translate('workflows.workflowList.column.lastRun', {
      defaultMessage: 'Last run',
    }),
    field: 'runHistory',
    width: '10%',
    render: (value: unknown, item: WorkflowListItemDto) => {
      if (!canReadWorkflowExecution) {
        return (
          <EuiText size="xs" color="subdued" data-test-subj="workflowLastRunRestricted">
            {i18n.translate('workflows.workflowList.lastRun.restricted', {
              defaultMessage: '—',
            })}
          </EuiText>
        );
      }
      if (!item.history || item.history.length === 0) return null;
      const lastRun = item.history[0];
      return <StatusBadge status={lastRun.status} date={lastRun.finishedAt || lastRun.startedAt} />;
    },
  },
  {
    name: i18n.translate('workflows.workflowList.column.enabled', {
      defaultMessage: 'Enabled',
    }),
    field: 'enabled',
    width: '90px',
    sortable,
    render: (value: unknown, item: WorkflowListItemDto) => {
      return (
        <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiToolTip
              content={
                !item.valid
                  ? i18n.translate('workflows.workflowList.invalid', {
                      defaultMessage: 'Fix errors to enable workflow',
                    })
                  : undefined
              }
            >
              <EuiSwitch
                data-test-subj={`workflowToggleSwitch-${item.id}`}
                disabled={!canUpdateWorkflow || item.permissions?.edit === false || !item.valid}
                checked={item.enabled}
                onChange={() => onToggleWorkflow(item)}
                label={
                  item.enabled
                    ? i18n.translate('workflows.workflowList.enabled', {
                        defaultMessage: 'Enabled',
                      })
                    : i18n.translate('workflows.workflowList.disabled', {
                        defaultMessage: 'Disabled',
                      })
                }
                showLabel={false}
              />
            </EuiToolTip>
          </EuiFlexItem>
          {!item.valid && (
            <EuiFlexItem grow={false}>
              <WorkflowStatus valid={item.valid} />
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      );
    },
  },
];

const tagsRowStyle = css`
  flex-wrap: nowrap;
  min-width: 0;
`;

const visibleTagStyle = css`
  min-width: 0;

  .euiBadge {
    max-width: 100%;
  }
`;

const overflowPopoverStyle = css`
  max-height: 200px;
  max-width: 320px;
  overflow: auto;
`;

export const WorkflowTagsCell = ({
  tags,
  isManaged,
}: {
  tags: readonly string[] | undefined;
  isManaged: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);

  if (!isManaged && (!tags || tags.length === 0)) return null;

  const workflowTags = tags ?? [];
  const visibleWorkflowTags = workflowTags.slice(
    0,
    isManaged ? MAX_VISIBLE_TAGS - 1 : MAX_VISIBLE_TAGS
  );
  const hidden = workflowTags.slice(visibleWorkflowTags.length);

  return (
    <EuiFlexGroup
      alignItems="center"
      gutterSize="xs"
      responsive={false}
      css={tagsRowStyle}
      data-test-subj="workflowTags"
    >
      {isManaged ? (
        <EuiFlexItem grow={false} css={visibleTagStyle}>
          <ManagedWorkflowBadge />
        </EuiFlexItem>
      ) : null}
      {visibleWorkflowTags.map((tag) => (
        <EuiFlexItem key={tag} grow={false} css={visibleTagStyle}>
          <EuiBadge color="hollow" title={tag}>
            {tag}
          </EuiBadge>
        </EuiFlexItem>
      ))}
      {hidden.length > 0 && (
        <EuiFlexItem grow={false}>
          <EuiPopover
            ownFocus
            isOpen={isOpen}
            closePopover={close}
            aria-label={i18n.translate('workflows.workflowList.tags.popoverTitle', {
              defaultMessage: 'Tags',
            })}
            button={
              <EuiBadge
                color="hollow"
                onClick={toggle}
                onClickAriaLabel={i18n.translate('workflows.workflowList.tags.moreAriaLabel', {
                  defaultMessage: 'View more tags',
                })}
                data-test-subj="workflowTagsOverflowBadge"
              >
                {`+${hidden.length}`}
              </EuiBadge>
            }
          >
            <EuiPopoverTitle>
              {i18n.translate('workflows.workflowList.tags.popoverTitle', {
                defaultMessage: 'Tags',
              })}
            </EuiPopoverTitle>
            <EuiBadgeGroup gutterSize="xs" css={overflowPopoverStyle}>
              {hidden.map((tag) => (
                <EuiBadge key={tag} color="hollow">
                  {tag}
                </EuiBadge>
              ))}
            </EuiBadgeGroup>
          </EuiPopover>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};
