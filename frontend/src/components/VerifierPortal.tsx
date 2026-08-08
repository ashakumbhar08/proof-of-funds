/**
 * VerifierPortal.tsx — Verifier creates and manages proof requests
 *
 * Landlords / employers / lenders can:
 *   1. Create a new proof request by setting a required threshold.
 *   2. View the attestation status of their existing requests.
 *   3. Revoke (close) an open request.
 *
 * ALL data in this component is PUBLIC — no private inputs here.
 */

import { useState, type FormEvent } from 'react';
import { createRequestTx, fetchRequest, type VerificationRequest } from '../lib/contract';
import { useMidnight } from '../hooks/useMidnight';

export function VerifierPortal() {
  const { isConnected, enabledApi } = useMidnight();

  // Create request form state
  const [threshold, setThreshold] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Lookup request state
  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState<VerificationRequest | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLooking, setIsLooking] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!enabledApi) return;

    const thresh = BigInt(threshold);
    if (thresh <= 0n) {
      setCreateError('Threshold must be greater than 0.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    setCreatedId(null);

    try {
      const txHash = await createRequestTx(thresh, enabledApi);
      setCreatedId(txHash);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create request.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    if (!lookupId) return;

    setIsLooking(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const req = await fetchRequest(BigInt(lookupId));
      if (!req) {
        setLookupError(`Request #${lookupId} not found on-chain.`);
      } else {
        setLookupResult(req);
      }
    } catch (err: unknown) {
      setLookupError(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setIsLooking(false);
    }
  }

  return (
    <section className="portal verifier-portal" aria-labelledby="verifier-heading">
      <h2 id="verifier-heading">Verifier Portal</h2>
      <p className="portal-description">
        As a landlord, employer, or lender — create a proof request by setting the
        minimum financial threshold. Share the generated Request ID with the applicant.
        You will receive a cryptographic attestation without seeing their actual balance.
      </p>

      {/* Create Request Form */}
      <div className="card">
        <h3>Create Verification Request</h3>
        <form onSubmit={handleCreate} aria-label="Create verification request">
          <div className="form-group">
            <label htmlFor="threshold">
              Required Minimum Balance (USD equivalent)
            </label>
            <input
              id="threshold"
              type="number"
              min="1"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="e.g. 5000"
              required
              disabled={!isConnected || isCreating}
              aria-describedby="threshold-hint"
            />
            <span id="threshold-hint" className="form-hint">
              The applicant must prove they hold at least this amount.
              Their actual balance will remain private.
            </span>
          </div>

          {!isConnected && (
            <p className="form-warning" role="alert">
              Connect your wallet to create a request.
            </p>
          )}

          <button
            type="submit"
            className="btn btn--primary"
            disabled={!isConnected || isCreating || !threshold}
            aria-busy={isCreating}
          >
            {isCreating ? (
              <><span className="spinner" aria-hidden="true" /> Creating request…</>
            ) : (
              'Create Request'
            )}
          </button>
        </form>

        {createError && (
          <div className="error-banner" role="alert">
            <p>{createError}</p>
          </div>
        )}

        {createdId && (
          <div className="success-banner" role="status" aria-live="polite">
            <p>✅ Request created on-chain!</p>
            <p>
              Transaction hash:{' '}
              <code className="mono">{createdId}</code>
            </p>
            <p className="privacy-note">
              <strong>🔒 Privacy note:</strong> The applicant will prove compliance
              without revealing their balance to you.
            </p>
          </div>
        )}
      </div>

      {/* Lookup Request Status */}
      <div className="card">
        <h3>Check Request Status</h3>
        <form onSubmit={handleLookup} aria-label="Check request attestation status">
          <div className="form-group">
            <label htmlFor="lookup-id">Request ID</label>
            <input
              id="lookup-id"
              type="number"
              min="0"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder="e.g. 0"
              required
              disabled={isLooking}
            />
          </div>

          <button
            type="submit"
            className="btn btn--secondary"
            disabled={isLooking || !lookupId}
            aria-busy={isLooking}
          >
            {isLooking ? (
              <><span className="spinner" aria-hidden="true" /> Checking…</>
            ) : (
              'Check Status'
            )}
          </button>
        </form>

        {lookupError && (
          <div className="error-banner" role="alert">
            <p>{lookupError}</p>
          </div>
        )}

        {lookupResult && (
          <div className="result-card" role="status" aria-live="polite">
            <h4>Request #{lookupResult.requestId.toString()}</h4>
            <dl>
              <dt>Required threshold</dt>
              <dd>≥ {lookupResult.threshold.toString()} units</dd>

              <dt>Status</dt>
              <dd>
                <span className={`badge badge--${lookupResult.status === 0 ? 'open' : 'closed'}`}>
                  {lookupResult.status === 0 ? 'OPEN' : 'CLOSED'}
                </span>
              </dd>

              <dt>Attestation</dt>
              <dd>
                {lookupResult.attestation ? (
                  <span className="badge badge--verified">
                    ✅ Verified — applicant met the threshold
                  </span>
                ) : (
                  <span className="badge badge--pending">
                    ⏳ Awaiting proof submission
                  </span>
                )}
              </dd>
            </dl>
            <p className="privacy-note">
              <strong>🔒 Proved without revealing the applicant's actual balance.</strong>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
