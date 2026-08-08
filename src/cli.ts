/**
 * cli.ts — Interactive CLI for ProofOfFunds
 *
 * Usage: npm run cli
 *
 * Commands:
 *   create-request <threshold>   Create a new verification request
 *   submit-proof <requestId>     Submit a ZK proof for a request
 *   revoke <requestId>           Close a request (verifier only)
 *   status <requestId>           Check attestation status
 */

import { getNetworkConfig, type NetworkName } from './network.js';

const args = process.argv.slice(2);
const [command, ...params] = args;

const networkArg = (() => {
  const idx = args.indexOf('--network');
  return idx !== -1 ? (args[idx + 1] as NetworkName) : 'local';
})();

const config = getNetworkConfig(networkArg);

console.log('\n=== ProofOfFunds CLI ===');
console.log(`Network : ${config.name}`);
console.log(`Indexer : ${config.indexerUrl}\n`);

switch (command) {
  case 'create-request': {
    const threshold = params[0];
    if (!threshold) {
      console.error('Usage: npm run cli -- create-request <threshold>');
      process.exit(1);
    }
    console.log(`Creating request with threshold: ${threshold}`);
    console.log('→ Calling createRequest circuit…');
    // TODO: wire to deployed contract via SDK
    console.log('(Placeholder — wire to deployed contract address from .midnight-state.json)');
    break;
  }

  case 'submit-proof': {
    const requestId = params[0];
    if (!requestId) {
      console.error('Usage: npm run cli -- submit-proof <requestId>');
      process.exit(1);
    }
    console.log(`Submitting proof for request #${requestId}`);
    console.log('→ Private balance will be read from MIDNIGHT_PROVER_BALANCE env var');
    console.log('  (NEVER stored or logged — used only in the local ZK circuit)');
    // TODO: wire to deployed contract
    console.log('(Placeholder — wire to deployed contract address from .midnight-state.json)');
    break;
  }

  case 'revoke': {
    const requestId = params[0];
    if (!requestId) {
      console.error('Usage: npm run cli -- revoke <requestId>');
      process.exit(1);
    }
    console.log(`Revoking request #${requestId}`);
    // TODO: wire to deployed contract
    console.log('(Placeholder — wire to deployed contract address from .midnight-state.json)');
    break;
  }

  case 'status': {
    const requestId = params[0];
    if (!requestId) {
      console.error('Usage: npm run cli -- status <requestId>');
      process.exit(1);
    }
    console.log(`Checking attestation status for request #${requestId}`);
    // TODO: wire to deployed contract via indexer
    console.log('(Placeholder — wire to indexer at ' + config.indexerUrl + ')');
    break;
  }

  default:
    console.log('Available commands:');
    console.log('  create-request <threshold>   Create a new verification request');
    console.log('  submit-proof   <requestId>   Submit a ZK proof');
    console.log('  revoke         <requestId>   Close a request (verifier only)');
    console.log('  status         <requestId>   Check attestation status');
    console.log('\nFlags:');
    console.log('  --network local|testnet|preview');
    break;
}
