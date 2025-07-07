import React from 'react';
import { EuiLoadingSpinner, EuiText, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

interface KeepLoaderProps {
  loadingText?: string;
  size?: 's' | 'm' | 'l' | 'xl' | 'xxl';
}

export function KeepLoader({ loadingText = 'Loading...', size = 'l' }: KeepLoaderProps) {
  return (
    <EuiFlexGroup
      justifyContent="center"
      alignItems="center"
      direction="column"
      gutterSize="m"
      style={{ minHeight: '200px' }}
    >
      <EuiFlexItem grow={false}>
        <EuiLoadingSpinner size={size} />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiText size="s" color="subdued" textAlign="center">
          {loadingText}
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
