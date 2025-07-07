import React, { useCallback } from 'react';
import {
  EuiButton,
  EuiFieldText,
  EuiText,
  EuiTitle,
  EuiButtonIcon,
  EuiSwitch,
  EuiFormRow,
  EuiSpacer,
} from '@elastic/eui';
import { debounce } from 'lodash';
import { EditorLayout } from './StepEditor';
import { useWorkflowStore } from '../../../../../entities/workflows';

// // Mock implementations - TODO: Replace with real Kibana services
// const useWorkflowStore = () => {
//   // TODO: Implement real Kibana workflow store
//   return {
//     v2Properties: {} as Record<string, any>,
//     updateV2Properties: (updates: any) => {},
//     updateSelectedNodeData: (key: string, value: any) => {},
//     selectedNode: null as string | null,
//     validationErrors: {} as Record<string, any>,
//   };
// };

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const getHumanReadableInterval = (seconds: string | number) => {
  // TODO: Implement proper interval formatting
  const num = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
  if (num < 60) return `${num} seconds`;
  if (num < 3600) return `${Math.floor(num / 60)} minutes`;
  return `${Math.floor(num / 3600)} hours`;
};

const CelInput = ({
  value,
  placeholder,
  onValueChange,
  onClearValue,
  fieldsForSuggestions,
  staticPositionForSuggestions,
  ...props
}: any) => {
  // TODO: Replace with proper CEL input component
  return (
    <EuiFieldText
      placeholder={placeholder}
      value={value || ''}
      onChange={(e) => onValueChange?.(e.target.value)}
      {...props}
    />
  );
};

const useFacetPotentialFields = (type: string) => {
  // TODO: Implement real facet fields hook
  return {
    data: [],
  };
};

const AlertsCountBadge = ({ vertical, presetCEL, isDebouncing, description }: any) => {
  // TODO: Replace with proper alerts count component
  return (
    <div style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px' }}>
      <EuiText size="s">{description}</EuiText>
      <EuiText size="s">Count: 0 (mock)</EuiText>
    </div>
  );
};

const useConfig = () => {
  // TODO: Implement real Kibana config service
  return {
    data: {
      KEEP_DOCS_URL: 'https://docs.keep.dev',
    },
  };
};

const TextInput = ({ placeholder, value, onChange, error, errorMessage, ...props }: any) => {
  // TODO: Replace with EUI input component
  return (
    <EuiFieldText
      placeholder={placeholder}
      value={value || ''}
      onChange={onChange}
      isInvalid={error}
      {...props}
    />
  );
};

