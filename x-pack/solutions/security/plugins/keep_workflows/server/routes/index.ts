import { schema } from '@kbn/config-schema';
import type { IRouter } from '@kbn/core/server';

const KEEP_UI_BASE_URL = 'http://localhost:3000';
const KEEP_API_BASE_URL = 'http://localhost:8080';

export function defineRoutes(router: IRouter) {
  router.get(
    {
      path: '/api/workflow-json-schema',
      validate: false,
      security: {
        authz: {
          requiredPrivileges: ['all'],
        },
      },
    },
    async (context, request, response) => {
      try {
        const externalData = await fetch(`${KEEP_UI_BASE_URL}/api/workflow-json-schema`).then(
          (res) => res.json()
        );
        return response.ok({
          body: externalData.data,
        });
      } catch (error) {
        return response.customError({
          statusCode: 500,
          body: {
            message: `Internal server error: ${error}`,
          },
        });
      }
    }
  );
  router.post(
    {
      path: '/api/workflows',
      validate: false,
      security: {
        authz: {
          requiredPrivileges: ['all'],
        },
      },
    },
    async (context, request, response) => {
      try {
        const externalData = await fetch(`${KEEP_API_BASE_URL}/workflows/query?is_v2=true`, {
          method: 'POST',
          headers: {
            'x-api-key': 'keep-api-key',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cel: 'disabled == false',
            sort_by: 'created_at',
            sort_dir: 'desc',
          }),
        }).then((res) => res.json());
        return response.ok({
          body: externalData,
        });
      } catch (error) {
        console.error(error);
        return response.customError({
          statusCode: 500,
          body: {
            message: `Internal server error: ${error}`,
          },
        });
      }
    }
  );
  router.get(
    {
      path: '/api/workflows/{id}',
      security: {
        authz: {
          requiredPrivileges: ['all'],
        },
      },
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const externalData = await fetch(`${KEEP_API_BASE_URL}/workflows/${request.params.id}`, {
          method: 'GET',
          headers: {
            'x-api-key': 'keep-api-key',
            'Content-Type': 'application/json',
          },
        }).then((res) => res.json());
        return response.ok({
          body: externalData,
        });
      } catch (error) {
        console.error(error);
        return response.customError({
          statusCode: 500,
          body: {
            message: `Internal server error: ${error}`,
          },
        });
      }
    }
  );
  router.get(
    {
      path: '/api/providers',
      validate: false,
      security: {
        authz: {
          requiredPrivileges: ['all'],
        },
      },
    },
    async (context, request, response) => {
      try {
        const externalData = await fetch(`${KEEP_API_BASE_URL}/providers`, {
          method: 'GET',
          headers: {
            'x-api-key': 'keep-api-key',
            'Content-Type': 'application/json',
          },
        }).then((res) => res.json());
        return response.ok({
          body: externalData,
        });
      } catch (error) {
        console.error(error);
        return response.customError({
          statusCode: 500,
          body: {
            message: `Internal server error: ${error}`,
          },
        });
      }
    }
  );
}
