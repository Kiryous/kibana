/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { ElasticsearchClient, Logger } from '@kbn/core/server';
import { CreateWorkflowRequest, EsWorkflowSchema, WorkflowStatus } from '@kbn/workflows';
import { v4 as uuidv4 } from 'uuid';
import { getWorkflow } from './get_workflow';

interface CreateWorkflowParams {
  esClient: ElasticsearchClient;
  logger: Logger;
  workflowIndex: string;
  workflow: CreateWorkflowRequest;
}

export const createWorkflow = async ({
  esClient,
  logger,
  workflowIndex,
  workflow,
}: CreateWorkflowParams) => {
  const workflowId = uuidv4();
  const document = transformToCreateScheme(workflow);

  try {
    const response = await esClient.create({
      id: workflowId,
      index: workflowIndex,
      document,
      refresh: 'wait_for',
    });

    const createdWorkflow = await getWorkflow({
      esClient,
      logger,
      workflowIndex,
      workflowId: response._id,
    });

    return createdWorkflow;
  } catch (error) {
    logger.error(`Failed to create workflow: ${error}`);
    throw error;
  }
};

function transformToCreateScheme(workflow: CreateWorkflowRequest): Omit<EsWorkflowSchema, 'id'> {
  return {
    name: workflow.name,
    description: workflow.description || '',
    status: workflow.status || WorkflowStatus.DRAFT,
    triggers: workflow.triggers || [],
    steps: workflow.steps || [],
    tags: [],
    yaml: '',
    nodes: [],
    executions: [],
    history: [],
    createdAt: new Date().toISOString(),
    createdBy: 'system',
    lastUpdatedAt: new Date().toISOString(),
    lastUpdatedBy: 'system',
  };
}
