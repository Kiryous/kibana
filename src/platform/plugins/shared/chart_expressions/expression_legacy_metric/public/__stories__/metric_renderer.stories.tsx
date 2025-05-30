/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { from } from 'rxjs';
import { ExpressionValueVisDimension } from '@kbn/visualizations-plugin/common';
import { Datatable, DatatableColumn, TextAlignment } from '@kbn/expressions-plugin/common';
import { Render } from '@kbn/presentation-util-plugin/public/__stories__';
import { ColorMode, CustomPaletteState } from '@kbn/charts-plugin/common';
import { getFormatService } from '../__mocks__/format_service';
import { getPaletteService } from '../__mocks__/palette_service';
import { ExpressionMetricVisRendererDependencies } from '../expression_renderers/metric_vis_renderer';
import { getMetricVisRenderer } from '../expression_renderers';
import { MetricStyle, MetricVisRenderConfig, visType } from '../../common/types';
import { LabelPosition } from '../../common/constants';
import { setFormatService } from '../services/format_service';
import { setPaletteService } from '../services/palette_service';

const palette: CustomPaletteState = {
  colors: ['rgb(219 231 38)', 'rgb(112 38 231)', 'rgb(38 124 231)'],
  stops: [0, 50, 150],
  gradient: false,
  rangeMin: 0,
  rangeMax: 150,
  range: 'number',
};

const style: MetricStyle = {
  spec: { fontSize: '12px' },

  /* stylelint-disable */
  type: 'style',
  css: '',
  bgColor: false,
  labelColor: false,
  /* stylelint-enable */
};

const config: MetricVisRenderConfig = {
  canNavigateToLens: false,
  visType,
  visData: {
    type: 'datatable',
    rows: [{ 'col-0-1': 85, 'col-0-2': 30 }],
    columns: [
      {
        id: 'col-0-1',
        name: 'Max products count',
        meta: { type: 'number', params: {} },
      },
      {
        id: 'col-0-2',
        name: 'Median products count',
        meta: { type: 'number', params: {} },
      },
    ],
  },
  visConfig: {
    metric: {
      metricColorMode: ColorMode.None,
      labels: {
        show: true,
        style: { spec: {}, type: 'style', css: '' },
        position: LabelPosition.BOTTOM,
      },
      percentageMode: false,
      colorFullBackground: false,
      style,
    },
    dimensions: {
      metrics: [
        {
          accessor: 0,
          format: {
            id: 'number',
            params: {},
          },
          type: 'vis_dimension',
        },
        {
          accessor: {
            id: 'col-0-2',
            name: 'Median products count',
            meta: { type: 'number' },
          },
          format: {
            id: 'number',
            params: {},
          },
          type: 'vis_dimension',
        },
      ],
    },
  },
};

const dayColumn: DatatableColumn = {
  id: 'col-0-3',
  name: 'Day of the week',
  meta: { type: 'string', params: {} },
};

const dayAccessor: ExpressionValueVisDimension = {
  accessor: {
    id: 'col-0-3',
    name: 'Day of the week',
    meta: { type: 'string' },
  },
  format: {
    id: 'string',
    params: {},
  },
  type: 'vis_dimension',
};

const dataWithBuckets = [
  { 'col-0-1': 85, 'col-0-2': 30, 'col-0-3': 'Monday' },
  { 'col-0-1': 55, 'col-0-2': 32, 'col-0-3': 'Tuesday' },
  { 'col-0-1': 56, 'col-0-2': 52, 'col-0-3': 'Wednesday' },
];

const containerSize = {
  width: '700px',
  height: '700px',
};

setFormatService(getFormatService());
setPaletteService(getPaletteService());

const getStartDeps = (() => ({
  core: {
    theme: {
      theme$: from([{ darkMode: false }]),
    },
  },
})) as unknown as ExpressionMetricVisRendererDependencies['getStartDeps'];

const metricVisRenderer = () =>
  getMetricVisRenderer({
    getStartDeps,
  });

export default {
  title: 'renderers/visMetric',
};

export const Default = () => {
  return <Render renderer={metricVisRenderer} config={config} {...containerSize} />;
};

export const WithoutLabels = {
  render: () => {
    return (
      <Render
        renderer={metricVisRenderer}
        config={{
          ...config,
          visConfig: {
            ...config.visConfig,
            metric: {
              ...config.visConfig.metric,
              labels: {
                show: false,
                style: { spec: {}, type: 'style', css: '' },
                position: LabelPosition.BOTTOM,
              },
            },
          },
        }}
        {...containerSize}
      />
    );
  },

  name: 'Without labels',
};

