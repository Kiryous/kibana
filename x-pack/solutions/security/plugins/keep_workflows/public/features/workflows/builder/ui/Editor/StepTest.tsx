import React, { useMemo, useState } from 'react';
import {
  EuiButton,
  EuiFieldText,
  EuiCallOut,
  EuiText,
  EuiSpacer,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { EditorLayout } from './StepEditor';

// Mock implementations - TODO: Replace with real Kibana services
const useApi = () => {
  // TODO: Implement real Kibana API service
  return {
    post: async (url: string, data: any) => {
      // Mock API response
      return { success: true, data: 'Mock response' };
    },
  };
};

const JsonCard = ({ title, json }: { title: string; json: any }) => {
  // TODO: Replace with proper EUI component
  return (
    <div style={{ border: '1px solid #ccc', padding: '8px', margin: '8px 0' }}>
      <strong>{title}</strong>
      <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(json, null, 2)}
      </pre>
    </div>
  );
};

const MonacoEditor = ({ value, ...props }: { value: string; [key: string]: any }) => {
  // TODO: Replace with proper code editor component
  return <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap', padding: '8px' }}>{value}</pre>;
};

const TextInput = ({ placeholder, value, onChange, ...props }: any) => {
  // TODO: Replace with EUI input component
  return (
    <EuiFieldText placeholder={placeholder} value={value || ''} onChange={onChange} {...props} />
  );
};

export function useTestStep() {
  const api = useApi();
  async function testStep(
    providerId: string,
    method: '_query' | '_notify',
    methodParams: Record<string, any>
  ) {
    return await api.post(`/providers/${providerId}/invoke/${method}`, {
      ...methodParams,
    });
  }

  return testStep;
}

const variablesRegex = /{{[\s]*.*?[\s]*}}/g;

export function TestRunStepForm({
  providerInfo,
  method,
  methodParams,
}: {
  providerInfo: { provider_id: string; provider_type: string };
  method: '_query' | '_notify';
  methodParams: Record<string, any>;
}) {
  const testStep = useTestStep();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Todo: find {{variables}} in the formData with regex, and store them in a dict [variable_name: ""]
  const variables = useMemo(() => {
    const foundVariables: Record<string, string> = {};

    for (const value of Object.values(methodParams)) {
      const variableMatch = JSON.stringify(value).matchAll(variablesRegex);
      for (const match of variableMatch) {
        if (!match) {
          continue;
        }
        for (const variable of match) {
          const variableName = variable.replace(/{{|}}/g, '').trim();
          if (variableName) {
            foundVariables[variableName] = '';
          }
        }
      }
    }
    return foundVariables;
  }, [methodParams]);

  const [variablesOverride, setVariablesOverride] = useState<Record<string, string>>({});

  const resultingParameters = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(methodParams).map(([key, value]) => {
          // FIX: Convert to string only if needed
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          let processedResult = stringValue;

          // Find all variables in the value
          const matches = Array.from(stringValue.matchAll(variablesRegex));
          for (const match of matches) {
            const variableName = match[0].replace(/{{|}}/g, '').trim();
            if (variableName && variablesOverride[variableName]) {
              result = result.replaceAll(
                new RegExp(`{{\\s*${variableName}\\s*}}`, 'g'),
                variablesOverride[variableName]
              );
            }
          }

          // Convert back to original type if it was JSON
          try {
            return [
              key,
              typeof value === 'object'
                ? JSON.parse(result)
                : typeof value === 'number'
                ? Number(result)
                : result,
            ];
          } catch {
            return [key, result];
          }
        })
      ),
    [methodParams, variablesOverride]
  );

  function handleRun(e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const handleTestStep = async () => {
      try {
        setIsLoading(true);
        setErrors({});
        const result = await testStep(providerInfo.provider_id, method, resultingParameters);
        setResult(result);
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        setErrors({
          'Failed to test step': errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };
    handleTestStep();
  }

  const isDisabled =
    !providerInfo.provider_id ||
    !providerInfo.provider_type ||
    Object.values(methodParams).every((value) => !value);

  return (
    <form className="h-full flex flex-col" onSubmit={handleRun}>
      <EditorLayout className="flex-1 flex flex-col gap-5">
        {Object.values(variables).length > 0 && (
          <section>
            <EuiText size="s">
              <strong>Override variables</strong>
            </EuiText>
            <EuiSpacer size="xs" />
            <EuiText size="s">
              Your parameters use the following variables. You can override them, it only applies to
              this test run.
            </EuiText>
            <EuiSpacer size="s" />
            <ul className="flex flex-col gap-2">
              {Object.entries(variables).map(([varName, value]) => (
                <li key={varName} className="flex flex-col gap-1">
                  <code className="whitespace-pre-wrap text-sm">{`${varName} =`}</code>
                  <TextInput
                    value={variablesOverride[varName] ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setVariablesOverride({
                        ...variablesOverride,
                        [varName]: e.target.value,
                      })
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
        <section>
          <EuiText size="s">
            <strong>Provider and parameters</strong>
          </EuiText>
          <EuiSpacer size="xs" />
          {Object.values(variablesOverride).some((value) => value) && (
            <>
              <EuiText size="s">The parameters after the variables are overridden.</EuiText>
              <EuiSpacer size="xs" />
            </>
          )}
          <div>
            <JsonCard title="Provider configuration" json={providerInfo} />
            <JsonCard title="Parameters" json={resultingParameters} />
          </div>
        </section>
        <section>
          <EuiText size="s">
            <strong>Result</strong>
          </EuiText>
          <EuiSpacer size="xs" />
          <EuiText size="s">The result of the test run will be displayed here.</EuiText>
          <EuiSpacer size="s" />
          {isLoading && (
            <div className="flex justify-center">
              <EuiLoadingSpinner size="xl" />
            </div>
          )}
          {result && (
            <pre
              className="bg-gray-100 rounded-md overflow-hidden text-xs my-2"
              ref={(el) => {
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              <div className="text-gray-500 bg-gray-50 p-2">Result</div>
              <div
                className="overflow-auto bg-[#fffffe] break-words whitespace-pre-wrap py-2 border rounded-[inherit] rounded-t-none  border-gray-200"
                style={{
                  height: Math.min(
                    JSON.stringify(result, null, 2).split('\n').length * 20 + 16,
                    192
                  ),
                }}
              >
                <MonacoEditor
                  value={JSON.stringify(result, null, 2)}
                  height="100%"
                  language="json"
                  theme="vs"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </pre>
          )}
          {Object.keys(errors).length > 0 && (
            <>
              <EuiCallOut title="Error occurred while testing step" color="danger" iconType="alert">
                {Object.entries(errors).map(([key, value]) => (
                  <div key={key}>
                    <strong>{key}:</strong> {value}
                  </div>
                ))}
              </EuiCallOut>
              <EuiSpacer size="s" />
              {/* <WFDebugWithAIButton
                errors={errors}
                description={`Testing step with provider ${providerInfo.provider_type}`}
              /> */}
            </>
          )}
        </section>
        <EuiSpacer size="m" />
        <EuiButton type="submit" fill isLoading={isLoading} isDisabled={isDisabled}>
          Run Test
        </EuiButton>
      </EditorLayout>
    </form>
  );
}
