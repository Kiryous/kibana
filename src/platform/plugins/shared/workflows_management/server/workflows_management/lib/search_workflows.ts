/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';
import { ElasticsearchClient, Logger } from '@kbn/core/server';
import { EsWorkflowSchema, WorkflowListModel } from '@kbn/workflows';

interface SearchWorkflowsParams {
  esClient: ElasticsearchClient;
  logger: Logger;
  workflowIndex: string;
  _full?: boolean;
}

export const searchWorkflows = async ({
  esClient,
  logger,
  workflowIndex,
  _full,
}: SearchWorkflowsParams) => {
  try {
    logger.info(`Searching workflows in index ${workflowIndex}`);
    const response = await esClient.search<EsWorkflowSchema>({
      index: workflowIndex,
      query: { match_all: {} },
    });

    logger.info(
      `Found ${response.hits.hits.length} workflows, ${response.hits.hits.map((hit) => hit._id)}`
    );

    if (_full) {
      return transformToWorkflowListModel(response);
    }

    return transformToWorkflowListItemModel(response);
  } catch (error) {
    logger.error(`Failed to search workflows: ${error}`);
    throw error;
  }
};

function transformToWorkflowListModel(
  response: SearchResponse<EsWorkflowSchema>
): WorkflowListModel {
  return {
    results: response.hits.hits.map((hit) => {
      const workflowSchema = hit._source!;
      return {
        id: hit._id!,
        name: workflowSchema.name,
        description: workflowSchema.description,
        createdAt: workflowSchema.createdAt,
        status: workflowSchema.status,
        triggers: workflowSchema.triggers,
        tags: workflowSchema.tags ?? [],
        history: [],
        createdBy: workflowSchema.createdBy,
        lastUpdatedAt: workflowSchema.lastUpdatedAt,
        lastUpdatedBy: workflowSchema.lastUpdatedBy,
        steps: workflowSchema.steps,
        nodes: workflowSchema.nodes,
      };
    }),
    _pagination: {
      limit: response.hits.hits.length,
      offset: 0,
      total: response.hits.hits.length,
    },
  };
}

function transformToWorkflowListItemModel(
  response: SearchResponse<EsWorkflowSchema>
): WorkflowListModel {
  const workflows = response.hits.hits.map((hit) => {
    const workflowSchema = hit._source!;
    return {
      id: hit._id,
      name: workflowSchema.name,
      description: workflowSchema.description,
      createdAt: workflowSchema.createdAt,
      status: workflowSchema.status,
      triggers: workflowSchema.triggers,
      tags: workflowSchema.tags ?? [],
      history: [],
      createdBy: workflowSchema.createdBy,
      lastUpdatedAt: workflowSchema.lastUpdatedAt,
      lastUpdatedBy: workflowSchema.lastUpdatedBy,
    };
  });

  return {
    results: workflows,
    _pagination: {
      limit: response.hits.hits.length,
      offset: 0,
      total: response.hits.hits.length,
    },
  };
}
