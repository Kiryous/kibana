import React, { useCallback, useMemo, useState } from 'react';
import {
  EuiButton,
  EuiCallOut,
  EuiFieldNumber,
  EuiSelect,
  EuiTitle,
  EuiText,
  EuiSpacer,
  EuiFieldText,
  EuiButtonIcon,
  EuiPanel,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTabs,
  EuiIcon,
  EuiTab,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { debounce } from 'lodash';
import { EditorField } from './EditorField';
import { useProviders } from '../../../../../shared/model/useProviders';
import {
  NodeDataStepSchema,
  useWorkflowStore,
  V2ActionStep,
  V2Properties,
  V2StepConditionAssert,
  V2StepConditionThreshold,
  V2StepForeach,
  V2StepStep,
} from '../../../../../entities/workflows';
import {
  checkProviderNeedsInstallation,
  ValidationError,
} from '../../../../../entities/workflows/lib/validate-definition';
import { Provider } from '../../../../../shared/api/providers';
import { TestRunStepForm } from './StepTest';

const DynamicImageProviderIcon = ({ src, width, height, alt }: any) => {
  // TODO: Replace with proper icon component
  return (
    <div
      css={css`
        width: ${width}px;
        height: ${height}px;
        background-color: #ccc;
        display: inline-block;
        border-radius: 4px;
      `}
      title={alt}
    />
  );
};

const TextInput = ({
  placeholder,
  value,
  onChange,
  className,
  error,
  errorMessage,
  ...props
}: any) => {
  // TODO: Replace with EUI input component
  return (
    <EuiFieldText
      placeholder={placeholder}
      value={value || ''}
      onChange={onChange}
      isInvalid={error}
      fullWidth
      {...props}
    />
  );
};

const Drawer = ({ title, isOpen, onClose, children }: any) => {
  // TODO: Replace with EUI flyout
  if (!isOpen) return null;
  return (
    <EuiFlyout onClose={onClose} size="m">
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h2>{title}</h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>{children}</EuiFlyoutBody>
    </EuiFlyout>
  );
};

const ProviderForm = ({
  provider,
  installedProvidersMode,
  mutate,
  onConnectChange,
  closeModal,
  isProviderNameDisabled,
  isLocalhost,
  isHealthCheck,
}: any) => {
  // TODO: Replace with proper provider form component
  return (
    <EuiPanel>
      <EuiText>Provider Form (mock) for {provider.display_name}</EuiText>
      <EuiSpacer size="m" />
      <EuiButton onClick={() => onConnectChange(false, true, { success: true })}>
        Mock Connect
      </EuiButton>
    </EuiPanel>
  );
};

export function EditorLayout({
  children,
  ...props
}: {
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        margin: 10px 16px;
      `}
      {...props}
    >
      {children}
    </div>
  );
}

function KeyValueListField({
  keyValueList,
  onChange,
}: {
  keyValueList: Array<{ key: string; value: string }>;
  onChange: (value: any) => void;
}) {
  if (!keyValueList || !Array.isArray(keyValueList)) {
    return null;
  }
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      `}
    >
      {keyValueList.map((item, index) => (
        <div
          key={index}
          css={css`
            display: flex;
            align-items: center;
            gap: 4px;
          `}
        >
          <TextInput
            placeholder={`Key ${item.key}`}
            value={item.key}
            css={css`
              min-width: 0;
            `}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const updatedKeyValueList = [...keyValueList];
              updatedKeyValueList[index].key = e.target.value;
              onChange(updatedKeyValueList);
            }}
          />
          <TextInput
            placeholder={`Value ${item.value}`}
            value={item.value as string}
            css={css`
              min-width: 0;
            `}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const updatedKeyValueList = [...keyValueList];
              updatedKeyValueList[index].value = e.target.value;
              onChange(updatedKeyValueList);
            }}
          />
          <EuiButtonIcon
            iconType="trash"
            color="danger"
            aria-label={`Remove ${item.key}`}
            onClick={() => {
              const updatedKeyValueList = [...keyValueList];
              updatedKeyValueList.splice(index, 1);
              onChange(updatedKeyValueList);
            }}
          />
        </div>
      ))}
      <EuiButton
        onClick={() => {
          const updatedKeyValueList = [...keyValueList];
          updatedKeyValueList.push({ key: '', value: '' });
          onChange(updatedKeyValueList);
        }}
        size="s"
        fill={false}
        color="text"
        iconType="plus"
      >
        Add key-value pair
      </EuiButton>
    </div>
  );
}

