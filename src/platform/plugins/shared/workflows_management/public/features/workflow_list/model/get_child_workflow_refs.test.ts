/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { WorkflowYaml } from '@kbn/workflows';
import { getChildWorkflowRefs } from './get_child_workflow_refs';

const def = (steps: unknown[]) => ({ steps } as unknown as Pick<WorkflowYaml, 'steps'>);

describe('getChildWorkflowRefs', () => {
  it('returns an empty list for a null definition', () => {
    expect(getChildWorkflowRefs(null)).toEqual([]);
  });

  it('finds sync and async calls, including nested steps', () => {
    const refs = getChildWorkflowRefs(
      def([
        { name: 'a', type: 'workflow.execute', with: { 'workflow-id': 'child-1' } },
        {
          name: 'loop',
          type: 'foreach',
          foreach: '{{ inputs.items }}',
          steps: [
            {
              name: 'cond',
              type: 'if',
              condition: 'true',
              steps: [],
              else: [
                { name: 'b', type: 'workflow.executeAsync', with: { 'workflow-id': 'child-2' } },
              ],
            },
          ],
        },
        { name: 'log', type: 'console', with: { message: 'hi' } },
      ])
    );

    expect(refs).toEqual([
      { workflowId: 'child-1', isDynamic: false, invocation: 'sync', stepNames: ['a'] },
      { workflowId: 'child-2', isDynamic: false, invocation: 'async', stepNames: ['b'] },
    ]);
  });

  it('groups repeated calls and marks templated IDs as dynamic', () => {
    const refs = getChildWorkflowRefs(
      def([
        { name: 'a', type: 'workflow.execute', with: { 'workflow-id': 'child-1' } },
        { name: 'b', type: 'workflow.execute', with: { 'workflow-id': 'child-1' } },
        { name: 'c', type: 'workflow.execute', with: { 'workflow-id': '{{ inputs.target }}' } },
      ])
    );

    expect(refs).toEqual([
      { workflowId: 'child-1', isDynamic: false, invocation: 'sync', stepNames: ['a', 'b'] },
      {
        workflowId: '{{ inputs.target }}',
        isDynamic: true,
        invocation: 'sync',
        stepNames: ['c'],
      },
    ]);
  });
});
