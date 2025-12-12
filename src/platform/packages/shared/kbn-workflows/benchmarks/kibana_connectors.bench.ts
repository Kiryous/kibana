/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { BenchmarkRunnable } from '@kbn/bench';
import { getKibanaConnectors } from '../spec/kibana';

const forceGC = () => {
  if (global.gc) {
    global.gc();
  }
};

// eslint-disable-next-line import/no-default-export
export default async (): Promise<BenchmarkRunnable> => {
  return {
    async beforeAll() {
      // Warm-up run to trigger JIT compilation and lazy initialization
      getKibanaConnectors();
      forceGC();
    },
    async run() {
      forceGC();
      const heapBefore = process.memoryUsage().heapUsed;

      getKibanaConnectors();

      forceGC();
      const heapAfter = process.memoryUsage().heapUsed;

      return {
        metrics: {
          heapDelta: {
            title: 'Heap Delta',
            value: heapAfter - heapBefore,
            format: 'size',
          },
          heapUsed: {
            title: 'Heap Used',
            value: heapAfter,
            format: 'size',
          },
        },
      };
    },
  };
};
