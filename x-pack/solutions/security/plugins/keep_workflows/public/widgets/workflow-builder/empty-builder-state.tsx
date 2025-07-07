import React from 'react';
import { EuiEmptyPrompt, EuiIcon } from '@elastic/eui';

export function EmptyBuilderState() {
  return (
    <EuiEmptyPrompt
      icon={<EuiIcon type="documents" size="xl" />}
      title={<h2>No workflow content</h2>}
      body={<p>Upload a workflow file or select an existing workflow to start building.</p>}
    />
  );
}
