/**
 * network.ts — Network configuration for ProofOfFunds dApp
 *
 * Supports: local devnet | testnet | preview
 */

export type NetworkName = 'local' | 'testnet' | 'preview';

export interface NetworkConfig {
  name: NetworkName;
  nodeUrl: string;
  indexerUrl: string;
  proofServerUrl: string;
}

const NETWORKS: Record<NetworkName, NetworkConfig> = {
  local: {
    name: 'local',
    nodeUrl: 'ws://localhost:9944',
    indexerUrl: 'http://localhost:8088',
    proofServerUrl: 'http://localhost:6300',
  },
  testnet: {
    name: 'testnet',
    nodeUrl: 'wss://rpc.testnet.midnight.network',
    indexerUrl: 'https://indexer.testnet.midnight.network',
    proofServerUrl: 'https://proof-server.testnet.midnight.network',
  },
  preview: {
    name: 'preview',
    nodeUrl: 'wss://rpc.preview.midnight.network',
    indexerUrl: 'https://indexer.preview.midnight.network',
    proofServerUrl: 'https://proof-server.preview.midnight.network',
  },
};

/**
 * Returns the network config for the given network name.
 * Reads MIDNIGHT_NETWORK env var if no argument is provided.
 */
export function getNetworkConfig(network?: NetworkName): NetworkConfig {
  const name = network ?? (process.env.MIDNIGHT_NETWORK as NetworkName) ?? 'local';
  const config = NETWORKS[name];
  if (!config) {
    throw new Error(`Unknown network: ${name}. Valid options: ${Object.keys(NETWORKS).join(', ')}`);
  }
  return config;
}
