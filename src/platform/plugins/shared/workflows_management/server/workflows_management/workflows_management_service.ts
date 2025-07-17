/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { ElasticsearchClient, Logger } from '@kbn/core/server';
import {
  transformWorkflowYamlJsontoEsWorkflow,
  WorkflowExecutionDto,
  WorkflowListDto,
} from '@kbn/workflows';
import {
  CreateWorkflowCommand,
  EsWorkflow,
  WorkflowDetailDto,
  WorkflowExecutionListDto,
} from '@kbn/workflows';
import { updateWorkflow } from './lib/update_workflow';
import { deleteWorkflows } from './lib/delete_workflows';
import { getWorkflow } from './lib/get_workflow';
import { getWorkflowExecution } from './lib/get_workflow_execution';
import { createWorkflow } from './lib/create_workflow';
import { GetWorkflowsParams } from './workflows_management_api';
import { searchWorkflows } from './lib/search_workflows';
import { searchWorkflowExecutions } from './lib/search_workflow_executions';
import { WORKFLOW_ZOD_SCHEMA_LOOSE } from '../../common';
import { parseWorkflowYamlToJSON } from '../../common/lib/yaml-utils';

export class WorkflowsService {
  private esClient: ElasticsearchClient | null = null;
  private logger: Logger;
  private workflowIndex: string;
  private workflowsExecutionIndex: string;
  private stepsExecutionIndex: string;

  constructor(
    esClientPromise: Promise<ElasticsearchClient>,
    logger: Logger,
    workflowIndex: string,
    workflowsExecutionIndex: string,
    stepsExecutionIndex: string
  ) {
    this.logger = logger;
    this.workflowIndex = workflowIndex;
    this.stepsExecutionIndex = stepsExecutionIndex;
    this.workflowsExecutionIndex = workflowsExecutionIndex;
    this.initialize(esClientPromise);
  }

  private async initialize(esClientPromise: Promise<ElasticsearchClient>) {
    this.esClient = await esClientPromise;
    this.logger.debug('Elasticsearch client initialized');
    const indices = await this.esClient.indices.exists({
      index: this.workflowIndex,
    });
    if (!indices) {
      this.logger.debug(`Workflow index ${this.workflowIndex} does not exist`);
      this.esClient.indices.create({
        index: this.workflowIndex,
      });
      this.logger.debug(`Workflow index ${this.workflowIndex} created`);
    }
    this.logger.debug(`Workflow index ${this.workflowIndex} exists`);
  }

  public async searchWorkflows(params: GetWorkflowsParams): Promise<WorkflowListDto> {
    if (!this.esClient) {
      throw new Error('Elasticsearch client not initialized');
    }
    return await searchWorkflows({
      esClient: this.esClient,
      logger: this.logger,
      workflowIndex: this.workflowIndex,
      workflowExecutionIndex: this.workflowsExecutionIndex,
      _full: params._full,
    });
  }

  public async getWorkflowExecution(id: string): Promise<WorkflowExecutionDto | null> {
    if (!this.esClient) {
      throw new Error('Elasticsearch client not initialized');
    }
    return await getWorkflowExecution({
      esClient: this.esClient,
      logger: this.logger,
      workflowExecutionIndex: this.workflowsExecutionIndex,
      stepsExecutionIndex: this.stepsExecutionIndex,
      workflowExecutionId: id,
    });
  }

  public async getWorkflow(id: string): Promise<WorkflowDetailDto | null> {
    if (!this.esClient) {
      throw new Error('Elasticsearch client not initialized');
    }
    return await getWorkflow({
      esClient: this.esClient,
      logger: this.logger,
      workflowIndex: this.workflowIndex,
      workflowId: id,
    });
  }

  public async createWorkflow(workflow: CreateWorkflowCommand): Promise<WorkflowDetailDto> {
    if (!this.esClient) {
      throw new Error('Elasticsearch client not initialized');
    }
    const parsedYaml = parseWorkflowYamlToJSON(workflow.yaml, WORKFLOW_ZOD_SCHEMA_LOOSE);
    if (!parsedYaml.success) {
      throw new Error('Invalid workflow yaml: ' + parsedYaml.error.message);
    }
    const workflowToCreate = transformWorkflowYamlJsontoEsWorkflow(parsedYaml.data);
    return await createWorkflow({
      esClient: this.esClient,
      logger: this.logger,
      workflowIndex: this.workflowIndex,
      workflow: { ...workflowToCreate, yaml: workflow.yaml },
    });
  }

  public async updateWorkflow(
    id: string,
    workflow: Partial<EsWorkflow>
  ): Promise<WorkflowDetailDto> {
    if (!this.esClient) {
      throw new Error('Elasticsearch client not initialized');
    }
    const { yaml, definition, ...rest } = workflow;
    if (yaml) {
      const parsedYaml = parseWorkflowYamlToJSON(yaml, WORKFLOW_ZOD_SCHEMA_LOOSE);
      if (!parsedYaml.success) {
        throw new Error('Invalid workflow yaml: ' + parsedYaml.error.message);
      }
      const updatedWorkflow = transformWorkflowYamlJsontoEsWorkflow(parsedYaml.data);
      return await updateWorkflow({
        esClient: this.esClient,
        logger: this.logger,
        workflowIndex: this.workflowIndex,
        workflowId: id,
        workflow: { ...updatedWorkflow, yaml: workflow.yaml },
      });
    }
    return await updateWorkflow({
      esClient: this.esClient,
      logger: this.logger,
      workflowIndex: this.workflowIndex,
      workflowId: id,
      // we only update the workflow definition if the yaml is provided, otherwise we update the rest of the workflow
      workflow: rest,
    });
  }

  public async deleteWorkflows(workflowIds: string[]): Promise<void> {
    if (!this.esClient) {
      throw new Error('Elasticsearch client not initialized');
    }
    return await deleteWorkflows({
      esClient: this.esClient,
      logger: this.logger,
      workflowIndex: this.workflowIndex,
      workflowIds,
    });
  }

  public async searchWorkflowExecutions(params: {
    workflowId: string;
  }): Promise<WorkflowExecutionListDto> {
    if (!this.esClient) {
      throw new Error('Elasticsearch client not initialized');
    }
    return await searchWorkflowExecutions({
      esClient: this.esClient,
      logger: this.logger,
      workflowExecutionIndex: this.workflowsExecutionIndex,
      query: { match: { workflowId: params.workflowId } },
    });
  }
}
