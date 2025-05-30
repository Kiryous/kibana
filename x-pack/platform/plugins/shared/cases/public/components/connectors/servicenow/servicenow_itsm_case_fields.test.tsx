/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { waitFor, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { connector, choices } from '../mock';
import { useGetChoices } from './use_get_choices';
import Fields from './servicenow_itsm_case_fields';

import { MockFormWrapperComponent } from '../test_utils';
import { renderWithTestingProviders } from '../../../common/mock';

jest.mock('../../../common/lib/kibana');
jest.mock('./use_get_choices');
const useGetChoicesMock = useGetChoices as jest.Mock;

useGetChoicesMock.mockReturnValue({
  isLoading: false,
  isFetching: false,
  data: { data: choices },
});

describe('ServiceNowITSM Fields', () => {
  let user: UserEvent;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const fields = {
    severity: '1',
    urgency: '2',
    impact: '3',
    category: 'software',
    subcategory: 'os',
    additionalFields: '',
  };

  beforeEach(() => {
    // Workaround for timeout via https://github.com/testing-library/user-event/issues/833#issuecomment-1171452841
    user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('all params fields are rendered', async () => {
    renderWithTestingProviders(
      <MockFormWrapperComponent fields={fields}>
        <Fields connector={connector} />
      </MockFormWrapperComponent>
    );

    expect(screen.getByTestId('severitySelect')).toBeInTheDocument();
    expect(screen.getByTestId('urgencySelect')).toBeInTheDocument();
    expect(screen.getByTestId('impactSelect')).toBeInTheDocument();
    expect(screen.getByTestId('categorySelect')).toBeInTheDocument();
    expect(screen.getByTestId('subcategorySelect')).toBeInTheDocument();
    expect(screen.getByTestId('additionalFieldsEditor')).toBeInTheDocument();
  });

  it('transforms the categories to options correctly', async () => {
    renderWithTestingProviders(
      <MockFormWrapperComponent fields={fields}>
        <Fields connector={connector} />
      </MockFormWrapperComponent>
    );

    const categorySelect = screen.getByTestId('categorySelect');

    expect(within(categorySelect).getByRole('option', { name: 'Privilege Escalation' }));
    expect(within(categorySelect).getByRole('option', { name: 'Criminal activity/investigation' }));
    expect(within(categorySelect).getByRole('option', { name: 'Denial of Service' }));
    expect(within(categorySelect).getByRole('option', { name: 'Software' }));
    expect(within(categorySelect).getByRole('option', { name: 'Failed Login' }));
  });

  it('transforms the subcategories to options correctly', async () => {
    renderWithTestingProviders(
      <MockFormWrapperComponent fields={fields}>
        <Fields connector={connector} />
      </MockFormWrapperComponent>
    );

    expect(await screen.findByRole('option', { name: 'Operation System' }));
  });

  it('transforms the options correctly', async () => {
    renderWithTestingProviders(
      <MockFormWrapperComponent fields={fields}>
        <Fields connector={connector} />
      </MockFormWrapperComponent>
    );

    expect(await screen.findByTestId('connector-fields-sn-itsm')).toBeInTheDocument();

    const testers = ['severity', 'urgency', 'impact'];
    testers.forEach((subj) => {
      const select = within(screen.getByTestId(`${subj}Select`));

      expect(select.getByRole('option', { name: '1 - Critical' }));
      expect(select.getByRole('option', { name: '2 - High' }));
      expect(select.getByRole('option', { name: '3 - Moderate' }));
      expect(select.getByRole('option', { name: '4 - Low' }));
    });
  });

  it('shows the deprecated callout if the connector is deprecated', async () => {
    const tableApiConnector = { ...connector, isDeprecated: true };

    renderWithTestingProviders(
      <MockFormWrapperComponent fields={fields}>
        <Fields connector={tableApiConnector} />
      </MockFormWrapperComponent>
    );

    expect(await screen.findByTestId('deprecated-connector-warning-callout')).toBeInTheDocument();
  });

  it('does not show the deprecated callout when the connector is not deprecated', async () => {
    renderWithTestingProviders(
      <MockFormWrapperComponent fields={fields}>
        <Fields connector={connector} />
      </MockFormWrapperComponent>
    );
    expect(screen.queryByTestId('deprecated-connector-warning-callout')).not.toBeInTheDocument();
  });

  it('does not show the deprecated callout when the connector is preconfigured and not deprecated', async () => {
    renderWithTestingProviders(
      <MockFormWrapperComponent fields={fields}>
        <Fields connector={{ ...connector, isPreconfigured: true }} />
      </MockFormWrapperComponent>
    );

    expect(screen.queryByTestId('deprecated-connector-warning-callout')).not.toBeInTheDocument();
  });

  it('shows the deprecated callout when the connector is preconfigured and deprecated', async () => {
    renderWithTestingProviders(
      <MockFormWrapperComponent fields={fields}>
        <Fields connector={{ ...connector, isPreconfigured: true, isDeprecated: true }} />
      </MockFormWrapperComponent>
    );

    expect(await screen.findByTestId('deprecated-connector-warning-callout')).toBeInTheDocument();
  });

  it('shows the subcategory if the selected category does not have subcategories', async () => {
    // Failed Login doesn't have defined subcategories
    const customFields = {
      ...fields,
      category: 'Failed Login',
      subcategory: '',
    };

    renderWithTestingProviders(
      <MockFormWrapperComponent fields={customFields}>
        <Fields connector={connector} />
      </MockFormWrapperComponent>
    );

    expect(await screen.findByTestId('subcategorySelect')).toBeInTheDocument();
    expect(await screen.findByTestId('subcategorySelect')).not.toHaveValue();
  });

  describe('changing selectables', () => {
    const testers = ['severity', 'urgency', 'impact'];
    testers.forEach((subj) =>
      it(`${subj.toUpperCase()}`, async () => {
        renderWithTestingProviders(
          <MockFormWrapperComponent fields={fields}>
            <Fields connector={connector} />
          </MockFormWrapperComponent>
        );

        const select = await screen.findByTestId(`${subj}Select`);
        await user.selectOptions(select, '4 - Low');

        expect(select).toHaveValue('4');
      })
    );
  });

  it('should submit a service now itsm connector', async () => {
    renderWithTestingProviders(
      <MockFormWrapperComponent fields={fields}>
        <Fields connector={connector} />
      </MockFormWrapperComponent>
    );

    const severitySelect = await screen.findByTestId('severitySelect');
    const urgencySelect = await screen.findByTestId('urgencySelect');
    const impactSelect = await screen.findByTestId('impactSelect');

    const selectables: Array<[HTMLElement, 'severity' | 'urgency' | 'impact']> = [
      [severitySelect, 'severity'],
      [urgencySelect, 'urgency'],
      [impactSelect, 'impact'],
    ];

    for (const [element] of selectables) {
      await user.selectOptions(element, ['2']);
    }
    const categorySelect = await screen.findByTestId('categorySelect');

    expect(await within(categorySelect).findByRole('option', { name: 'Software' }));

    await user.selectOptions(categorySelect, ['software']);

    const subcategorySelect = await screen.findByTestId('subcategorySelect');

    expect(await within(subcategorySelect).findByRole('option', { name: 'Operation System' }));

    await user.selectOptions(subcategorySelect, ['os']);

    expect(severitySelect).toHaveValue('2');
    expect(urgencySelect).toHaveValue('2');
    expect(impactSelect).toHaveValue('2');
    expect(categorySelect).toHaveValue('software');
    expect(subcategorySelect).toHaveValue('os');
  });

  it('resets subcategory when changing category', async () => {
    renderWithTestingProviders(
      <MockFormWrapperComponent fields={fields}>
        <Fields connector={connector} />
      </MockFormWrapperComponent>
    );

    const categorySelect = await screen.findByTestId('categorySelect');

    expect(await within(categorySelect).findByRole('option', { name: 'Software' }));

    await user.selectOptions(categorySelect, ['software']);

    const subcategorySelect = await screen.findByTestId('subcategorySelect');

    expect(await within(subcategorySelect).findByRole('option', { name: 'Operation System' }));

    expect(subcategorySelect).toHaveValue('os');

    await user.selectOptions(categorySelect, ['Privilege Escalation']);

    await waitFor(() => {
      expect(subcategorySelect).not.toHaveValue();
    });
  });
});
