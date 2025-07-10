import type { CoreSetup } from '@kbn/core/server';
import fetch from 'node-fetch';
import { WorkflowsExamplePluginStartDeps } from '../types';
import { WorkflowExecutionEngineModel } from '@kbn/workflows';
import { schema } from '@kbn/config-schema';
async function fetchFromLocalhost(endpoint: string) {
  try {
    const response = await fetch(`http://localhost:8080/workflows`, {
      headers: {
        'kbn-xsrf': 'true',
        'x-api-key': '1234567',
      },
    });
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch from localhost:8080: ${error.message}`);
  }
}

export function defineRoutes(
  core: CoreSetup<WorkflowsExamplePluginStartDeps, WorkflowsExamplePluginStartDeps>
) {
  async function getWorkflowManager() {
    const services = await core.getStartServices();
    return services[1].workflowsManagement;
  }

  const router = core.http.createRouter();

  router.get(
    {
      path: '/api/workflows/example',
      security: {
        authz: {
          requiredPrivileges: ['all'],
        },
      },
      validate: false,
    },
    async (context, request, response) => {
      try {
        const data = await fetchFromLocalhost('/your-endpoint');
        return response.ok({
          body: {
            time: new Date().toISOString(),
            data,
          },
        });
      } catch (error) {
        return response.customError({
          statusCode: 500,
          body: {
            message: `Error fetching data: ${error.message}`,
          },
        });
      }
    }
  );

  router.post(
    {
      path: '/api/workflows/run',
      security: {
        authz: {
          requiredPrivileges: ['all'],
        },
      },
      validate: {
        query: schema.object({
          useDefaultCapabilities: schema.boolean({ defaultValue: false }),
        }),
        body: schema.any(),
      },
    },
    async (context, request, response) => {
      try {
        const { workflow, inputs } = request.body;
        const workflowManager = await getWorkflowManager();

        await workflowManager.runWorkflow(workflow, inputs);

        return response.ok();
      } catch (error) {
        return response.customError({
          statusCode: 500,
          body: {
            message: `Error occured: ${error.message}`,
          },
        });
      }
    }
  );
}
