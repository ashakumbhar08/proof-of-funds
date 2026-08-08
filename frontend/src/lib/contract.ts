/**
 * contract.ts — ProofOfFunds contract interaction helpers
 *
 * Reads public state from the indexer and submits circuit calls through
 * the DApp Connector wallet adapter.
 *
 * PRIVACY RULE: Private inputs (proverBalance) must NEVER be stored in
 * React state, logged, or sent anywhere other than the local proving function.
 * They are accepted as function arguments, used once, and dropped.
 */

export interface VerificationRequest {
  requestId: bigint;
  threshold: bigint;
  status: number;         // 0=OPEN, 1=CLOSED
  attestation: boolean;
  timestamp: bigint;
}

export interface ContractConfig {
  contractAddress: string;
  indexerUrl: string;
}

function getConfig(): ContractConfig {
  return {
    contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS ?? '',
    indexerUrl: import.meta.env.VITE_INDEXER_URL ?? 'https://indexer.preview.midnight.network',
  };
}

// ---------------------------------------------------------------------------
// Read state via indexer
// ---------------------------------------------------------------------------

/**
 * Fetches the public state of a verification request from the indexer.
 * No private data is involved in this call.
 */
export async function fetchRequest(requestId: bigint): Promise<VerificationRequest | null> {
  const { indexerUrl, contractAddress } = getConfig();
  if (!contractAddress) {
    throw new Error('VITE_CONTRACT_ADDRESS not set. Deploy the contract first.');
  }

  try {
    const url = `${indexerUrl}/api/v1/contract/${contractAddress}/state`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Indexer returned ${res.status}`);
    const data = await res.json() as Record<string, unknown>;

    // Parse the flat map fields from the contract ledger state.
    // Adjust these field paths based on the actual indexer response shape.
    const reqThreshold   = data['reqThreshold']   as Record<string, string> | undefined;
    const reqStatus      = data['reqStatus']       as Record<string, number> | undefined;
    const reqAttestation = data['reqAttestation']  as Record<string, boolean> | undefined;
    const reqTimestamp   = data['reqTimestamp']    as Record<string, string> | undefined;

    const idStr = requestId.toString();
    if (!reqThreshold?.[idStr]) return null;

    return {
      requestId,
      threshold:   BigInt(reqThreshold[idStr] ?? '0'),
      status:      reqStatus?.[idStr] ?? 0,
      attestation: reqAttestation?.[idStr] ?? false,
      timestamp:   BigInt(reqTimestamp?.[idStr] ?? '0'),
    };
  } catch (err) {
    console.error('[contract] fetchRequest error:', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Submit transactions via DApp Connector
// ---------------------------------------------------------------------------

export interface ProofSubmitParams {
  requestId: bigint;
  // ⚠️  proverBalance is accepted here as a parameter — it is passed directly
  //     to the local proving function and NEVER stored, logged, or returned.
  proverBalance: bigint;
}

/**
 * Calls the submitProof circuit via the wallet's proving adapter.
 *
 * The proverBalance is a private witness:
 *   - It enters the local ZK circuit as a witness input.
 *   - The circuit checks balance >= threshold.
 *   - Only the boolean attestation is published on-chain.
 *   - The balance is discarded after the proof is generated.
 */
export async function submitProofTx(
  params: ProofSubmitParams,
  walletApi: { submitTransaction: (tx: unknown) => Promise<string>; proveTransaction: (tx: unknown) => Promise<unknown> }
): Promise<string> {
  const { contractAddress } = getConfig();
  if (!contractAddress) throw new Error('Contract address not configured.');

  // Build the circuit call payload.
  // The proverBalance is included as a private witness field — it is used
  // locally for proof generation and never sent to the network.
  const circuitCall = {
    contractAddress,
    circuit: 'submitProof',
    publicInputs: {
      requestId: params.requestId.toString(),
    },
    // Private witness — stays local, never submitted to chain.
    privateInputs: {
      proverBalance: params.proverBalance.toString(),
    },
  };

  // 1. Generate the ZK proof locally (wallet's proving adapter).
  const provedTx = await walletApi.proveTransaction(circuitCall);

  // 2. Submit the proved transaction to the network.
  //    At this point the private balance has been consumed by the circuit
  //    and is no longer needed.
  const txHash = await walletApi.submitTransaction(provedTx);

  return txHash;
}

/**
 * Calls the createRequest circuit to publish a new verification request.
 * All inputs are public.
 */
export async function createRequestTx(
  threshold: bigint,
  walletApi: { submitTransaction: (tx: unknown) => Promise<string>; proveTransaction: (tx: unknown) => Promise<unknown> }
): Promise<string> {
  const { contractAddress } = getConfig();
  if (!contractAddress) throw new Error('Contract address not configured.');

  const circuitCall = {
    contractAddress,
    circuit: 'createRequest',
    publicInputs: { threshold: threshold.toString() },
    privateInputs: {},
  };

  const provedTx = await walletApi.proveTransaction(circuitCall);
  return await walletApi.submitTransaction(provedTx);
}
