
export interface ConnectorTextBlock { type: 'text'; connector_text: string; }
export const isConnectorTextBlock = (block: any): block is ConnectorTextBlock => block?.type === 'text' && 'connector_text' in block;
