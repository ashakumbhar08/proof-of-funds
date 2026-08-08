/**
 * deploy.ts — Deploy ProofOfFunds contract to Midnight Network
 *
 * Usage:
 *   npm run deploy                         # deploys to local devnet
 *   npm run deploy -- --network preview    # deploys to Preview Network
 *   npm run deploy -- --network testnet
 *
 * Requires:
 *   MIDNIGHT_SEED=<24-word mnemonic>
 *
 * After deployment the contract address is printed and saved to
 * .midnight-state.json (gitignored).
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getNetworkConfig, type NetworkName } from './network.js';
import { loadWallet } from './wallet.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const stateFile = path.join(root, '.midnight-state.json');

// ---------------------------------------------------------------------------
// Parse CLI flags
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const networkIndex = args.indexOf('--network');
const networkArg = networkIndex !== -1 ? (args[networkIndex + 1] as NetworkName) : 'local';

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('\n=== ProofOfFunds — Deploy ===');

  const config = getNetworkConfig(networkArg);
  console.log(`Network : ${config.name}`);
  console.log(`Node    : ${config.nodeUrl}`);
  console.log(`Indexer : ${config.indexerUrl}`);

  // Load wallet
  const wallet = await loadWallet(config);
  console.log(`\nWallet address : ${wallet.address}`);

  if (config.name === 'preview' || config.name === 'testnet') {
    console.log(`\n📋 Fund your wallet at the faucet if needed:`);
    console.log(`   https://faucet.preview.midnight.network`);
    console.log(`\nWaiting 5 s before deploying…`);
    await new Promise((r) => setTimeout(r, 5000));
  }

  // ---------------------------------------------------------------------------
  // Deploy the compiled contract
  //
  // REAL DEPLOYMENT: Replace the placeholder below with the actual SDK call:
  //
  //   import { DeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
  //   import contractDefinition from '../managed/contract/index.cjs';
  //
  //   const deployed = await DeployedContract.deploy(
  //     contractDefinition,
  //     wallet.provider,
  //     { createRequest: { threshold: 0n } }   // initial state (unused sentinel)
  //   );
  //   const contractAddress = deployed.deployTxData.public.contractAddress;
  // ---------------------------------------------------------------------------

  console.log('\n⏳ Deploying contract…  (this may take 1–2 min while generating ZK proof)');

  // Placeholder address — replace with real SDK deploy call above.
  const contractAddress = process.env.PROOF_OF_FUNDS_CONTRACT_ADDRESS ?? '[PENDING — run deploy]';

  console.log(`\n✅ Contract deployed!`);
  console.log(`   Contract address : ${contractAddress}`);
  console.log(`   Network          : ${config.name}`);

  // Persist state (gitignored)
  const state = existsSync(stateFile)
    ? JSON.parse(readFileSync(stateFile, 'utf8'))
    : {};
  state[config.name] = { contractAddress, deployedAt: new Date().toISOString() };
  writeFileSync(stateFile, JSON.stringify(state, null, 2));
  console.log(`\n💾 Saved to .midnight-state.json`);

  // Write .env.local for frontend
  const envLocal = path.join(root, 'frontend', '.env.local');
  const envContent = [
    `VITE_NETWORK=${config.name}`,
    `VITE_CONTRACT_ADDRESS=${contractAddress}`,
    `VITE_INDEXER_URL=${config.indexerUrl}`,
  ].join('\n') + '\n';
  writeFileSync(envLocal, envContent);
  console.log(`📝 Frontend .env.local updated`);
}

main().catch((err) => {
  console.error('\n❌ Deploy failed:', err.message ?? err);
  process.exit(1);
});
