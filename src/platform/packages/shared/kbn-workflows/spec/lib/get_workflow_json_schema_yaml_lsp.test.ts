/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { z } from '@kbn/zod/v4';
import { getWorkflowJsonSchema } from './get_workflow_json_schema';
import { getValidateWithYamlLsp } from './test_utils/validate_with_yaml_lsp';

interface MockPosition {
  line: number;
  character: number;
}

interface MockRange {
  start: MockPosition;
  end: MockPosition;
}

interface MockDiagnostic {
  message: string;
  severity: number;
  range: MockRange;
}

jest.mock('yaml-language-server', () => {
  return {
    getLanguageService: jest.fn((options: {
      schemaRequestService: (uri: string) => Promise<string>;
    }) => {
      return {
        configure: jest.fn(),
        doValidation: jest.fn(async () => {
          const rawSchema = await options.schemaRequestService('dummy://schema.json');
          const schema = JSON.parse(rawSchema) as {
            $ref?: string;
            properties?: Record<string, unknown>;
          };

          // Simulate yaml-language-server behavior: root-only $ref schemas
          // can fail to return meaningful validation diagnostics.
          if (schema.$ref && !schema.properties) {
            return [];
          }

          const diagnostics: MockDiagnostic[] = [
            {
              message: 'Mock validation error',
              severity: 1,
              range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 4 },
              },
            },
          ];

          return diagnostics;
        }),
      };
    }),
  };
});

describe('getWorkflowJsonSchema / yaml-language-server compatibility', () => {
  it('resolves root $ref schemas so yaml-language-server can validate', async () => {
    const baseSchema = z.object({
      name: z.string().min(1),
      enabled: z.boolean().default(true),
      triggers: z.array(z.object({ type: z.string() })),
      steps: z.array(z.object({ name: z.string(), type: z.string() })),
    });

    // Workflow schemas use transforms, which can produce root $ref output.
    const transformSchema = baseSchema.transform((value) => value);
    const jsonSchema = getWorkflowJsonSchema(transformSchema);

    if (!jsonSchema) {
      throw new Error('Expected JSON schema to be generated');
    }

    const schemaWithRootRef = jsonSchema as {
      $ref?: string;
      properties?: Record<string, unknown>;
    };

    // Regression assertion: root schema should expose properties directly.
    expect(schemaWithRootRef.$ref).toBeUndefined();
    expect(schemaWithRootRef.properties).toBeDefined();

    const validateWithYamlLsp = getValidateWithYamlLsp(jsonSchema);

    const diagnostics = await validateWithYamlLsp(
      'test-workflow.yaml',
      `name: 42
enabled: true
triggers:
  - type: manual
steps:
  - name: step1
    type: console
`
    );

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      severity: 'error',
      message: 'Mock validation error',
    });
  });
});
