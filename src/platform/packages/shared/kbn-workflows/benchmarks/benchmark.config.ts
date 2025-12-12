/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { InitialBenchConfig } from '@kbn/bench';

const config: InitialBenchConfig = {
  name: 'workflows_schema',
  runs: 5,
  benchmarks: [
    {
      kind: 'module',
      name: 'kibana_connectors',
      description: 'Measure getKibanaConnectors memory/CPU usage (module)',
      module: require.resolve('./kibana_connectors.bench'),
    },
    {
      kind: 'module',
      name: 'elasticsearch_connectors',
      description: 'Measure getElasticsearchConnectors memory/CPU usage (module)',
      module: require.resolve('./elasticsearch_connectors.bench'),
    },
  ],
};

// eslint-disable-next-line import/no-default-export
export default config;