export interface KeepEditorProps {
  properties: V2Properties;
  updateProperty: (key: string, value: any) => void;
  providers?: Provider[] | null | undefined;
  installedProviders?: Provider[] | null | undefined;
  providerType?: string;
  type?: string;
  isV2?: boolean;
}

function InstallProviderButton({
  providerType,
  onConnect,
}: {
  providerType: string;
  onConnect: (result: any) => void;
}) {
  const { data: { providers } = {}, mutate: mutateProviders } = useProviders();
  const providerObject = providers?.find((p) => p.type === providerType);
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!providerObject) {
    return null;
  }

  const closeModal = () => {
    setIsFormOpen(false);
  };

  const onConnectClick = () => {
    setIsFormOpen(true);
  };

  const onConnectChange = (isConnecting: boolean, isConnected: boolean, result: any) => {
    if (isConnected) {
      closeModal();
      onConnect(result);
    }
  };

  return (
    <>
      <EuiButton
        onClick={onConnectClick}
        isDisabled={providerObject.installed}
        fullWidth
        color="text"
        fill={false}
        size="s"
        iconSide="left"
      >
        <DynamicImageProviderIcon
          src={`/icons/${providerObject.type}-icon.png`}
          width={24}
          height={24}
          alt={providerObject.type}
        />
        Install{' '}
        <span
          css={css`
            font-size: 14px;
            text-transform: capitalize;
          `}
        >
          {providerObject.display_name}
        </span>
      </EuiButton>
      <Drawer
        title={`Connect to ${providerObject.display_name}`}
        isOpen={isFormOpen}
        onClose={closeModal}
      >
        <ProviderForm
          provider={{ ...providerObject, id: providerObject.type }}
          installedProvidersMode={false}
          mutate={() => {
            mutateProviders();
          }}
          onConnectChange={onConnectChange}
          closeModal={closeModal}
          isProviderNameDisabled={false}
          isLocalhost={false}
          isHealthCheck={false}
        />
      </Drawer>
    </>
  );
}

