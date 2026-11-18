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
  EuiCode,
  EuiTable,
  EuiTableBody,
  EuiTableRow,
  EuiTableRowCell,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import type { SerializedStyles } from '@emotion/react';
import { css } from '@emotion/react';
import React, { useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { i18n } from '@kbn/i18n';
import { useQuery } from '@kbn/react-query';
import { KbnDangerCallout } from '@kbn/ui-callout';
import type { WorkflowListItemDto } from '@kbn/workflows';
import { useWorkflowsApi } from '@kbn/workflows-ui';
import { getWorkflowDataColumns } from './workflow_list_columns';
import type { ChildWorkflowRef } from '../model/get_child_workflow_refs';

/** Source fields that the shared workflow columns read. */
const CHILD_SOURCE_FIELDS = [
  'name',
  'description',
  'enabled',
  'valid',
  'definition',
  'tags',
  'managed',
];

interface ChildWorkflowRow extends WorkflowListItemDto {
  rowId: string;
  ref: ChildWorkflowRef;
  found: boolean;
}

export interface ChildWorkflowsRowProps {
  refs: ChildWorkflowRef[];
  canReadWorkflow: boolean;
  canReadWorkflowExecution: boolean;
  canUpdateWorkflow: boolean;
  workflowsListSearch: string;
  onToggleWorkflow: (item: WorkflowListItemDto) => void;
  /** Hover style for each child row. The parent table turns off the default hover. */
  rowCss: SerializedStyles;
}

const renderCell = (
  column: EuiBasicTableColumn<ChildWorkflowRow>,
  row: ChildWorkflowRow
): React.ReactNode => {
  if ('field' in column) {
    const value = row[column.field as keyof ChildWorkflowRow];
    return column.render ? column.render(value, row) : String(value ?? '');
  }
  if ('render' in column) return column.render(row);
  return null;
};

// Fills the expanded cell, and clips the first row's top border and the last row's bottom border:
// the parent row borders already mark the block edges.
const fullWidthStyle = css`
  width: 100%;
  overflow: hidden;
`;

const toPlaceholderRow = (ref: ChildWorkflowRef): ChildWorkflowRow => ({
  rowId: `${ref.invocation}:${ref.workflowId}`,
  ref,
  found: false,
  id: ref.workflowId,
  name: ref.workflowId,
  description: '',
  enabled: false,
  valid: true,
  definition: null,
  createdAt: '',
});

/**
 * Expanded-row content for the workflow list.
 * Loads the child workflows and their last run only when the parent row is expanded.
 */
export const ChildWorkflowsRow = ({
  refs,
  canReadWorkflow,
  canReadWorkflowExecution,
  canUpdateWorkflow,
  workflowsListSearch,
  onToggleWorkflow,
  rowCss,
}: ChildWorkflowsRowProps) => {
  const api = useWorkflowsApi();
  const routerHistory = useHistory();

  const staticIds = useMemo(
    () => [...new Set(refs.filter((ref) => !ref.isDynamic).map((ref) => ref.workflowId))],
    [refs]
  );

  // The query key starts with 'workflows', so a list refetch (e.g. after a toggle) refreshes it too.
  const { data, isLoading, error } = useQuery({
    networkMode: 'always',
    queryKey: ['workflows', 'children', staticIds, canReadWorkflowExecution],
    enabled: staticIds.length > 0,
    queryFn: async (): Promise<Map<string, WorkflowListItemDto>> => {
      const workflows = await api.mgetWorkflows({ ids: staticIds, source: CHILD_SOURCE_FIELDS });
      const lastRuns = canReadWorkflowExecution
        ? await Promise.all(
            workflows.map((workflow) =>
              api
                .getWorkflowExecutions(workflow.id, { size: 1, omitStepRuns: true })
                .then(({ results }) => results[0])
                .catch(() => undefined)
            )
          )
        : [];

      return new Map(
        workflows.map((workflow, index) => {
          const lastRun = lastRuns[index];
          const item: WorkflowListItemDto = {
            id: workflow.id,
            name: workflow.name ?? workflow.id,
            description: workflow.description ?? '',
            enabled: workflow.enabled ?? false,
            valid: workflow.valid ?? true,
            managed: workflow.managed,
            definition: workflow.definition ?? null,
            tags: workflow.tags,
            createdAt: workflow.createdAt ?? '',
            history: lastRun
              ? [
                  {
                    id: lastRun.id,
                    workflowId: workflow.id,
                    status: lastRun.status,
                    startedAt: lastRun.startedAt,
                    finishedAt: lastRun.finishedAt,
                    duration: lastRun.duration,
                  },
                ]
              : [],
          };
          return [workflow.id, item];
        })
      );
    },
  });

  const rows = useMemo<ChildWorkflowRow[]>(
    () =>
      refs.map((ref) => {
        const workflow = ref.isDynamic ? undefined : data?.get(ref.workflowId);
        if (!workflow) return toPlaceholderRow(ref);
        return { ...workflow, rowId: `${ref.invocation}:${ref.workflowId}`, ref, found: true };
      }),
    [data, refs]
  );

  const columns = useMemo<Array<EuiBasicTableColumn<ChildWorkflowRow>>>(() => {
    const [nameColumn, ...restDataColumns] = getWorkflowDataColumns<ChildWorkflowRow>({
      canReadWorkflow,
      canReadWorkflowExecution,
      canUpdateWorkflow,
      routerHistory,
      workflowsListSearch,
      onToggleWorkflow,
      sortable: false,
    });

    const nameRender = 'render' in nameColumn ? nameColumn.render : undefined;

    return [
      // Matches the parent table's expander column, so the child columns line up with the parent's.
      { width: '40px', name: '', render: () => null },
      {
        ...nameColumn,
        // Dynamic and missing children have no workflow document, so show the raw ID instead.
        render: (name: string, row: ChildWorkflowRow) => {
          if (row.ref.isDynamic) {
            return (
              <EuiToolTip
                content={i18n.translate('workflows.workflowList.children.dynamicTooltip', {
                  defaultMessage:
                    'The workflow ID comes from a template and is known only at run time.',
                })}
              >
                <EuiCode transparentBackground>{row.ref.workflowId}</EuiCode>
              </EuiToolTip>
            );
          }
          if (!row.found) {
            return (
              <EuiText size="s" color="subdued">
                {isLoading
                  ? row.ref.workflowId
                  : i18n.translate('workflows.workflowList.children.notFound', {
                      defaultMessage: '{id} (not found)',
                      values: { id: row.ref.workflowId },
                    })}
              </EuiText>
            );
          }
          return nameRender ? nameRender(name, row) : name;
        },
      } as EuiBasicTableColumn<ChildWorkflowRow>,
      // Other data columns stay empty until the child workflow loads.
      ...restDataColumns.map((column) =>
        'render' in column && column.render
          ? ({
              ...column,
              render: (value: unknown, row: ChildWorkflowRow) =>
                row.found ? column.render?.(value, row) : null,
            } as EuiBasicTableColumn<ChildWorkflowRow>)
          : column
      ),
      // Matches the parent table's actions column, so the percentage widths resolve the same way.
      { width: '120px', name: '', render: () => null },
      // POC: Mode and Called from columns are off for now. The parent header has no slots for them.
      // {
      //   field: 'ref',
      //   name: i18n.translate('workflows.workflowList.children.column.mode', {
      //     defaultMessage: 'Mode',
      //   }),
      //   width: '80px',
      //   render: (ref: ChildWorkflowRef) => (
      //     <EuiBadge color="hollow">
      //       {ref.invocation === 'async'
      //         ? i18n.translate('workflows.workflowList.children.async', { defaultMessage: 'Async' })
      //         : i18n.translate('workflows.workflowList.children.sync', { defaultMessage: 'Sync' })}
      //     </EuiBadge>
      //   ),
      // },
      // {
      //   field: 'ref',
      //   name: i18n.translate('workflows.workflowList.children.column.calledFrom', {
      //     defaultMessage: 'Called from',
      //   }),
      //   width: '140px',
      //   render: (ref: ChildWorkflowRef) => (
      //     <EuiText
      //       size="xs"
      //       color="subdued"
      //       title={ref.stepNames.join(', ')}
      //       data-test-subj="childWorkflowCalledFrom"
      //     >
      //       {ref.stepNames.join(', ')}
      //     </EuiText>
      //   ),
      // },
    ];
  }, [
    canReadWorkflow,
    canReadWorkflowExecution,
    canUpdateWorkflow,
    routerHistory,
    workflowsListSearch,
    onToggleWorkflow,
    isLoading,
  ]);

  if (error) {
    return (
      <KbnDangerCallout
        announceOnMount
        size="s"
        title={i18n.translate('workflows.workflowList.children.error', {
          defaultMessage: 'Could not load child workflows',
        })}
      />
    );
  }

  // A bare EuiTable (no EuiTableHeader): the parent table header labels these columns.
  return (
    <div css={fullWidthStyle}>
      <EuiTable
        css={({ euiTheme }) => css`
          margin-block: calc(-1 * ${euiTheme.border.width.thin});
        `}
        tableLayout="fixed"
        responsiveBreakpoint="xs"
        aria-label={i18n.translate('workflows.workflowList.children.caption', {
          defaultMessage: 'Child workflows',
        })}
        data-test-subj="childWorkflowsTable"
      >
        <EuiTableBody>
          {rows.map((row) => (
            <EuiTableRow key={row.rowId} style={{ height: '68px' }} css={rowCss}>
              {columns.map((column, index) => (
                <EuiTableRowCell key={index} width={column.width}>
                  {renderCell(column, row)}
                </EuiTableRowCell>
              ))}
            </EuiTableRow>
          ))}
        </EuiTableBody>
      </EuiTable>
    </div>
  );
};