export const WithCustomFontSize = {
  render: () => {
    return (
      <Render
        renderer={metricVisRenderer}
        config={{
          ...config,
          visConfig: {
            ...config.visConfig,
            metric: {
              ...config.visConfig.metric,
              style: {
                ...config.visConfig.metric.style,
                spec: { ...config.visConfig.metric.style.spec, fontSize: '120px' },
              },
            },
          },
        }}
        {...containerSize}
      />
    );
  },

  name: 'With custom font size',
};

export const WithLabelPositionIsTopAndCustomFontForLabel = {
  render: () => {
    return (
      <Render
        renderer={metricVisRenderer}
        config={{
          ...config,
          visConfig: {
            ...config.visConfig,
            metric: {
              ...config.visConfig.metric,
              style: {
                ...config.visConfig.metric.style,
                spec: { ...config.visConfig.metric.style.spec, fontSize: '80px' },
              },
              labels: {
                show: false,
                style: {
                  spec: { fontSize: '60px', textAlign: TextAlignment.LEFT },
                  type: 'style',
                  css: '',
                },
                position: LabelPosition.TOP,
              },
            },
          },
        }}
        {...containerSize}
      />
    );
  },

  name: 'With label position is top and custom font for label',
};

export const WithColorRangesBackgroundColorMode = {
  render: () => {
    return (
      <Render
        renderer={metricVisRenderer}
        config={{
          ...config,
          visConfig: {
            ...config.visConfig,
            metric: {
              ...config.visConfig.metric,
              palette,
              metricColorMode: ColorMode.Background,
              style: {
                ...config.visConfig.metric.style,
                bgColor: true,
              },
            },
          },
        }}
        {...containerSize}
      />
    );
  },

  name: 'With color ranges, background color mode',
};

export const WithColorRangesLabelsColorMode = {
  render: () => {
    return (
      <Render
        renderer={metricVisRenderer}
        config={{
          ...config,
          visConfig: {
            ...config.visConfig,
            metric: {
              ...config.visConfig.metric,
              palette,
              metricColorMode: ColorMode.Labels,
              style: {
                ...config.visConfig.metric.style,
                labelColor: true,
              },
            },
          },
        }}
        {...containerSize}
      />
    );
  },

  name: 'With color ranges, labels color mode',
};

export const WithColorRangesLabelsColorModeReverseMode = {
  render: () => {
    return (
      <Render
        renderer={metricVisRenderer}
        config={{
          ...config,
          visConfig: {
            ...config.visConfig,
            metric: {
              ...config.visConfig.metric,
              palette,
              metricColorMode: ColorMode.Labels,
              style: {
                ...config.visConfig.metric.style,
                labelColor: true,
              },
            },
          },
        }}
        {...containerSize}
      />
    );
  },

  name: 'With color ranges, labels color mode, reverse mode',
};

export const WithBucket = {
  render: () => {
    return (
      <Render
        renderer={metricVisRenderer}
        config={{
          ...config,
          visData: {
            ...(config.visData as Datatable),
            columns: [...(config.visData as Datatable).columns, dayColumn],
            rows: dataWithBuckets,
          },
          visConfig: {
            ...config.visConfig,
            dimensions: { ...config.visConfig.dimensions, bucket: dayAccessor },
          },
        }}
        {...containerSize}
      />
    );
  },

  name: 'With bucket',
};

export const WithEmptyResults = {
  render: () => {
    return (
      <Render
        renderer={metricVisRenderer}
        config={{ ...config, visData: { ...config.visData, rows: [] } as Datatable }}
        {...containerSize}
      />
    );
  },

  name: 'With empty results',
};

export const WithColorizingFullContainer = {
  render: () => {
    return (
      <Render
        renderer={metricVisRenderer}
        config={{
          ...config,
          visData: {
            type: 'datatable',
            rows: [{ 'col-0-1': 85 }],
            columns: [
              {
                id: 'col-0-1',
                name: 'Max products count',
                meta: { type: 'number', params: {} },
              },
            ],
          },
          visConfig: {
            ...config.visConfig,
            metric: {
              ...config.visConfig.metric,
              palette,
              metricColorMode: ColorMode.Background,
              style: {
                ...config.visConfig.metric.style,
                bgColor: true,
              },
              colorFullBackground: true,
            },
            dimensions: {
              metrics: [
                {
                  accessor: 0,
                  format: {
                    id: 'number',
                    params: {},
                  },
                  type: 'vis_dimension',
                },
              ],
            },
          },
        }}
        {...containerSize}
      />
    );
  },

  name: 'With colorizing full container',
};