function KeepSetupProviderEditor({
  properties,
  updateProperty,
  providerType,
  providerError,
}: KeepEditorProps & {
  providerError?: string | null;
  providerNameError?: string | null;
}) {
  const { data: { providers, installed_providers: installedProviders } = {} } = useProviders();
  const providerObject = providers?.find((p) => p.type === providerType) ?? null;

  const installedProviderByType = installedProviders?.filter((p) => p.type === providerType);
  const doesProviderNeedInstallation = providerObject
    ? checkProviderNeedsInstallation(providerObject)
    : false;
  const providerConfig = !doesProviderNeedInstallation
    ? 'default-' + providerType
    : (properties.config ?? '')?.trim();

  const isCustomConfig =
    installedProviderByType?.find((p) => p.details?.name === providerConfig) === undefined &&
    providerConfig;

  const [selectValue, setSelectValue] = useState(
    isCustomConfig ? 'enter-manually' : providerConfig ?? ''
  );

  const isGeneralError = providerError?.includes('No provider selected');
  const inputError = providerError && !isGeneralError ? providerError : undefined;
  const isSelectError = !!inputError && selectValue !== 'enter-manually';

  const handleSelectChange = (value: string) => {
    setSelectValue(value);
    if (value === 'enter-manually' || value === 'add-new') {
      return;
    }
    updateProperty('config', value);
  };

  const handleProviderConnect = (result: any) => {
    if (!result.details?.name) {
      return;
    }
    setSelectValue(result.details?.name);
    updateProperty('config', result.details?.name);
  };

  const getSelectIcon = () => {
    if (selectValue === 'add-new') {
      return <EuiButtonIcon iconType="plus" />;
    }
    if (selectValue === 'enter-manually') {
      return <EuiButtonIcon iconType="pencil" />;
    }
    if (!providerType) {
      return null;
    }
    return (
      <div
        css={css`
          margin-right: 6px;
          display: inline-block;
        `}
      >
        <DynamicImageProviderIcon providerType={providerType} width="24" height="24" />
      </div>
    );
  };

  if (!doesProviderNeedInstallation) {
    return (
      <section>
        <EuiCallOut title="You're all set">
          <span
            css={css`
              text-transform: capitalize;
            `}
          >
            {providerType}
          </span>{' '}
          provider does not require installation
        </EuiCallOut>
      </section>
    );
  }

  const options = [
    ...installedProviderByType?.map((provider) => {
      const providerName = provider.details?.name ?? provider.id;
      return { value: providerName, label: providerName };
    }),
    { value: 'enter-manually', label: 'Manual provider name' },
    { value: 'add-new', label: `Add ${providerObject?.display_name ?? providerType} provider` },
  ];

  return (
    <section>
      <div
        css={css`
          margin-bottom: 8px;
        `}
      >
        <EuiTitle size="xs">
          <span
            css={css`
              text-transform: capitalize;
            `}
          >
            Select provider
          </span>
        </EuiTitle>
        {isGeneralError && (
          <EuiText
            css={css`
              color: #bd271e;
            `}
          >
            {providerError}
          </EuiText>
        )}
      </div>
      <EuiSelect
        css={css`
          margin-bottom: 6px;
        `}
        placeholder="Select provider"
        value={selectValue}
        icon={getSelectIcon}
        onValueChange={handleSelectChange}
        error={isSelectError}
        errorMessage={inputError}
        options={options}
      />
      {/* TODO: replace with select with "create new" option */}
      {/* <p className="text-sm text-gray-500 text-center mb-1.5">or</p> */}
      {selectValue === 'enter-manually' && (
        <>
          <EuiText
            css={css`
              margin-bottom: 6px;
            `}
          >
            Enter provider name manually
          </EuiText>
          <TextInput
            placeholder="Enter provider name"
            onChange={(e: any) => updateProperty('config', e.target.value)}
            css={css`
              margin-bottom: 10px;
            `}
            value={providerConfig || ''}
            error={!!inputError}
            errorMessage={inputError}
            disabled={!doesProviderNeedInstallation}
          />
        </>
      )}
      {selectValue === 'add-new' && providerType && (
        <InstallProviderButton providerType={providerType} onConnect={handleProviderConnect} />
      )}
    </section>
  );
}

