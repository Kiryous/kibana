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
  EuiBasicTable,
  EuiButtonIcon,
  EuiScreenReaderOnly,
  EuiThemeProvider,
  EuiToolTip,
  useEuiTheme,
} from '@elastic/eui';
import type { CriteriaWithPagination } from '@elastic/eui/src/components/basic_table/basic_table';
import { css } from '@emotion/react';
import React, { useCallback, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { i18n } from '@kbn/i18n';
import type { WorkflowListItemDto, WorkflowSortField } from '@kbn/workflows';
import { ChildWorkflowsRow } from './child_workflows_row';
import { getWorkflowDataColumns } from './workflow_list_columns';
import { getRunTooltipContent } from '../../../shared/ui';
import { WORKFLOWS_TABLE_PAGE_SIZE_OPTIONS } from '../constants';
import { getChildWorkflowRefs } from '../model/get_child_workflow_refs';
import type { ChildWorkflowRef } from '../model/get_child_workflow_refs';

/**
 * EUI has no prop to turn off hover on expanded rows only. So the table turns off the hover token,
 * and item rows (parent and child) set the hover background again through their own `css`.
 */
// Component colors are set per color mode, so the override sets both modes.
const noRowHoverTheme = {
  components: {
    LIGHT: { tableRowBackgroundHover: 'transparent' },
    DARK: { tableRowBackgroundHover: 'transparent' },
  },
};

export interface WorkflowListTableProps {
  items: WorkflowListItemDto[];
  page: number;
  size: number;
  total: number;
  selectedItems: WorkflowListItemDto[];
  onSelectionChange: (items: WorkflowListItemDto[]) => void;
  onPageChange: (pageIndex: number, pageSize: number) => void;
  onToggleWorkflow: (item: WorkflowListItemDto) => void;
  onDeleteWorkflow: (item: WorkflowListItemDto) => void;
  onCloneWorkflow: (item: WorkflowListItemDto) => void;
  onExportWorkflow: (item: WorkflowListItemDto) => void;
  onRequestRun: (item: WorkflowListItemDto) => void;
  onEditWorkflow: (item: WorkflowListItemDto) => void;
  canCreateWorkflow: boolean;
  canReadWorkflow: boolean;
  canReadWorkflowExecution: boolean;
  canUpdateWorkflow: boolean;
  canDeleteWorkflow: boolean;
  canExecuteWorkflow: boolean;
  workflowsListSearch?: string;
  sortField?: WorkflowSortField;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (field: WorkflowSortField, order: 'asc' | 'desc') => void;
}

export const WorkflowListTable = ({
  items,
  page,
  size,
  total,
  selectedItems,
  onSelectionChange,
  onPageChange,
  onToggleWorkflow,
  onDeleteWorkflow,
  onCloneWorkflow,
  onExportWorkflow,
  onRequestRun,
  onEditWorkflow,
  canCreateWorkflow,
  canReadWorkflow,
  canReadWorkflowExecution,
  canUpdateWorkflow,
  canDeleteWorkflow,
  canExecuteWorkflow,
  workflowsListSearch = '',
  sortField,
  sortOrder,
  onSortChange,
}: WorkflowListTableProps) => {
  const routerHistory = useHistory();
  const { euiTheme } = useEuiTheme();
  const rowHoverCss = useMemo(
    () => css`
      &&:hover {
        background-color: ${euiTheme.components.tableRowBackgroundHover};
      }
    `,
    [euiTheme.components.tableRowBackgroundHover]
  );
  const allowRowSelection = canUpdateWorkflow || canDeleteWorkflow || canReadWorkflow;

  const childRefsById = useMemo(() => {
    const map = new Map<string, ChildWorkflowRef[]>();
    items.forEach((item) => map.set(item.id, getChildWorkflowRefs(item.definition)));
    return map;
  }, [items]);

  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(new Set());
  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const itemIdToExpandedRowMap = useMemo(() => {
    const map: Record<string, React.ReactNode> = {};
    expandedIds.forEach((id) => {
      const refs = childRefsById.get(id);
      if (refs && refs.length > 0) {
        map[id] = (
          <ChildWorkflowsRow
            refs={refs}
            canReadWorkflow={canReadWorkflow}
            canReadWorkflowExecution={canReadWorkflowExecution}
            canUpdateWorkflow={canUpdateWorkflow}
            workflowsListSearch={workflowsListSearch}
            onToggleWorkflow={onToggleWorkflow}
            rowCss={rowHoverCss}
          />
        );
      }
    });
    return map;
  }, [
    expandedIds,
    childRefsById,
    canReadWorkflow,
    canReadWorkflowExecution,
    canUpdateWorkflow,
    workflowsListSearch,
    onToggleWorkflow,
    rowHoverCss,
  ]);

  const columns = useMemo<Array<EuiBasicTableColumn<WorkflowListItemDto>>>(
    () => [
      {
        width: '40px',
        isExpander: true,
        name: (
          <EuiScreenReaderOnly>
            <span>
              {i18n.translate('workflows.workflowList.column.expand', {
                defaultMessage: 'Expand row',
              })}
            </span>
          </EuiScreenReaderOnly>
        ),
        mobileOptions: { header: false },
        render: (item: WorkflowListItemDto) => {
          const refs = childRefsById.get(item.id) ?? [];
          if (refs.length === 0) return null;
          const isExpanded = expandedIds.has(item.id);
          const label = isExpanded
            ? i18n.translate('workflows.workflowList.children.collapse', {
                defaultMessage:
                  'Hide {count, plural, one {# child workflow} other {# child workflows}}',
                values: { count: refs.length },
              })
            : i18n.translate('workflows.workflowList.children.expand', {
                defaultMessage:
                  'Show {count, plural, one {# child workflow} other {# child workflows}}',
                values: { count: refs.length },
              });
          return (
            <EuiToolTip content={label} disableScreenReaderOutput>
              <EuiButtonIcon
                onClick={() => toggleExpanded(item.id)}
                aria-label={label}
                aria-expanded={isExpanded}
                iconType={isExpanded ? 'chevronSingleDown' : 'chevronSingleRight'}
                data-test-subj={`workflowChildrenToggle-${item.id}`}
              />
            </EuiToolTip>
          );
        },
      },
      ...getWorkflowDataColumns<WorkflowListItemDto>({
        canReadWorkflow,
        canReadWorkflowExecution,
        canUpdateWorkflow,
        routerHistory,
        workflowsListSearch,
        onToggleWorkflow,
        sortable: true,
      }),
      {
        name: '',
        width: '120px',
        actions: [
          {
            isPrimary: true,
            enabled: (item) =>
              canExecuteWorkflow &&
              item.permissions?.execute !== false &&
              item.enabled &&
              item.valid,
            type: 'icon',
            color: 'text',
            name: i18n.translate('workflows.workflowList.run', { defaultMessage: 'Run' }),
            'data-test-subj': 'runWorkflowAction',
            icon: 'play',
            description: (item: WorkflowListItemDto) =>
              getRunTooltipContent({
                isValid: item.valid,
                canRunWorkflow: canExecuteWorkflow && item.permissions?.execute !== false,
                isEnabled: item.enabled,
              }) ?? i18n.translate('workflows.workflowList.run', { defaultMessage: 'Run' }),
            onClick: (item: WorkflowListItemDto) => onRequestRun(item),
          },
          {
            enabled: (item) =>
              canUpdateWorkflow && item.permissions?.edit !== false && item.managed !== true,
            type: 'icon',
            color: 'text',
            isPrimary: true,
            name: i18n.translate('workflows.workflowList.edit', { defaultMessage: 'Edit' }),
            'data-test-subj': 'editWorkflowAction',
            icon: 'pencil',
            description: (item: WorkflowListItemDto) =>
              item.managed === true
                ? i18n.translate('workflows.workflowList.editManagedDisabled', {
                    defaultMessage: 'Managed workflows cannot be edited',
                  })
                : i18n.translate('workflows.workflowList.editWorkflow', {
                    defaultMessage: 'Edit workflow',
                  }),
            onClick: (item: WorkflowListItemDto) => onEditWorkflow(item),
          },
          {
            enabled: () => canCreateWorkflow && canReadWorkflow,
            type: 'icon',
            color: 'text',
            name: i18n.translate('workflows.workflowList.clone', { defaultMessage: 'Clone' }),
            'data-test-subj': 'cloneWorkflowAction',
            icon: 'copy',
            description: '',
            onClick: (item: WorkflowListItemDto) => onCloneWorkflow(item),
          },
          {
            enabled: (item) => item.definition !== null && canReadWorkflow,
            type: 'icon',
            color: 'text',
            name: i18n.translate('workflows.workflowList.export', { defaultMessage: 'Export' }),
            'data-test-subj': 'exportWorkflowAction',
            icon: 'export',
            description: '',
            onClick: (item: WorkflowListItemDto) => onExportWorkflow(item),
          },
          {
            enabled: (item) =>
              canDeleteWorkflow && item.permissions?.edit !== false && item.managed !== true,
            type: 'icon',
            color: 'danger',
            name: i18n.translate('workflows.workflowList.delete', { defaultMessage: 'Delete' }),
            'data-test-subj': 'deleteWorkflowAction',
            icon: 'trash',
            description: (item: WorkflowListItemDto) =>
              item.managed === true
                ? i18n.translate('workflows.workflowList.deleteManagedDisabled', {
                    defaultMessage: 'Managed workflows cannot be deleted',
                  })
                : '',
            onClick: (item: WorkflowListItemDto) => onDeleteWorkflow(item),
          },
        ],
      },
    ],
    [
      childRefsById,
      expandedIds,
      toggleExpanded,
      canReadWorkflow,
      canReadWorkflowExecution,
      canUpdateWorkflow,
      canExecuteWorkflow,
      canCreateWorkflow,
      canDeleteWorkflow,
      onEditWorkflow,
      routerHistory,
      workflowsListSearch,
      onToggleWorkflow,
      onCloneWorkflow,
      onExportWorkflow,
      onDeleteWorkflow,
      onRequestRun,
    ]
  );

  return (
    <EuiThemeProvider modify={noRowHoverTheme}>
      <EuiBasicTable
        tableCaption={i18n.translate('workflows.workflowList.tableCaption', {
          defaultMessage: 'Workflows',
        })}
        data-test-subj="workflowListTable"
        css={css`
          container-type: inline-size;

          .euiBasicTableAction-showOnHover {
            opacity: 1 !important;
          }
        `}
        rowProps={() => ({
          style: { height: '68px' },
          css: rowHoverCss,
        })}
        columns={columns}
        items={items}
        itemId="id"
        itemIdToExpandedRowMap={itemIdToExpandedRowMap}
        // Removes the grey background EUI paints behind expanded rows.
        hasBackground={false}
        responsiveBreakpoint="xs"
        tableLayout="fixed"
        sorting={
          sortField && sortOrder
            ? { sort: { field: sortField, direction: sortOrder } }
            : { sort: undefined }
        }
        onChange={({
          page: { index: pageIndex, size: pageSize },
          sort,
        }: CriteriaWithPagination<WorkflowListItemDto>) => {
          // EUI can emit `sort` as `undefined` on page-only changes — guard
          // against that so we don't fire `onSortChange` on pagination.
          const incoming =
            sort?.field === 'name' || sort?.field === 'enabled'
              ? { field: sort.field as WorkflowSortField, order: sort.direction }
              : undefined;
          const sortChanged = incoming?.field !== sortField || incoming?.order !== sortOrder;
          if (sortChanged && incoming) {
            onSortChange?.(incoming.field, incoming.order);
            return;
          }
          onPageChange(pageIndex, pageSize);
        }}
        {...(allowRowSelection
          ? {
              selection: {
                onSelectionChange,
                selectable: () => true,
                selected: selectedItems,
              },
            }
          : {})}
        pagination={{
          pageSize: size,
          pageSizeOptions: WORKFLOWS_TABLE_PAGE_SIZE_OPTIONS,
          totalItemCount: total,
          pageIndex: page - 1,
        }}
      />
    </EuiThemeProvider>
  );
};
