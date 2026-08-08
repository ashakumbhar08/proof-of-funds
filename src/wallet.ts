/**
 * wallet.ts — Wallet helpers for ProofOfFunds dApp
 *
 * Handles wallet initialisation from seed phrase (Node/CLI context).
 * For browser context the DApp Connector wallet is used instead (see frontend/).
 *
 * SECURITY NOTE: Never log or persist seed phrases or private keys.
 */

import type { NetworkConfig } from './network.js';

export interface WalletInfo {
  address: string;
  networkId: string;
}

/**
 * Loads wallet state from the environment / local state file.
 * In the CLI this reads MIDNIGHT_SEED from the environment.
 *
 * ASSUMPTION: The Midnight JS SDK wallet API is used.  Replace the
 * placeholder implementation below with the real SDK call when deploying.
 */
export async function loadWallet(config: NetworkConfig): Promise<WalletInfo> {
  const seed = process.env.MIDNIGHT_SEED;
  if (!seed) {
    throw new Error(
      'MIDNIGHT_SEED env var not set.\n' +
      'Generate a wallet seed and export it before running deploy:\n' +
      '  export MIDNIGHT_SEED="your 24-word mnemonic here"'
    );
  }

  // Placeholder — swap in the real @midnight-ntwrk/midnight-js-wallet call.
  console.log(`[wallet] Connecting to network: ${config.name}`);
  console.log(`[wallet] Node: ${config.nodeUrl}`);

  // In a real deployment this would:
  //   const provider = await NodeZkConfigProvider.create(config.proofServerUrl);
  //   const wallet   = await MidnightWallet.restore(seed, provider, config.nodeUrl);
  //   return { address: wallet.address, networkId: config.name };

  return {
    address: '(wallet address loaded from seed)',
    networkId: config.name,
  };
}
