import { IUnsecuredActionsClient } from '@kbn/actions-plugin/server';
import { providers } from './mock';

export class ProviderExecutor {
  constructor(
    private providerCredentials: Record<string, any>,
    private actionsClient: IUnsecuredActionsClient
  ) {}

  public async execute(
    providerType: string,
    providerName: string,
    inputs: Record<string, any>
  ): Promise<any> {
    if (!providerType) {
      throw new Error('Provider type is required');
    }

    if (providerType.endsWith('connector')) {
      await this.runConnector(providerName, inputs);
      return;
    }

    const provider = providers[providerName];

    if (!provider) {
      throw new Error(`Provider "${providerName}" not found`);
    }

    provider.action(inputs);
  }

  private async runConnector(
    connectorName: string,
    connectorParams: Record<string, any>
  ): Promise<void> {
    const connectorCredentials = this.providerCredentials['connector.' + connectorName];

    if (!connectorCredentials) {
      throw new Error(`Provider credentials for "${connectorName}" not found`);
    }

    const connectorId = connectorCredentials.id;

    await this.actionsClient.execute({
      id: connectorId,
      params: connectorParams,
      spaceId: 'default',
      requesterId: 'background_task', // This is a custom ID for testing purposes
    });
  }
}
