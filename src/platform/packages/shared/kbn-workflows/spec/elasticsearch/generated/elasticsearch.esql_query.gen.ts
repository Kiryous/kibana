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
 * Source: elasticsearch-specification repository, operations: esql-query
 *
 * To regenerate: node scripts/generate_workflow_es_contracts.js
 */

import { EsqlQueryRequest, EsqlQueryResponse } from '@elastic/schemas/es/schemas/esql.query.js';

// import all needed request and response schemas generated from the OpenAPI spec
import type { InternalConnectorContract } from '../../../types/latest';

// export contract
export const ESQL_QUERY_CONTRACT: InternalConnectorContract = {
  type: 'elasticsearch.esql.query',
  summary: `Run an ES|QL query`,
  description: `Run an ES|QL query.

Get search results for an ES|QL (Elasticsearch query language) query.

 Documentation: https://www.elastic.co/docs/explore-analyze/query-filter/languages/esql-rest`,
  methods: ['POST'],
  patterns: ['_query'],
  documentation: 'https://www.elastic.co/docs/explore-analyze/query-filter/languages/esql-rest',
  parameterTypes: {
    headerParams: [],
    pathParams: [],
    urlParams: ['format', 'delimiter', 'drop_null_columns', 'allow_partial_results'],
    bodyParams: [
      'columnar',
      'filter',
      'locale',
      'params',
      'profile',
      'query',
      'tables',
      'include_ccs_metadata',
      'include_execution_metadata',
    ],
  },
  paramsSchema: EsqlQueryRequest,
  outputSchema: EsqlQueryResponse,
};
