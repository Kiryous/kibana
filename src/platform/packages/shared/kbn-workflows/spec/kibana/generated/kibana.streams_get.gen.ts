/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

/*
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: /oas_docs/output/kibana.yaml, operations: get-streams-name
 *
 * To regenerate: node scripts/generate_workflow_kibana_contracts.js
 */

import { z } from '@kbn/zod/v4';

import { buildParamsSchema } from '../../../common/utils/zod';

// import all needed request and response schemas generated from the OpenAPI spec
import type { InternalConnectorContract } from '../../../types/latest';

import { FetcherConfigSchema, KibanaStepMetaSchema } from '../../schema';

// export contract
export const STREAMS_GET_CONTRACT: InternalConnectorContract = {
  type: 'kibana.streams.get',
  summary: `Get a stream`,
  description: `**Spaces method and path for this operation:**

<div><span class="operation-verb get">get</span>&nbsp;<span class="operation-path">/s/{space_id}/api/streams/{name}</span></div>

Refer to [Spaces](https://www.elastic.co/docs/deploy-manage/manage-spaces) for more information.

Fetches a stream definition and associated dashboards<br/><br/>[Required authorization] Route required privileges: read_stream.`,
  methods: ['GET'],
  patterns: ['/api/streams/{name}'],
  documentation: 'https://www.elastic.co/docs/api/doc/kibana/operation/operation-get-streams-name',
  stability: 'tech_preview',
  parameterTypes: {
    headerParams: [],
    pathParams: ['name'],
    urlParams: [],
    bodyParams: [],
  },
  paramsSchema: buildParamsSchema({
    requestSchema: z.object({ path: z.object({ name: z.string().describe('The name of the stream.') }) }),
    additionalSchemas: {
      fetcher: FetcherConfigSchema,
      ...KibanaStepMetaSchema,
    },
  }),
  outputSchema: z.optional(z.looseObject({})),
};
