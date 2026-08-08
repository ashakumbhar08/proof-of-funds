/**
 * setup.ts — One-time environment setup for ProofOfFunds
 *
 * Run: npm run setup
 * This installs all dependencies (root + frontend) and verifies the
 * compiled contract artefacts exist in managed/.
 */

import { existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function run(cmd: string, cwd = root): void {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd });
}

async function main(): Promise<void> {
  console.log('=== ProofOfFunds — Environment Setup ===\n');

  // 1. Check Node version
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  if (major < 18) {
    throw new Error(`Node >= 18 required.  Found: ${nodeVersion}`);
  }
  console.log(`✓ Node ${nodeVersion}`);

  // 2. Install root dependencies
  run('npm install');

  // 3. Install frontend dependencies
  const frontendDir = path.join(root, 'frontend');
  if (existsSync(frontendDir)) {
    run('npm install', frontendDir);
  }

  // 4. Check compiled contract
  const managedDir = path.join(root, 'managed');
  if (!existsSync(managedDir)) {
    console.log('\n⚠  managed/ not found — running compact compile…');
    run('compact compile contracts/proof_of_funds.compact managed');
  } else {
    console.log('✓ managed/ artefacts present');
  }

  console.log('\n✅ Setup complete.  Run `npm run network` to start the local devnet.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