function KeepStepEditor({
  properties,
  updateProperty,
  type,
  parametersError,
  variableError,
}: KeepEditorProps & {
  parametersError?: string | null;
  variableError?: string | null;
}) {
  const stepParams =
    ((type?.includes('step-') ? properties.stepParams : properties.actionParams) as string[]) ?? [];
  const existingParams = Object.keys((properties.with as object) ?? {});
  const params = [...stepParams, ...existingParams];
  const uniqueParams = params
    .filter((item, pos) => params.indexOf(item) === pos)
    .filter((item) => item !== 'kwargs' && item !== 'enrich_alert' && item !== 'enrich_incident');

  function handleWithKeyChange(e: any) {
    const currentWith = (properties.with as object) ?? {};
    updateProperty('with', { ...currentWith, [e.target.id]: e.target.value });
  }

  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        gap: 8px;
      `}
    >
      <section
        css={css`
          display: flex;
          flex-direction: column;
          gap: 8px;
        `}
      >
        <div>
          <EuiTitle size="xs">
            <span
              css={css`
                text-transform: capitalize;
              `}
            >
              Provider parameters
            </span>
          </EuiTitle>
          {parametersError && <EuiCallOut color="danger" title={parametersError} />}
          {variableError && (
            <EuiCallOut color="danger" title={variableError.split('-')[0]}>
              {variableError.split('-')[1]}
            </EuiCallOut>
          )}
          {uniqueParams.map((key) => {
            let currentPropertyValue = ((properties.with as any) ?? {})[key];
            const isJson = typeof currentPropertyValue === 'object';
            if (isJson) {
              currentPropertyValue = JSON.stringify(currentPropertyValue, null, 2);
            }
            return (
              <EditorField
                key={key}
                name={key}
                value={currentPropertyValue}
                onChange={handleWithKeyChange}
                asTextarea={isJson}
              />
            );
          })}
        </div>
        <div
          css={css`
            display: flex;
            flex-direction: column;
            gap: 8px;
          `}
        >
          <EuiTitle size="xs">
            <span
              css={css`
                text-transform: capitalize;
              `}
            >
              Step parameters
            </span>
          </EuiTitle>
          <div>
            <EuiText
              css={css`
                margin-bottom: 6px;
              `}
            >
              If Condition
            </EuiText>
            <TextInput
              id="if"
              placeholder="If Condition"
              onValueChange={(value) => updateProperty('if', value)}
              css={css`
                margin-bottom: 10px;
              `}
              value={properties?.if || ('' as string)}
            />
          </div>
          <div>
            <EuiText
              css={css`
                text-transform: capitalize;
                margin-bottom: 6px;
              `}
            >
              Variables
            </EuiText>
            <KeyValueListField
              keyValueList={Object.entries(properties.vars ?? {}).map(([key, value]) => ({
                key,
                value: value as string,
              }))}
              onChange={(newList) => {
                updateProperty(
                  'vars',
                  newList.reduce((acc: any, item: any) => {
                    acc[item.key] = item.value;
                    return acc;
                  }, {})
                );
              }}
            />
          </div>
          {properties.with?.enrich_alert && (
            <div>
              <EuiText>Enrich Alert</EuiText>
              <EuiText
                css={css`
                  font-size: 14px;
                  color: #6b7280;
                  margin-bottom: 8px;
                `}
              >
                Enrich alert with the following key-value pairs. Only works if alert trigger is
                enabled.
              </EuiText>
              <KeyValueListField
                keyValueList={properties.with.enrich_alert}
                onChange={(newList) => {
                  updateProperty('with', {
                    ...properties.with,
                    enrich_alert: newList,
                  });
                }}
              />
            </div>
          )}
          {properties.with?.enrich_incident && (
            <div>
              <EuiText>Enrich Incident</EuiText>
              <EuiText
                css={css`
                  font-size: 14px;
                  color: #6b7280;
                  margin-bottom: 8px;
                `}
              >
                Enrich incident with the following key-value pairs. Only works if incident trigger
                is enabled.
              </EuiText>
              <KeyValueListField
                keyValueList={properties.with.enrich_incident}
                onChange={(newList) => {
                  updateProperty('with', {
                    ...properties.with,
                    enrich_incident: newList,
                  });
                }}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function KeepThresholdConditionEditor({
  properties,
  updateProperty,
  error,
}: {
  properties: V2StepConditionThreshold['properties'];
  updateProperty: (key: string, value: any) => void;
  error?: ValidationError | null;
}) {
  const currentValueValue = properties.value ?? '';
  const currentCompareToValue = properties.compare_to ?? '';
  const errorMessage = error?.[0];
  return (
    <>
      {errorMessage && (
        <EuiText
          css={css`
            color: #bd271e;
          `}
        >
          {errorMessage}
        </EuiText>
      )}
      <EuiText>Value</EuiText>
      {typeof currentValueValue === 'number' ? (
        <EuiFieldNumber
          placeholder="Value"
          onChange={(e: any) => updateProperty('value', e.target.value)}
          css={css`
            margin-bottom: 10px;
          `}
          value={currentValueValue}
        />
      ) : (
        <TextInput
          placeholder="Value"
          onChange={(e: any) => updateProperty('value', e.target.value)}
          css={css`
            margin-bottom: 10px;
          `}
          value={currentValueValue}
        />
      )}
      <EuiText>Compare to</EuiText>
      {typeof currentCompareToValue === 'number' ? (
        <EuiFieldNumber
          placeholder="Compare with"
          onChange={(e: any) => updateProperty('compare_to', e.target.value)}
          css={css`
            margin-bottom: 10px;
          `}
          value={currentCompareToValue}
        />
      ) : (
        <TextInput
          placeholder="Compare with"
          onChange={(e: any) => updateProperty('compare_to', e.target.value)}
          css={css`
            margin-bottom: 10px;
          `}
          value={currentCompareToValue}
        />
      )}
    </>
  );
}

function KeepAssertConditionEditor({
  properties,
  updateProperty,
  error,
}: {
  properties: V2StepConditionAssert['properties'];
  updateProperty: (key: string, value: any) => void;
  error?: ValidationError | null;
}) {
  const currentAssertValue = properties.assert ?? '';
  const errorMessage = error?.[0];
  return (
    <>
      <EuiText>Assert</EuiText>
      <TextInput
        placeholder="E.g. 200 == 200"
        onChange={(e: any) => updateProperty('assert', e.target.value)}
        css={css`
          margin-bottom: 10px;
        `}
        value={currentAssertValue}
        error={!!errorMessage}
        errorMessage={errorMessage ?? undefined}
      />
    </>
  );
}

function KeepForeachEditor({
  properties,
  updateProperty,
  error,
}: {
  properties: V2StepForeach['properties'];
  updateProperty: (key: string, value: any) => void;
  error?: ValidationError | null;
}) {
  const currentValueValue = properties.value ?? '';
  const errorMessage = error?.[0];
  return (
    <>
      <EuiText>Foreach Value</EuiText>
      <TextInput
        placeholder="Value"
        onChange={(e: any) => updateProperty('value', e.target.value)}
        css={css`
          margin-bottom: 10px;
        `}
        value={currentValueValue}
        error={!!errorMessage}
        errorMessage={errorMessage ?? undefined}
      />
    </>
  );
}

type ActionOrStepProperties = V2StepStep['properties'] | V2ActionStep['properties'];

export function StepEditorV2() {
  const { selectedNode } = useWorkflowStore();
  // Using selector here to get updated node data on yaml change
  const selectedNodeData = useWorkflowStore(
    (state) => state.nodes.find((node) => node.id === selectedNode)?.data ?? null
  );

  const nodeData = useMemo(() => {
    if (!selectedNode) {
      return null;
    }
    if (
      !selectedNodeData ||
      selectedNodeData.componentType === 'condition-assert__end' ||
      selectedNodeData.componentType === 'condition-threshold__end'
    ) {
      return null;
    }

    const parsedNode = NodeDataStepSchema.safeParse(selectedNodeData);
    if (!parsedNode.success) {
      // console.error(parsedNode.error);
    }
    return {
      type: selectedNodeData.type,
      componentType: selectedNodeData.componentType,
      name: selectedNodeData.name,
      properties: selectedNodeData.properties,
    };
  }, [selectedNode, selectedNodeData]);

  if (!nodeData) {
    // If the node is not a step, action, condition or foreach, don't render anything
    return null;
  }

  if (nodeData.componentType === 'switch' && nodeData.type === 'condition-threshold') {
    return (
      <ConditionsAndMiscEditor
        initialFormData={{
          type: 'condition-threshold',
          name: nodeData.name,
          properties: nodeData.properties as V2StepConditionThreshold['properties'],
        }}
      />
    );
  }

  if (nodeData.componentType === 'switch' && nodeData.type === 'condition-assert') {
    return (
      <ConditionsAndMiscEditor
        initialFormData={{
          type: 'condition-assert',
          name: nodeData.name,
          properties: nodeData.properties as V2StepConditionAssert['properties'],
        }}
      />
    );
  }
  if (nodeData.componentType === 'container') {
    return (
      <ConditionsAndMiscEditor
        initialFormData={{
          type: nodeData.type as 'foreach',
          name: nodeData.name,
          properties: nodeData.properties as V2StepForeach['properties'],
        }}
      />
    );
  }
  return (
    <ActionOrStepEditor
      initialFormData={{
        type: nodeData.type,
        name: nodeData.name,
        properties: nodeData.properties as ActionOrStepProperties,
      }}
    />
  );
}

type ConditionsAndMiscFormDataType =
  | {
      type: 'condition-threshold';
      name: string;
      properties: V2StepConditionThreshold['properties'];
    }
  | {
      type: 'condition-assert';
      name: string;
      properties: V2StepConditionAssert['properties'];
    }
  | {
      type: 'foreach';
      name: string;
      properties: V2StepForeach['properties'];
    };

function ConditionsAndMiscEditor({
  initialFormData,
}: {
  initialFormData: ConditionsAndMiscFormDataType;
}) {
  const [formData, setFormData] = useState(initialFormData);
  const { updateSelectedNodeData, setEditorSynced, validationErrors } = useWorkflowStore();
  const error = validationErrors?.[formData.name || ''];
  const saveFormDataToStoreDebounced = useCallback(
    debounce((formData: any) => {
      updateSelectedNodeData('name', formData.name);
      updateSelectedNodeData('properties', formData.properties);
    }, 300),
    [updateSelectedNodeData]
  );
  const handlePropertyChange = (key: string, value: any) => {
    const updatedFormData = {
      ...formData,
      properties: {
        ...formData.properties,
        [key]: value,
      },
    };
    setFormData(updatedFormData as ConditionsAndMiscFormDataType);
    setEditorSynced(false);
    saveFormDataToStoreDebounced(updatedFormData);
  };
  return (
    <EditorLayout
      css={css`
        flex: 1;
      `}
    >
      {formData.type === 'condition-threshold' ? (
        <KeepThresholdConditionEditor
          properties={formData.properties}
          updateProperty={handlePropertyChange}
          error={error}
        />
      ) : formData.type === 'foreach' ? (
        <KeepForeachEditor
          properties={formData.properties}
          updateProperty={handlePropertyChange}
          error={error}
        />
      ) : formData.type === 'condition-assert' ? (
        <KeepAssertConditionEditor
          properties={formData.properties}
          updateProperty={handlePropertyChange}
          error={error}
        />
      ) : null}
    </EditorLayout>
  );
}

interface ActionOrStepFormDataType {
  type: string;
  name?: string;
  properties: ActionOrStepProperties;
}

function ActionOrStepEditor({ initialFormData }: { initialFormData: ActionOrStepFormDataType }) {
  const [formData, setFormData] = useState<ActionOrStepFormDataType>(initialFormData);
  const {
    updateSelectedNodeData,
    setEditorSynced,
    triggerSave,
    validationErrors,
    isEditorSyncedWithNodes,
    isSaving,
  } = useWorkflowStore();

  const saveFormDataToStoreDebounced = useCallback(
    debounce((formData: any) => {
      updateSelectedNodeData('name', formData.name);
      updateSelectedNodeData('properties', formData.properties);
    }, 300),
    [updateSelectedNodeData]
  );

  const providerType = formData?.type?.split('-')[1];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedFormData = { ...formData, [e.target.name]: e.target.value };
    setFormData(updatedFormData);
    setEditorSynced(false);
    saveFormDataToStoreDebounced(updatedFormData);
  };

  const handlePropertyChange = (key: string, value: any) => {
    const updatedFormData = {
      ...formData,
      properties: {
        ...formData.properties,
        [key]: value,
      } as ActionOrStepProperties,
    };
    setFormData(updatedFormData);
    setEditorSynced(false);
    saveFormDataToStoreDebounced(updatedFormData);
  };

  const handleSubmit = () => {
    triggerSave();
  };

  const type = formData
    ? formData.type?.includes('step-') || formData.type?.includes('action-')
    : '';

  const error = validationErrors?.[formData.name || ''];
  let parametersError = null;
  let providerError = null;
  let variableError = null;
  const errorMessage = error?.[0];

  if (errorMessage?.includes('parameters')) {
    parametersError = errorMessage;
  }

  if (errorMessage?.includes('provider')) {
    providerError = errorMessage;
  }

  if (errorMessage?.startsWith('Variable:')) {
    variableError = errorMessage;
  }

  const { data: { installed_providers: installedProviders } = {} } = useProviders();

  const providerObject = installedProviders?.find((p) => p.type === providerType);

  const method = formData.type?.includes('step-') ? '_query' : '_notify';
  const methodParams = formData.properties?.with ?? {};
  const providerConfig =
    providerObject && !checkProviderNeedsInstallation(providerObject)
      ? 'default-' + providerType
      : (formData.properties?.config ?? '')?.trim();

  const installedProvider = installedProviders?.find(
    (p) => p.type === providerType && p.details?.name === providerConfig
  );
  const providerId = installedProvider?.id;

  const defaultTabIndex = providerError ? 0 : parametersError ? 1 : 1;

  const [tabIndex, setTabIndex] = useState(defaultTabIndex);

  const handleTabChange = (index: number) => {
    setTabIndex(index);
  };

  const saveButtonDisabled = !isEditorSyncedWithNodes || isSaving;
  const saveButtonText = isSaving ? 'Saving...' : 'Save & Continue';

  const setupStatus = () => {
    if (providerError) {
      return 'error';
    }
    return 'ok';
  };

  const configureStatus = () => {
    if (parametersError) {
      return 'error';
    }
    if (formData.properties?.with && Object.keys(formData.properties?.with).length > 0) {
      return 'ok';
    }
    return 'neutral';
  };

  const getStepIcon = (status: 'error' | 'ok' | 'neutral') => {
    if (status === 'error') {
      return <EuiButtonIcon iconType="alert" color="danger" />;
    }
    if (status === 'ok') {
      return <EuiButtonIcon iconType="check" color="success" />;
    }
    return null;
  };

  return (
    <div
      // tabs={[
      //   { id: 'select', name: 'Setup' },
      //   { id: 'configure', name: 'Configure' },
      //   { id: 'test', name: 'Test' },
      // ]}
      // selectedTabId={tabIndex.toString()}
      // onTabClick={handleTabChange}
      css={css`
        flex: 1;
        display: flex;
        flex-direction: column;
      `}
    >
      <div
        css={css`
          padding: 10px 16px;
        `}
      >
        <EuiTitle size="s">
          <span className="capitalize">
            {providerType} {formData.type.split('-')[0]}
          </span>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiText size="s">Unique Identifier</EuiText>
        <TextInput
          className="mb-2.5"
          icon={<EuiIcon type="key" />}
          name="name"
          value={formData.name || ''}
          onChange={handleInputChange}
          placeholder="e.g. my-step"
          data-testid="wf-editor-step-name-input"
        />
      </div>
      <EuiTabs
        size="m"
        css={css`
          padding: 0 16px;
        `}
      >
        <EuiTab id="select" isSelected={tabIndex === 0} onClick={() => setTabIndex(0)}>
          Setup
        </EuiTab>
        <EuiTab id="configure" isSelected={tabIndex === 1} onClick={() => setTabIndex(1)}>
          Configure
        </EuiTab>
        <EuiTab id="test" isSelected={tabIndex === 2} onClick={() => setTabIndex(2)}>
          Test
        </EuiTab>
      </EuiTabs>
      <div style={{ display: tabIndex === 0 ? 'block' : 'none' }}>
        <div
          css={css`
            height: 100%;
            display: flex;
            flex-direction: column;
          `}
        >
          <EditorLayout
            css={css`
              flex: 1;
            `}
          >
            {type && formData.properties ? (
              <KeepSetupProviderEditor
                providerType={providerType}
                providerError={providerError}
                properties={formData.properties}
                updateProperty={handlePropertyChange}
              />
            ) : null}
          </EditorLayout>
          <div
            css={css`
              position: sticky;
              bottom: 0;
              display: flex;
              justify-content: flex-end;
              padding: 16px;
              background-color: white;
              border-top: 1px solid #d3dae6;
            `}
          >
            <EuiButton
              fill={false}
              color="primary"
              onClick={() => {
                handleSubmit();
                setTabIndex(1);
              }}
              data-testid="wf-editor-setup-save-button"
              disabled={saveButtonDisabled}
            >
              {saveButtonText}
            </EuiButton>
          </div>
        </div>
      </div>
      <div style={{ display: tabIndex === 1 ? 'block' : 'none' }}>
        <div
          css={css`
            height: 100%;
            display: flex;
            flex-direction: column;
          `}
        >
          <EditorLayout
            css={css`
              flex: 1;
            `}
          >
            {type && formData.properties ? (
              <KeepStepEditor
                parametersError={parametersError}
                variableError={variableError}
                properties={formData.properties}
                updateProperty={handlePropertyChange}
                providerType={providerType}
                type={formData.type}
              />
            ) : null}
          </EditorLayout>
          <div
            css={css`
              position: sticky;
              bottom: 0;
              display: flex;
              justify-content: flex-end;
              padding: 16px;
              background-color: white;
              border-top: 1px solid #d3dae6;
            `}
          >
            <EuiButton
              fill={false}
              color="primary"
              onClick={() => {
                handleSubmit();
                setTabIndex(2);
              }}
              data-testid="wf-editor-configure-save-button"
              disabled={saveButtonDisabled}
            >
              {saveButtonText}
            </EuiButton>
          </div>
        </div>
      </div>
      <div style={{ display: tabIndex === 2 ? 'block' : 'none' }}>
        <TestRunStepForm
          providerInfo={{
            provider_id: providerId || providerConfig || '',
            provider_type: providerType ?? '',
          }}
          method={method}
          methodParams={methodParams}
        />
      </div>
    </div>
  );
}
