/**
 * WalletConnect.tsx — Wallet connection UI
 *
 * Handles: connect / disconnect, network badge, address display,
 * error states (not installed / rejected / network mismatch).
 */

import { useMidnight } from '../hooks/useMidnight';

export function WalletConnect() {
  const {
    isConnected,
    isConnecting,
    address,
    networkId,
    error,
    walletAvailable,
    expectedNetwork,
    connect,
    disconnect,
    clearError,
  } = useMidnight();

  const shortAddress = address
    ? `${address.slice(0, 8)}…${address.slice(-6)}`
    : null;

  return (
    <div className="wallet-connect" role="region" aria-label="Wallet connection">
      {/* Network badge */}
      <div className="network-badge" aria-label={`Network: ${networkId ?? expectedNetwork}`}>
        <span className={`dot ${isConnected ? 'dot--connected' : 'dot--disconnected'}`} aria-hidden="true" />
        <span className="network-name">
          {isConnected ? networkId : expectedNetwork} Network
        </span>
      </div>

      {/* Connection status */}
      {isConnected ? (
        <div className="wallet-info">
          <span className="wallet-address" title={address ?? ''} aria-label={`Wallet address: ${address}`}>
            {shortAddress}
          </span>
          <button
            className="btn btn--secondary"
            onClick={disconnect}
            aria-label="Disconnect wallet"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          className="btn btn--primary"
          onClick={connect}
          disabled={isConnecting}
          aria-busy={isConnecting}
          aria-label={isConnecting ? 'Connecting wallet…' : 'Connect wallet'}
        >
          {isConnecting ? (
            <>
              <span className="spinner" aria-hidden="true" /> Connecting…
            </>
          ) : walletAvailable ? (
            'Connect Wallet'
          ) : (
            'Install Midnight Wallet'
          )}
        </button>
      )}

      {/* Error state */}
      {error && (
        <div className="error-banner" role="alert" aria-live="assertive">
          <p>{error}</p>
          {!walletAvailable && (
            <a
              href="https://midnight.network/developers"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Install Midnight Lace wallet (opens in new tab)"
            >
              Install Midnight Lace wallet ↗
            </a>
          )}
          <button
            className="btn btn--ghost"
            onClick={clearError}
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
