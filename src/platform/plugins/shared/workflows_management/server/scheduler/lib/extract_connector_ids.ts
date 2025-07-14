import { WorkflowExecutionEngineModel } from '@kbn/workflows';
import { PluginStartContract as ActionsPluginStartContract } from '@kbn/actions-plugin/server/plugin';

export const extractConnectorIds = async (
  workflow: WorkflowExecutionEngineModel,
  actions: ActionsPluginStartContract
): Promise<Record<string, Record<string, any>>> => {
  const connectorNames = workflow.steps
    .filter((step) => step.connectorType.endsWith('-connector'))
    .map((step) => step.connectorName);
  const distinctConnectorNames = Array.from(new Set(connectorNames));
  const allConnectors = await actions.getUnsecuredActionsClient().getAll('default');
  const connectorNameIdMap = new Map<string, string>(
    allConnectors.map((connector) => [connector.name, connector.id])
  );

  return distinctConnectorNames.reduce((acc, name) => {
    const connectorId = connectorNameIdMap.get(name);
    if (connectorId) {
      acc['connector.' + name] = {
        id: connectorId,
      };
    }
    return acc;
  }, {} as Record<string, Record<string, any>>);
};
