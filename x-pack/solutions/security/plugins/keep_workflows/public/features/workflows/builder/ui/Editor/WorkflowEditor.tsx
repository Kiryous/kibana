import React from 'react';
import { css } from '@emotion/react';
import { EuiButton, EuiTitle, EuiText, EuiSpacer, EuiButtonIcon, EuiFieldText } from '@elastic/eui';
import { EditorLayout } from './StepEditor';
import { useWorkflowStore } from '../../../../../entities/workflows';

const TextInput = ({ placeholder, value, onChange, error, errorMessage, ...props }: any) => {
  // TODO: Replace with EUI input component
  return (
    <EuiFieldText
      placeholder={placeholder}
      value={value || ''}
      onChange={onChange}
      style={{ border: error ? '1px solid red' : '1px solid #ccc' }}
      {...props}
    />
  );
};

export function WorkflowEditorV2() {
  const {
    v2Properties: properties,
    updateV2Properties,
    selectedNode,
    validationErrors,
  } = useWorkflowStore();
  const isDeployed = useWorkflowStore((state) => state.workflowId !== null);

  const handleChange = (key: string, value: string | Record<string, any>) => {
    updateV2Properties({ [key]: value });
  };

  const addNewConstant = () => {
    const updatedConsts = {
      ...(properties.consts as { [key: string]: string }),
      [`newKey${Object.keys(properties.consts || {}).length}`]: '',
    };
    updateV2Properties({ consts: updatedConsts });
  };

  const lockedKeys = ['isLocked', 'id', 'disabled', 'alert', 'interval', 'incident', 'manual'];
  const metadataKeys = ['name', 'description'];
  // If workflow is not deployed, we can edit the metadata here, in side panel; otherwise we can edit via modal
  const toSkip = [...lockedKeys, ...(isDeployed ? metadataKeys : [])];

  const propertyKeys = Object.keys(properties).filter((k) => !toSkip.includes(k));
  let renderDivider = false;
  return (
    <EditorLayout>
      <EuiTitle size="xs">
        <h3>Workflow Settings</h3>
      </EuiTitle>
      <EuiSpacer size="s" />
      <div
        css={css`
          display: flex;
          flex-direction: column;
          gap: 8px;
        `}
      >
        {propertyKeys.map((key, index) => {
          const isTrigger = ['manual', 'alert', 'interval', 'incident'].includes(key);

          const isConst = key === 'consts';
          if (isConst && !properties[key]) {
            properties[key] = {};
          }

          renderDivider = isTrigger && key === selectedNode ? !renderDivider : false;

          const errorKey = ['name', 'description'].includes(key) ? `workflow_${key}` : key;
          const error = validationErrors?.[errorKey];
          return (
            <div key={key}>
              {renderDivider && <EuiSpacer size="m" />}
              {(key === selectedNode || !isTrigger) && (
                <EuiText
                  size="s"
                  css={css`
                    text-transform: capitalize;
                    margin-bottom: 6px;
                  `}
                >
                  {key}
                </EuiText>
              )}

              {(() => {
                switch (key) {
                  case 'consts':
                    // if consts is empty, set it to an empty object
                    if (!properties[key]) {
                      return null;
                    }
                    return (
                      <div key={key}>
                        {Object.entries(properties[key] as { [key: string]: string }).map(
                          ([constKey, constValue]) => (
                            <div
                              key={constKey}
                              css={css`
                                display: flex;
                                align-items: center;
                                margin-top: 4px;
                              `}
                            >
                              <TextInput
                                placeholder={`Key ${constKey}`}
                                value={constKey}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const updatedConsts = {
                                    ...(properties[key] as {
                                      [key: string]: string;
                                    }),
                                  };
                                  delete updatedConsts[constKey];
                                  updatedConsts[e.target.value] = constValue;
                                  handleChange(key, updatedConsts);
                                }}
                              />
                              <TextInput
                                placeholder={`Value ${constValue}`}
                                value={constValue}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const updatedConsts = {
                                    ...(properties[key] as {
                                      [key: string]: string;
                                    }),
                                  };
                                  updatedConsts[constKey] = e.target.value;
                                  handleChange(key, updatedConsts);
                                }}
                              />
                              <EuiButtonIcon
                                iconType="trash"
                                color="danger"
                                aria-label={`Remove ${constKey}`}
                                onClick={() => {
                                  const updatedConsts = {
                                    ...(properties[key] as {
                                      [key: string]: string;
                                    }),
                                  };
                                  delete updatedConsts[constKey];
                                  handleChange(key, updatedConsts);
                                }}
                              />
                            </div>
                          )
                        )}
                        <EuiButton
                          onClick={addNewConstant}
                          size="s"
                          css={css`
                            margin-left: 4px;
                            margin-top: 4px;
                          `}
                          fill={false}
                          color="text"
                          iconType="plus"
                        >
                          Add Constant
                        </EuiButton>
                      </div>
                    );
                  default:
                    return (
                      <TextInput
                        placeholder={`Set the ${key}`}
                        onChange={(e: any) => handleChange(key, e.target.value)}
                        value={properties[key] || ('' as string)}
                        error={!!error}
                        errorMessage={error?.[0]}
                      />
                    );
                }
              })()}
            </div>
          );
        })}
      </div>
    </EditorLayout>
  );
}
