/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ConversationCreateProps, ConversationResponse } from '@kbn/elastic-assistant-common';
import {
  PerformPromptsBulkActionRequestBody,
  PerformPromptsBulkActionResponse,
  PromptCreateProps,
} from '@kbn/elastic-assistant-common/impl/schemas';
import { deleteAllDocuments } from './elasticsearch';
import { getMockConversation, getMockCreatePrompt } from '../../objects/assistant';
import { getSpaceUrl } from '../space';
import { rootRequest, waitForRootRequest } from './common';

const createConversation = (
  body?: Partial<ConversationCreateProps>
): Cypress.Chainable<Cypress.Response<ConversationResponse>> =>
  cy.currentSpace().then((spaceId) =>
    rootRequest<ConversationResponse>({
      method: 'POST',
      url: spaceId
        ? getSpaceUrl(spaceId, `api/security_ai_assistant/current_user/conversations`)
        : `api/security_ai_assistant/current_user/conversations`,
      body: getMockConversation(body),
    })
  );

export const waitForConversation = (body?: Partial<ConversationCreateProps>) =>
  waitForRootRequest<ConversationResponse>(createConversation(body));

export const deleteConversations = () => {
  cy.log('Delete all conversations');
  deleteAllDocuments(`.kibana-elastic-ai-assistant-conversations-*`);
};

export const deletePrompts = () => {
  cy.log('Delete all prompts');
  deleteAllDocuments(`.kibana-elastic-ai-assistant-prompts-*`);
};

const bulkPrompts = (
  body: PerformPromptsBulkActionRequestBody
): Cypress.Chainable<Cypress.Response<PerformPromptsBulkActionResponse>> =>
  cy.currentSpace().then((spaceId) =>
    rootRequest<PerformPromptsBulkActionResponse>({
      method: 'POST',
      url: spaceId
        ? getSpaceUrl(spaceId, `api/security_ai_assistant/prompts/_bulk_action`)
        : `api/security_ai_assistant/prompts/_bulk_action`,
      body,
    })
  );
export const waitForCreatePrompts = (prompts: Array<Partial<PromptCreateProps>>) => {
  return waitForRootRequest<PerformPromptsBulkActionResponse>(
    bulkPrompts({ create: prompts.map((prompt) => getMockCreatePrompt(prompt)) })
  );
};
