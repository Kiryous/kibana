import React from 'react';
import { EuiIcon } from '@elastic/eui';
import { NodeData } from '../model/types';

// TODO: Replace with proper Kibana component import path
// import { DynamicImageProviderIcon } from '@/components/ui/DynamicProviderIcon';
const DynamicImageProviderIcon = ({ src, height, width, providerType, ...props }: any) => {
  // TODO: Implement real Kibana dynamic image provider icon
  return <EuiIcon type="image" size="l" {...props} />;
};

export function NodeTriggerIcon({ nodeData }: { nodeData: NodeData }) {
  if (nodeData.componentType !== 'trigger') {
    return null;
  }
  switch (nodeData.type) {
    case 'manual':
      return <EuiIcon type="click" size="l" />;
    case 'interval':
      return <EuiIcon type="clock" size="l" />;
    case 'alert': {
      const alertSource = nodeData.properties?.filters?.source;
      if (alertSource) {
        return (
          <DynamicImageProviderIcon
            key={alertSource}
            providerType={alertSource}
            src={`/icons/${alertSource}-icon.png`}
            height="32"
            width="32"
          />
        );
      }
      return <DynamicImageProviderIcon src="/keep.png" height="32" width="32" />;
    }
    case 'incident':
      return <DynamicImageProviderIcon src="/keep.png" height="32" width="32" />;
    default:
      return <EuiIcon type="questionInCircle" size="l" />;
  }
}
