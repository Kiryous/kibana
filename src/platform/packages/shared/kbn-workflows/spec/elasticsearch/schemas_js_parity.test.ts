/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

// SPIKE: parity between the openapi-ts schemas and @elastic/schemas for elasticsearch.search

import { z } from '@kbn/zod/v4';
import {
  global_search_response_body,
  search,
  search_request,
  types_indices,
} from './generated/schemas/es_openapi_zod.gen';
import { SEARCH_CONTRACT } from './overrides/elasticsearch.search';
import { getShapeAt } from '../../common/utils/zod';

const legacyParamsSchema = z.object({
  ...search.shape,
  ...getShapeAt(search_request, 'query'),
  index: types_indices,
  sort: z.any().optional(),
});

const newParamsSchema = SEARCH_CONTRACT.paramsSchema as z.ZodObject;

const foundIn = (where: string) =>
  Object.entries(newParamsSchema.shape)
    .filter(([, field]) => (field as z.ZodType).meta()?.found_in === where)
    .map(([key]) => key)
    .sort();

const payloads: Record<string, unknown> = {
  match_all: { index: 'logs-*', query: { match_all: {} }, size: 10 },
  short_match: { index: 'logs-*', query: { match: { message: 'error' } } },
  short_term: { index: ['a', 'b'], query: { term: { 'host.name': 'web-1' } } },
  bool_range: {
    index: 'logs-*',
    query: {
      bool: {
        filter: [{ range: { '@timestamp': { gte: 'now-15m' } } }],
        must_not: [{ exists: { field: 'error' } }],
      },
    },
  },
  aggs: {
    index: 'logs-*',
    size: 0,
    aggs: { hosts: { terms: { field: 'host.name', size: 5 } } },
  },
  sort_complex: { index: 'logs-*', sort: [{ '@timestamp': { order: 'desc' } }] },
  url_params: {
    index: 'logs-*',
    q: 'status:500',
    ignore_unavailable: true,
    track_total_hits: 1000,
  },
  knn: {
    index: 'vectors',
    knn: { field: 'embedding', query_vector: [0.1, 0.2], k: 5, num_candidates: 10 },
  },
  missing_index: { query: { match_all: {} } },
  bad_size: { index: 'logs-*', size: 'ten' },
};

describe('schemas-js parity: elasticsearch.search', () => {
  it('has the same top-level keys', () => {
    const legacy = Object.keys(legacyParamsSchema.shape).sort();
    const next = Object.keys(newParamsSchema.shape).sort();
    expect({
      onlyLegacy: legacy.filter((k) => !next.includes(k)),
      onlyNew: next.filter((k) => !legacy.includes(k)),
      // `rank` is in the JSON schema but not in the Zod schema; `aggs` is the alias of `aggregations`
    }).toEqual({ onlyLegacy: ['rank'], onlyNew: ['aggs'] });
  });

  it('derives parameterTypes from found_in meta', () => {
    const { parameterTypes } = SEARCH_CONTRACT;
    // `index` and `sort` are overridden, so their meta is gone
    expect(foundIn('path')).toEqual([]);
    const query = foundIn('query');
    const body = foundIn('body');
    expect({
      urlNotInMeta: parameterTypes.urlParams!.filter((k) => k !== 'sort' && !query.includes(k)),
      bodyNotInMeta: parameterTypes.bodyParams!.filter((k) => k !== 'sort' && !body.includes(k)),
      metaQueryNotInUrl: query.filter((k) => !parameterTypes.urlParams!.includes(k)),
      metaBodyNotInBody: body.filter((k) => !parameterTypes.bodyParams!.includes(k)),
    }).toMatchInlineSnapshot(`
      Object {
        "bodyNotInMeta": Array [
          "rank",
        ],
        "metaBodyNotInBody": Array [],
        "metaQueryNotInUrl": Array [],
        "urlNotInMeta": Array [
          "docvalue_fields",
          "explain",
          "stats",
          "stored_fields",
          "terminate_after",
          "timeout",
          "track_total_hits",
          "track_scores",
          "version",
          "_source",
          "seq_no_primary_term",
          "size",
          "from",
        ],
      }
    `);
  });

  it.each(Object.keys(payloads))('gives the same verdict for %s', (name) => {
    const legacy = legacyParamsSchema.safeParse(payloads[name]);
    const next = newParamsSchema.safeParse(payloads[name]);
    expect({ name, next: next.success }).toEqual({ name, next: legacy.success });
  });

  it('parses a real search response', () => {
    const response = {
      took: 3,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      hits: {
        total: { value: 1, relation: 'eq' },
        max_score: 1,
        hits: [{ _index: 'logs', _id: '1', _score: 1, _source: { message: 'hi' } }],
      },
    };
    expect(global_search_response_body.safeParse(response).success).toBe(true);
    expect(SEARCH_CONTRACT.outputSchema.safeParse(response).success).toBe(true);
  });

  it('converts to JSON schema for the editor', () => {
    const legacy = JSON.stringify(z.toJSONSchema(legacyParamsSchema, { unrepresentable: 'any' }));
    const next = JSON.stringify(z.toJSONSchema(newParamsSchema, { unrepresentable: 'any' }));
    expect(next.length).toBeLessThan(legacy.length);
  });
});