export function TriggerEditor() {
  const {
    v2Properties: properties,
    updateV2Properties,
    updateSelectedNodeData,
    selectedNode,
    validationErrors,
  } = useWorkflowStore();

  const { data: config } = useConfig();

  const docsUrl = config?.KEEP_DOCS_URL || 'https://docs.keep.dev';

  const saveNodeDataDebounced = useCallback(
    debounce((key: string, value: string | Record<string, any>) => {
      updateSelectedNodeData(key, value);
    }, 300),
    []
  );

  const handleChange = (key: string, value: string | Record<string, any>) => {
    updateV2Properties({ [key]: value });
    if (key === 'interval') {
      updateSelectedNodeData('properties', { interval: value });
    }
  };

  const updateAlertFilter = (filter: string, value: string) => {
    const currentProperties = properties.alert || {};
    if (!currentProperties.filters) {
      currentProperties.filters = {};
    }
    const newProperties = { ...currentProperties, [filter]: value };
    updateV2Properties({ alert: newProperties });
    saveNodeDataDebounced('properties', newProperties);
  };

  const updateAlertCel = (value: string) => {
    const currentProperties = properties.alert || {};
    updateV2Properties({ alert: { ...currentProperties, cel: value } });
    saveNodeDataDebounced('properties', { ...currentProperties, cel: value });
  };

  const addFilter = () => {
    const filterName = prompt('Enter filter name');
    if (filterName) {
      updateAlertFilter(filterName, '');
    }
  };

  const deleteFilter = (filter: string) => {
    const currentProperties = { ...properties.alert };
    delete currentProperties.filters[filter];
    updateV2Properties({ alert: currentProperties });
  };

  const triggerKeys = ['alert', 'incident', 'interval', 'manual'];

  if (!selectedNode || !triggerKeys.includes(selectedNode)) {
    return null;
  }

  const selectedTriggerKey = triggerKeys.find((key) => key === selectedNode) as string;
  const error = validationErrors?.[selectedTriggerKey];

  const renderTriggerContent = () => {
    const { data: alertFields } = useFacetPotentialFields('alerts');

    switch (selectedTriggerKey) {
      case 'manual':
        return (
          // TODO: explain what is manual trigger
          <div>
            <EuiFormRow label="Manual trigger enabled">
              <EuiSwitch
                label="Manual trigger"
                checked={true}
                onChange={(e) =>
                  handleChange(selectedTriggerKey, e.target.checked ? 'true' : 'false')
                }
                disabled={true}
              />
            </EuiFormRow>
          </div>
        );

      case 'alert':
        return (
          <>
            {error && (
              <EuiText color="danger" size="s">
                {Array.isArray(error) ? error[0] : error}
              </EuiText>
            )}
            <div>
              <div className="flex items-center">
                <EuiTitle size="xs">
                  <h4>CEL Expression</h4>
                </EuiTitle>
                <EuiButtonIcon
                  iconType="questionInCircle"
                  color="subdued"
                  aria-label="Read more about CEL expressions"
                  onClick={() => {
                    window.open(`${docsUrl}/overview/cel`, '_blank');
                  }}
                />
              </div>
              <EuiSpacer size="s" />
              <div className="flex items-center mt-1 relative">
                <CelInput
                  staticPositionForSuggestions={true}
                  value={properties.alert?.cel}
                  placeholder="CEL expression based trigger"
                  onValueChange={(value: string) => updateAlertCel(value)}
                  onClearValue={() => updateAlertCel('')}
                  fieldsForSuggestions={alertFields}
                />
              </div>
              <EuiSpacer size="m" />
              <div className="mt-4">
                <AlertsCountBadge
                  vertical
                  presetCEL={properties.alert?.cel}
                  isDebouncing={false}
                  description="The number of alerts from the past that would have triggered this workflow"
                />
              </div>
            </div>
            <div>
              <EuiSpacer size="m" />
              <EuiTitle size="xs">
                <h4>Alert filter (deprecated)</h4>
              </EuiTitle>
              <EuiSpacer size="xs" />
              <EuiText size="s" color="subdued">
                Please convert your alert filters to CEL expressions to ensure stability and
                performance.
              </EuiText>
              <EuiSpacer size="s" />
              <div className="w-1/2">
                <EuiButton onClick={addFilter} size="s" fill={false} color="text" iconType="filter">
                  Add Filter
                </EuiButton>
              </div>
              {properties.alert?.filters &&
                Object.keys(properties.alert.filters ?? {}).map((filter) => (
                  <div key={filter}>
                    <EuiSpacer size="s" />
                    <EuiTitle size="xxs">
                      <h5>{filter}</h5>
                    </EuiTitle>
                    <div className="flex items-center mt-1">
                      <TextInput
                        key={filter}
                        placeholder={`Set alert ${filter}`}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateAlertFilter(filter, e.target.value)
                        }
                        value={(properties.alert.filters as any)[filter] || ('' as string)}
                      />
                      <EuiButtonIcon
                        iconType="trash"
                        color="danger"
                        aria-label={`Remove ${filter} filter`}
                        onClick={() => deleteFilter(filter)}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </>
        );

      case 'incident':
        return (
          <>
            <EuiTitle size="xs">
              <h4>Incident events</h4>
            </EuiTitle>
            <EuiSpacer size="s" />
            {['created', 'updated', 'deleted'].map((event) => (
              <EuiFormRow key={`incident-${event}`}>
                <EuiSwitch
                  label={capitalize(event)}
                  checked={properties.incident?.events?.indexOf(event) > -1}
                  onChange={() => {
                    let events = properties.incident?.events || [];
                    if (events.indexOf(event) > -1) {
                      events = (events as string[]).filter((e) => e !== event);
                      updateV2Properties({
                        [selectedTriggerKey]: { events },
                      });
                    } else {
                      events.push(event);
                      updateV2Properties({
                        [selectedTriggerKey]: { events },
                      });
                    }
                  }}
                />
              </EuiFormRow>
            ))}
          </>
        );

      case 'interval': {
        const value = properties[selectedTriggerKey];
        return (
          <>
            <EuiTitle size="xs">
              <h4>Interval (in seconds)</h4>
            </EuiTitle>
            <EuiSpacer size="s" />
            <TextInput
              placeholder={`Set the ${selectedTriggerKey}`}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange(selectedTriggerKey, e.target.value)
              }
              value={value || ('' as string)}
              error={!!error}
              errorMessage={error?.[0]}
            />
            {value && (
              <>
                <EuiSpacer size="xs" />
                <EuiText size="s" color="subdued">
                  Workflow will run every {getHumanReadableInterval(value)}
                </EuiText>
              </>
            )}
          </>
        );
      }

      default:
        return <EuiText size="s">Unknown trigger type</EuiText>;
    }
  };

  return (
    <EditorLayout>
      <EuiTitle size="xs">
        <h3>{capitalize(selectedTriggerKey)} Trigger</h3>
      </EuiTitle>
      <EuiSpacer size="s" />
      {renderTriggerContent()}
    </EditorLayout>
  );
}
