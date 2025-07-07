/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useCallback, useState } from 'react';
import { parseDocument } from 'yaml';
import type { editor, Uri } from '@kbn/monaco';
import { useProviders } from '../../../model/useProviders';

interface UseYamlValidationProps {
  onValidationErrors?: React.Dispatch<React.SetStateAction<YamlValidationError[]>>;
}

// Types for validation
export interface YamlValidationError {
  message: string;
  severity: YamlValidationErrorSeverity;
  lineNumber: number;
  column: number;
  owner: string;
}

export type YamlValidationErrorSeverity = 'error' | 'warning' | 'info';

// Monaco marker severity enum
export enum MarkerSeverity {
  Hint = 1,
  Info = 2,
  Warning = 4,
  Error = 8,
}

const SEVERITY_MAP = {
  error: MarkerSeverity.Error,
  warning: MarkerSeverity.Warning,
  info: MarkerSeverity.Hint,
};

// Utility function to get severity string
const getSeverityString = (severity: MarkerSeverity): YamlValidationErrorSeverity => {
  switch (severity) {
    case MarkerSeverity.Error:
      return 'error';
    case MarkerSeverity.Warning:
      return 'warning';
    default:
      return 'info';
  }
};

// Mock regex for mustache expressions
const MUSTACHE_REGEX = /\{\{\s*(.+?)\s*\}\}/g;

// Mock validation function
const validateMustacheVariableForYAMLStep = (
  variableContent: string,
  currentStep: any,
  stepType: string,
  workflow: any,
  secrets: Record<string, string>,
  providers: any,
  installedProviders: any
): [string, YamlValidationErrorSeverity] | null => {
  // Basic validation - check for empty parts
  const parts = variableContent.split('.');
  const hasEmptyParts = parts.some((part: string) => !part || part.trim() === '');

  if (hasEmptyParts) {
    return [`Invalid mustache variable: '${variableContent}' - Parts cannot be empty.`, 'error'];
  }

  // Check for common patterns
  if (
    variableContent.startsWith('steps.') ||
    variableContent.startsWith('secrets.') ||
    variableContent.startsWith('alert.') ||
    variableContent.startsWith('incident.')
  ) {
    // Basic validation passed
    return null;
  }

  return [`Unknown variable reference: '${variableContent}'`, 'warning'];
};

// Mock function to get current path in YAML
const getCurrentPath = (yamlDoc: any, position: number): Array<string | number> => {
  // Simple mock implementation
  return ['workflow', 'steps', 0];
};

// Mock function to parse YAML to JSON
const parseWorkflowYamlStringToJSON = (yamlString: string): any => {
  try {
    const doc = parseDocument(yamlString);
    return doc.toJS();
  } catch (error) {
    throw new Error('Failed to parse YAML');
  }
};

export interface UseYamlValidationResult {
  validationErrors: YamlValidationError[] | null;
  validateMustacheExpressions: (
    model: editor.ITextModel | null,
    monaco: typeof import('@kbn/monaco') | null,
    secrets: Record<string, string>
  ) => void;
  handleMarkersChanged: (
    editor: editor.IStandaloneCodeEditor,
    modelUri: Uri,
    markers: editor.IMarker[] | editor.IMarkerData[],
    owner: string
  ) => void;
}

