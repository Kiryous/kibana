/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { i18n } from '@kbn/i18n';
import { EuiEmptyPrompt } from '@elastic/eui';
import React from 'react';

export const AccessDenied = (): JSX.Element => {
  return (
    <EuiEmptyPrompt
      iconType="securityApp"
      title={
        <h2>
          {i18n.translate('platform.plugins.shared.workflows_management.ui.accessDenied', {
            defaultMessage: 'Access Denied',
          })}
        </h2>
      }
      body={
        <p>
          {i18n.translate('platform.plugins.shared.workflows_management.ui.noPermissions', {
            defaultMessage: 'You don’t have permission to view this page.',
          })}
        </p>
      }
    />
  );
};
