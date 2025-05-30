/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  RequestHandlerContext,
  KibanaRequest,
  KibanaResponseFactory,
  IKibanaResponse,
  IRouter,
} from '@kbn/core/server';

export function initPlugin(router: IRouter, path: string) {
  router.post(
    {
      path: `${path}/users/test@/sendMail`,
      security: {
        authz: {
          enabled: false,
          reason: 'This route is opted out from authorization',
        },
      },
      options: {
        authRequired: false,
      },
      validate: {},
    },
    async function (
      context: RequestHandlerContext,
      req: KibanaRequest<any, any, any, any>,
      res: KibanaResponseFactory
    ): Promise<IKibanaResponse<any>> {
      return jsonResponse(res, 200, {
        envelope: {
          from: 'bob@example.com',
          to: ['kibana-action-test@elastic.co'],
        },
        message: {
          from: { address: 'bob@example.com', name: '' },
          to: [
            {
              address: 'kibana-action-test@elastic.co',
              name: '',
            },
          ],
          cc: null,
          bcc: null,
          subject: 'email-subject',
          html: `<p>email-message</p>\n<hr>\n<p>This message was sent by Elastic. <a href=\"https://localhost:5601\">Go to Elastic</a>.</p>\n`,
          text: 'email-message\n\n--\n\nThis message was sent by Elastic. [Go to Elastic](https://localhost:5601).',
          headers: {},
        },
      });
    }
  );

  router.post(
    {
      path: `${path}/1234567/oauth2/v2.0/token`,
      security: {
        authz: {
          enabled: false,
          reason: 'This route is opted out from authorization',
        },
      },
      options: {
        authRequired: false,
      },
      validate: {},
    },
    async function (
      context: RequestHandlerContext,
      req: KibanaRequest<any, any, any, any>,
      res: KibanaResponseFactory
    ): Promise<IKibanaResponse<any>> {
      return jsonResponse(res, 200, {
        access_token: 'asdadasd',
        expires_in: 3660,
        token_type: 'Bearer',
      });
    }
  );
}

function jsonResponse(
  res: KibanaResponseFactory,
  code: number,
  object: Record<string, unknown> = {}
) {
  return res.custom<Record<string, unknown>>({ body: object, statusCode: code });
}
