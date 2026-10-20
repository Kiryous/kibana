/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { Routing, WaitForActiveShards } from '@elastic/schemas/es/schemas/_types.js';
import type { z } from '@kbn/zod/v4';

type FoundIn = 'path' | 'query' | 'body';

/** Picks the fields of an @elastic/schemas request whose `found_in` meta matches. */
export const pickFoundIn = (schema: z.ZodObject, ...where: FoundIn[]): Record<string, z.ZodType> =>
  Object.fromEntries(
    Object.entries(schema.shape).filter(([, field]) =>
      where.includes((field as z.ZodType).meta()?.found_in as FoundIn)
    )
  ) as Record<string, z.ZodType>;

/**
 * The @elastic/schemas Zod output drops these params, but its JSON schemas keep them.
 * SPIKE: add them back so the requests keep the same shape.
 */
export const missingRoutingParams = {
  routing: Routing.optional(),
  wait_for_active_shards: WaitForActiveShards.optional(),
};