export function useYamlValidation({
  onValidationErrors,
}: UseYamlValidationProps): UseYamlValidationResult {
  const [validationErrors, setValidationErrors] = useState<YamlValidationError[] | null>(null);

  const { data: { providers, installed_providers: installedProviders } = {} } = useProviders();

  // Function to find the current step in the workflow based on the path
  const findStepFromPath = useCallback((path: Array<string | number>) => {
    if (!path || path.length < 3) {
      return null;
    }

    // Look for 'steps' in the path
    const stepsIdx = path.findIndex((p) => p === 'steps');
    if (stepsIdx === -1) {
      return null;
    }

    // Check if there's an index after 'steps'
    if (stepsIdx + 1 >= path.length || typeof path[stepsIdx + 1] !== 'number') {
      return null;
    }

    return {
      stepIndex: path[stepsIdx + 1] as number,
      isInStep: true,
    };
  }, []);

  const findActionFromPath = useCallback((path: Array<string | number>) => {
    if (!path || path.length < 3) {
      return null;
    }

    // Look for 'actions' in the path
    const actionsIdx = path.findIndex((p) => p === 'actions');
    if (actionsIdx === -1) {
      return null;
    }

    // Check if there's an index after 'actions'
    if (actionsIdx + 1 >= path.length || typeof path[actionsIdx + 1] !== 'number') {
      return null;
    }

    return {
      actionIndex: path[actionsIdx + 1] as number,
      isInAction: true,
    };
  }, []);

  // Function to validate mustache expressions and apply decorations
  const validateMustacheExpressions = useCallback(
    (
      model: editor.ITextModel | null,
      monaco: typeof import('@kbn/monaco') | null,
      secrets: Record<string, string> = {}
    ) => {
      if (!model || !monaco) {
        return;
      }

      try {
        const text = model.getValue();
        const yamlDoc = parseDocument(text);
        let workflowDefinition;

        try {
          // Parse the YAML to JSON to get the workflow definition
          workflowDefinition = parseWorkflowYamlStringToJSON(text);
        } catch (e) {
          // In Kibana, we would use the logger service instead of console
          // For now, we'll silently handle the error
        }

        // Collect markers to add to the model
        const markers: editor.IMarkerData[] = [];

        const matches = [...text.matchAll(MUSTACHE_REGEX)];
        // TODO: check if the variable is inside quoted string or yaml | or > string section
        for (const match of matches) {
          const matchStart = match.index ?? 0;
          const matchEnd = matchStart + match[0].length; // match[0] is the entire {{...}} expression

          // Get the position (line, column) for the match
          const startPos = model.getPositionAt(matchStart);
          const endPos = model.getPositionAt(matchEnd);

          // Get the current path in the YAML document
          const path = getCurrentPath(yamlDoc, matchStart);

          // Extract step information from the path
          const stepInfo = findStepFromPath(path);
          const actionInfo = findActionFromPath(path);

          const currentStepType = stepInfo?.isInStep ? 'step' : 'action';
          // Extract the content from the mustache expression (remove {{ and }})
          const variableContent = match[1].trim();

          let errorMessage: string | null = null;
          let severity: YamlValidationErrorSeverity = 'warning';

          // If we have both the workflow definition and step info, we can do proper validation
          if (
            workflowDefinition?.workflow &&
            (stepInfo || actionInfo) &&
            (workflowDefinition.workflow.steps || workflowDefinition.workflow.actions)
          ) {
            const currentStep = stepInfo?.isInStep
              ? workflowDefinition.workflow.steps[stepInfo.stepIndex]
              : actionInfo?.isInAction
              ? workflowDefinition.workflow.actions[actionInfo.actionIndex]
              : null;

            if (currentStep) {
              const result = validateMustacheVariableForYAMLStep(
                variableContent,
                currentStep,
                currentStepType,
                workflowDefinition.workflow,
                secrets ?? {},
                providers ?? null,
                installedProviders ?? null
              );

              if (result) {
                errorMessage = result[0];
                severity = result[1] as YamlValidationErrorSeverity;
              }
            }
          } else {
            // Fallback to basic validation when we don't have full context
            const parts = variableContent.split('.');
            const hasEmptyParts = parts.some((part: string) => !part || part.trim() === '');

            if (hasEmptyParts) {
              errorMessage = `Invalid mustache variable: '${variableContent}' - Parts cannot be empty.`;
              severity = 'error';
            }
            // Add warnings for variables we can't fully validate
            else if (
              !workflowDefinition &&
              (variableContent.startsWith('steps.') ||
                variableContent.startsWith('secrets.') ||
                variableContent.startsWith('alert.') ||
                variableContent.startsWith('incident.'))
            ) {
              errorMessage = `Warning: Unable to fully validate mustache variable '${variableContent}' without complete workflow context.`;
              severity = 'warning';
            }
          }

          // Add marker for validation issues
          if (errorMessage) {
            markers.push({
              severity: SEVERITY_MAP[severity],
              message: errorMessage,
              startLineNumber: startPos.lineNumber,
              startColumn: startPos.column,
              endLineNumber: endPos.lineNumber,
              endColumn: endPos.column,
              source: 'mustache-validation',
            });
          }
        }

        // Set markers on the model for the problems panel
        monaco.editor.setModelMarkers(model, 'mustache-validation', markers);
      } catch (error) {
        // In Kibana, we would use the logger service instead of console
        // For now, we'll silently handle the error
      }
    },
    [findStepFromPath, findActionFromPath, providers, installedProviders]
  );

  const handleMarkersChanged = useCallback(
    (
      editor: editor.IStandaloneCodeEditor,
      modelUri: Uri,
      markers: editor.IMarker[] | editor.IMarkerData[],
      owner: string
    ) => {
      const editorUri = editor.getModel()?.uri;
      if (modelUri.path !== editorUri?.path) {
        return;
      }

      const errors: YamlValidationError[] = [];
      for (const marker of markers) {
        errors.push({
          message: marker.message,
          severity: getSeverityString(marker.severity as MarkerSeverity),
          lineNumber: marker.startLineNumber,
          column: marker.startColumn,
          owner,
        });
      }
      const errorsUpdater = (prevErrors: YamlValidationError[] | null) => {
        const prevOtherOwners = prevErrors?.filter((e) => e.owner !== owner);
        return [...(prevOtherOwners ?? []), ...errors];
      };
      setValidationErrors(errorsUpdater);
      onValidationErrors?.(errorsUpdater);
    },
    [onValidationErrors]
  );

  return {
    validationErrors,
    validateMustacheExpressions,
    handleMarkersChanged,
  };
}
