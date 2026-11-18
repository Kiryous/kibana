/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { ParentWorkflowInvocation, WorkflowYaml } from '@kbn/workflows';
import { isExecuteAsyncStepType, isExecuteStepType } from '@kbn/workflows';

export interface ChildWorkflowRef {
  /** Static workflow ID, or the raw template string when `isDynamic` is true. */
  workflowId: string;
  /** True when `workflow-id` is a template, so the ID is known only at run time. */
  isDynamic: boolean;
  invocation: ParentWorkflowInvocation;
  /** Names of the parent steps that call this workflow. */
  stepNames: string[];
}

const isTemplate = (value: string) => value.includes('{{') || value.includes('{%');

/**
 * Finds every `workflow.execute` and `workflow.executeAsync` step in a workflow definition.
 * The walk is generic, so steps nested in `foreach`, `if`/`else`, `on-failure`, etc. are found too.
 * Refs are grouped by workflow ID and invocation mode.
 */
export const getChildWorkflowRefs = (
  definition: Pick<WorkflowYaml, 'steps'> | null | undefined
): ChildWorkflowRef[] => {
  const refs = new Map<string, ChildWorkflowRef>();

  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== 'object') return;

    const record = node as Record<string, unknown>;
    const type = typeof record.type === 'string' ? record.type : undefined;
    const workflowId = (record.with as Record<string, unknown> | undefined)?.['workflow-id'];

    if (isExecuteStepType(type) && typeof workflowId === 'string' && workflowId.length > 0) {
      const invocation: ParentWorkflowInvocation = isExecuteAsyncStepType(type) ? 'async' : 'sync';
      const key = `${invocation}:${workflowId}`;
      const stepName = typeof record.name === 'string' ? record.name : '';
      const existing = refs.get(key);
      if (existing) {
        if (stepName) existing.stepNames.push(stepName);
      } else {
        refs.set(key, {
          workflowId,
          isDynamic: isTemplate(workflowId),
          invocation,
          stepNames: stepName ? [stepName] : [],
        });
      }
    }

    Object.values(record).forEach(visit);
  };

  // Triggers can't call workflows, so walk only the steps.
  visit(definition?.steps);
  return [...refs.values()];
};
