/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { parseDocument } from 'yaml';
import { filterMonacoYamlMarkers } from './filter_monaco_yaml_markers';

// Helper to create a mock Monaco editor model from YAML text
function createMockEditorModel(text: string) {
  const lines = text.split('\n');

  return {
    getValue: () => text,
    getOffsetAt: ({ lineNumber, column }: { lineNumber: number; column: number }) => {
      let offset = 0;
      for (let i = 0; i < lineNumber - 1; i++) {
        offset += lines[i].length + 1; // +1 for newline
      }
      offset += column - 1;
      return offset;
    },
    getLineContent: (lineNumber: number) => lines[lineNumber - 1] ?? '',
  } as any;
}

// Helper to create a yaml-schema marker at a specific position
function createYamlSchemaMarker(
  startLineNumber: number,
  startColumn: number,
  endLineNumber: number,
  endColumn: number,
  message = 'Incorrect type. Expected "string".'
) {
  return {
    source: 'yaml-schema: file:///workflow-schema.json',
    severity: 8, // MarkerSeverity.Error
    message,
    startLineNumber,
    startColumn,
    endLineNumber,
    endColumn,
  };
}

describe('filterMonacoYamlMarkers', () => {
  describe('basic filtering of template variables', () => {
    const yamlText = `steps:
  - name: set_version
    type: data.set
    with:
      case_id: \${{steps.create_case.output.id}}
      case_version: \${{steps.create_case.output.version}}`;

    it('should filter out markers on fields with ${{ }} dynamic values', () => {
      const yamlDocument = parseDocument(yamlText);
      const editorModel = createMockEditorModel(yamlText);

      // Marker pointing to the value of case_id (line 5, after "case_id: ")
      const markers = [
        createYamlSchemaMarker(5, 17, 5, 55), // ${{steps.create_case.output.id}}
      ];

      const result = filterMonacoYamlMarkers(markers, editorModel, yamlDocument);
      expect(result).toHaveLength(0);
    });

    it('should filter out markers on fields with {{ }} variable values', () => {
      const yamlWithVariables = `steps:
  - name: test
    with:
      value: "{{ variable | filter }}"`;

      const yamlDocument = parseDocument(yamlWithVariables);
      const editorModel = createMockEditorModel(yamlWithVariables);

      const markers = [createYamlSchemaMarker(4, 14, 4, 40)];

      const result = filterMonacoYamlMarkers(markers, editorModel, yamlDocument);
      expect(result).toHaveLength(0);
    });

    it('should filter out markers on fields with {% %} liquid tag values', () => {
      const yamlWithLiquid = `steps:
  - name: test
    with:
      value: "{% if condition %}yes{% endif %}"`;

      const yamlDocument = parseDocument(yamlWithLiquid);
      const editorModel = createMockEditorModel(yamlWithLiquid);

      const markers = [createYamlSchemaMarker(4, 14, 4, 50)];

      const result = filterMonacoYamlMarkers(markers, editorModel, yamlDocument);
      expect(result).toHaveLength(0);
    });

    it('should keep markers on fields without template variables', () => {
      const yamlDocument = parseDocument(yamlText);
      const editorModel = createMockEditorModel(yamlText);

      // Marker pointing to "data.set" type value (line 3)
      const markers = [createYamlSchemaMarker(3, 11, 3, 19)];

      const result = filterMonacoYamlMarkers(markers, editorModel, yamlDocument);
      expect(result).toHaveLength(1);
    });

    it('should keep markers from non-yaml-schema sources', () => {
      const yamlDocument = parseDocument(yamlText);
      const editorModel = createMockEditorModel(yamlText);

      const markers = [
        {
          source: 'other-source',
          severity: 8,
          message: 'Some error',
          startLineNumber: 5,
          startColumn: 17,
          endLineNumber: 5,
          endColumn: 55,
        },
      ];

      const result = filterMonacoYamlMarkers(markers, editorModel, yamlDocument);
      expect(result).toHaveLength(1);
    });
  });

  describe('stale document bug (issue #15878)', () => {
    it('should suppress template variable markers even when yamlDocument is stale', () => {
      // Simulate the bug scenario:
      // 1. The editor content has been updated to include template variables
      // 2. But yamlDocumentRef.current still holds the OLD document (before template variables)
      // 3. Monaco YAML fires markers for the NEW content
      // 4. filterMonacoYamlMarkers should still suppress the markers

      // Old YAML (what yamlDocument was parsed from - before the user typed template vars)
      const oldYaml = `steps:
  - name: set_version
    type: data.set
    with:
      case_id: placeholder
      case_version: placeholder`;

      // New YAML (current editor content - after the user typed template vars)
      const newYaml = `steps:
  - name: set_version
    type: data.set
    with:
      case_id: \${{steps.create_case.output.id}}
      case_version: \${{steps.create_case.output.version}}`;

      // The yamlDocument is stale (parsed from old content)
      const staleDocument = parseDocument(oldYaml);
      // The editor model reflects the current (new) content
      const editorModel = createMockEditorModel(newYaml);

      // Monaco YAML validates the new content and creates markers at positions
      // corresponding to the NEW content's offsets
      const markers = [
        createYamlSchemaMarker(5, 17, 5, 55), // case_id value position in new content
        createYamlSchemaMarker(6, 21, 6, 63), // case_version value position in new content
      ];

      const result = filterMonacoYamlMarkers(markers, editorModel, staleDocument);

      // BUG: With the stale document, getScalarValueAtOffset uses wrong offsets
      // and fails to find the template variables, so markers are NOT suppressed.
      // After the fix, markers should be suppressed (length 0).
      expect(result).toHaveLength(0);
    });

    it('should suppress template variable markers when yamlDocument is null', () => {
      // Another stale scenario: yamlDocument hasn't been parsed yet at all
      const newYaml = `steps:
  - name: set_version
    type: data.set
    with:
      case_id: \${{steps.create_case.output.id}}`;

      const editorModel = createMockEditorModel(newYaml);

      const markers = [createYamlSchemaMarker(5, 17, 5, 55)];

      const result = filterMonacoYamlMarkers(markers, editorModel, null);

      // When yamlDocument is null, the current code skips filtering entirely.
      // After the fix, it should still detect template variables.
      expect(result).toHaveLength(0);
    });

    it('should suppress markers when document structure changed (lines added)', () => {
      // User added new lines, shifting offsets
      const oldYaml = `steps:
  - name: step1
    with:
      value: hello`;

      const newYaml = `steps:
  - name: step1
    type: data.set
    description: "A step"
    with:
      value: \${{steps.other.output.result}}`;

      const staleDocument = parseDocument(oldYaml);
      const editorModel = createMockEditorModel(newYaml);

      // Marker at the value position in the NEW content (line 6)
      const markers = [createYamlSchemaMarker(6, 14, 6, 48)];

      const result = filterMonacoYamlMarkers(markers, editorModel, staleDocument);
      expect(result).toHaveLength(0);
    });

    it('should still keep non-template markers even with stale document', () => {
      const oldYaml = `steps:
  - name: step1
    with:
      value: hello`;

      const newYaml = `steps:
  - name: step1
    type: invalid_type
    with:
      value: plain_value`;

      const staleDocument = parseDocument(oldYaml);
      const editorModel = createMockEditorModel(newYaml);

      // Marker on "invalid_type" - should NOT be suppressed
      const markers = [createYamlSchemaMarker(3, 11, 3, 23)];

      const result = filterMonacoYamlMarkers(markers, editorModel, staleDocument);
      expect(result).toHaveLength(1);
    });
  });
});
