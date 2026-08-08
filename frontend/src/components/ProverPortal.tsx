/**
 * ProverPortal.tsx — Prover (tenant/freelancer) submits ZK proof
 *
 * The prover enters:
 *   1. The Request ID shared by the verifier.
 *   2. Their private balance (entered locally, NEVER stored or logged).
 *
 * CRITICAL PRIVACY RULES enforced in this component:
 *   - proverBalance is stored ONLY in a local input field (React uncontrolled
 *     input via ref) so it is never placed in React state.
 *   - It is read once at submit time, passed to the proving function, and
 *     immediately discarded (set to empty string after use).
 *   - It is NEVER logged, never sent to the indexer, never stored in
 *     localStorage or sessionStorage.
 *   - The UI label always reads "Proved without revealing your input".
 */

import { useRef, useState, type FormEvent } from 'react';
import { submitProofTx, fetchRequest, type VerificationRequest } from '../lib/contract';
import { useMidnight } from '../hooks/useMidnight';

export function ProverPortal() {
  const { isConnected, enabledApi } = useMidnight();

  // Request lookup
  const [requestId, setRequestId] = useState('');
  const [requestData, setRequestData] = useState<VerificationRequest | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLooking, setIsLooking] = useState(false);

  // ⚠️  Private balance is intentionally NOT in React state.
  //     We use an uncontrolled input ref so the value never enters the
  //     component state tree and cannot be accidentally persisted or logged.
  const privateBalanceRef = useRef<HTMLInputElement>(null);

  // Proof submission
  const [isProving, setIsProving] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proofResult, setProofResult] = useState<{ txHash: string; requestId: string } | null>(null);

  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    setLookupError(null);
    setRequestData(null);
    setIsLooking(true);

    try {
      const req = await fetchRequest(BigInt(requestId));
      if (!req) {
        setLookupError(`Request #${requestId} not found.`);
      } else if (req.status !== 0) {
        setLookupError(`Request #${requestId} is closed and no longer accepting proofs.`);
      } else if (req.attestation) {
        setLookupError(`Request #${requestId} already has a submitted proof.`);
      } else {
        setRequestData(req);
      }
    } catch (err: unknown) {
      setLookupError(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setIsLooking(false);
    }
  }

  async function handleSubmitProof(e: FormEvent) {
    e.preventDefault();
    if (!enabledApi || !requestData) return;

    // Read the private balance once — directly from the DOM input ref.
    // It is intentionally NOT stored in React state.
    const rawBalance = privateBalanceRef.current?.value ?? '';
    if (!rawBalance || isNaN(Number(rawBalance))) {
      setProofError('Please enter a valid balance amount.');
      return;
    }

    // Convert to BigInt for the circuit — this is the only place the
    // private value exists in JavaScript memory during proof generation.
    const proverBalance = BigInt(rawBalance);

    // Immediately clear the input field so the value is not retained in the DOM.
    if (privateBalanceRef.current) {
      privateBalanceRef.current.value = '';
    }

    setIsProving(true);
    setProofError(null);
    setProofResult(null);

    try {
      const txHash = await submitProofTx(
        { requestId: requestData.requestId, proverBalance },
        enabledApi
      );

      // proverBalance is no longer referenced here — GC can reclaim it.
      setProofResult({ txHash, requestId: requestData.requestId.toString() });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Proof generation failed.';
      setProofError(msg);
    } finally {
      setIsProving(false);
    }
  }

  return (
    <section className="portal prover-portal" aria-labelledby="prover-heading">
      <h2 id="prover-heading">Prover Portal</h2>
      <p className="portal-description">
        As a tenant, freelancer, or applicant — enter the Request ID you received
        from the verifier, then enter your balance locally. A Zero-Knowledge proof
        will be generated on your device. Only a "meets threshold: yes/no" result
        is published on-chain. Your actual balance never leaves your browser.
      </p>

      {/* Step 1: Look up the request */}
      <div className="card">
        <h3>Step 1 — Load Verification Request</h3>
        <form onSubmit={handleLookup} aria-label="Load verification request by ID">
          <div className="form-group">
            <label htmlFor="request-id">Request ID</label>
            <input
              id="request-id"
              type="number"
              min="0"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              placeholder="e.g. 0"
              required
              disabled={isLooking}
            />
          </div>
          <button
            type="submit"
            className="btn btn--secondary"
            disabled={isLooking || !requestId}
            aria-busy={isLooking}
          >
            {isLooking ? (
              <><span className="spinner" aria-hidden="true" /> Loading…</>
            ) : (
              'Load Request'
            )}
          </button>
        </form>

        {lookupError && (
          <div className="error-banner" role="alert">
            <p>{lookupError}</p>
          </div>
        )}

        {requestData && (
          <div className="result-card" role="status">
            <h4>Request #{requestData.requestId.toString()}</h4>
            <p>
              <strong>Required minimum:</strong>{' '}
              ≥ {requestData.threshold.toString()} units
            </p>
            <p className="privacy-note">
              🔒 You will prove you meet this requirement without revealing your
              actual balance.
            </p>
          </div>
        )}
      </div>

      {/* Step 2: Submit ZK proof */}
      {requestData && !proofResult && (
        <div className="card">
          <h3>Step 2 — Generate & Submit ZK Proof</h3>

          <div className="privacy-callout" role="note">
            <strong>🔐 Your balance stays private.</strong>
            <p>
              Enter your balance below. It will be used only inside the local
              Zero-Knowledge circuit on your device. It is never stored, never
              sent to any server, and never written to the blockchain.
              Only a cryptographic proof ("meets threshold: true") is published.
            </p>
          </div>

          <form onSubmit={handleSubmitProof} aria-label="Generate zero-knowledge proof">
            <div className="form-group">
              <label htmlFor="private-balance">
                Your Balance (private — stays on your device)
              </label>
              {/*
                ⚠️  PRIVATE INPUT — uncontrolled input via ref.
                    Deliberately NOT in React state to prevent accidental
                    persistence, logging, or rendering.
              */}
              <input
                id="private-balance"
                type="number"
                min="0"
                ref={privateBalanceRef}
                placeholder="Enter your actual balance"
                required
                disabled={!isConnected || isProving}
                autoComplete="off"
                aria-describedby="balance-privacy-note"
              />
              <span id="balance-privacy-note" className="form-hint privacy-hint">
                This value is processed locally and is never transmitted or stored.
              </span>
            </div>

            {!isConnected && (
              <p className="form-warning" role="alert">
                Connect your wallet to generate a proof.
              </p>
            )}

            <button
              type="submit"
              className="btn btn--primary btn--large"
              disabled={!isConnected || isProving}
              aria-busy={isProving}
            >
              {isProving ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Generating ZK Proof… (this may take 30–60 s)
                </>
              ) : (
                'Generate & Submit Proof'
              )}
            </button>
          </form>

          {proofError && (
            <div className="error-banner" role="alert">
              <p>{proofError}</p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Result */}
      {proofResult && (
        <div className="card result-card--success" role="status" aria-live="polite">
          <h3>✅ Proof Submitted Successfully</h3>
          <dl>
            <dt>Request ID</dt>
            <dd>#{proofResult.requestId}</dd>

            <dt>Transaction hash</dt>
            <dd><code className="mono">{proofResult.txHash}</code></dd>

            <dt>On-chain attestation</dt>
            <dd>
              <span className="badge badge--verified">Verified ≥ threshold: TRUE</span>
            </dd>
          </dl>

          <div className="privacy-note privacy-note--prominent" role="note">
            <strong>🔒 Proved without revealing your input.</strong>
            <p>
              The verifier can see the attestation on-chain. They know you meet
              the requirement. They do not know your actual balance.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
