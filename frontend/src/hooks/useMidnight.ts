/**
 * useMidnight.ts — DApp Connector API hook
 *
 * Discovers window.midnight wallets dynamically (never hardcodes wallet names).
 * Connects to Preview Network, validates network match, reads address.
 *
 * Privacy guarantee:
 *   Private inputs (prover balance) are NEVER stored in this hook or React state.
 *   They are passed directly to the proving function at call time and discarded.
 */

import { useState, useCallback, useEffect } from 'react';

// ---- Types ------------------------------------------------------------------

export type NetworkId = 'preview' | 'testnet' | 'local';

export interface MidnightWalletAPI {
  enable(): Promise<EnabledAPI>;
  apiVersion: string;
  name: string;
  icon?: string;
}

export interface EnabledAPI {
  getNetworkId(): Promise<string>;
  getAddress(): Promise<string>;
  submitTransaction(tx: unknown): Promise<string>;
  balanceTx(tx: unknown, proofInfo: unknown): Promise<unknown>;
  proveTransaction(tx: unknown): Promise<unknown>;
}

export interface MidnightState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  networkId: string | null;
  error: string | null;
  enabledApi: EnabledAPI | null;
}

// ---- Helpers ----------------------------------------------------------------

declare global {
  interface Window {
    midnight?: Record<string, MidnightWalletAPI>;
  }
}

/** Discovers all installed Midnight wallet connectors. */
function discoverWallets(): MidnightWalletAPI[] {
  if (typeof window === 'undefined' || !window.midnight) return [];
  // Never hardcode wallet names — enumerate all keys dynamically.
  return Object.values(window.midnight);
}

const EXPECTED_NETWORK: NetworkId =
  (import.meta.env.VITE_NETWORK as NetworkId) ?? 'preview';

// ---- Hook -------------------------------------------------------------------

export function useMidnight() {
  const [state, setState] = useState<MidnightState>({
    isConnected: false,
    isConnecting: false,
    address: null,
    networkId: null,
    error: null,
    enabledApi: null,
  });

  // Detect wallet availability on mount.
  const [walletAvailable, setWalletAvailable] = useState(false);
  useEffect(() => {
    const check = () => setWalletAvailable(discoverWallets().length > 0);
    check();
    // Re-check after a short delay (wallet extension may inject after page load).
    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, []);

  const connect = useCallback(async () => {
    const wallets = discoverWallets();

    if (wallets.length === 0) {
      setState((s) => ({
        ...s,
        error: 'No Midnight wallet found. Please install the Midnight Lace wallet extension.',
      }));
      return;
    }

    setState((s) => ({ ...s, isConnecting: true, error: null }));

    try {
      // Use the first available wallet.
      const wallet = wallets[0];
      const api = await wallet.enable();

      const networkId = await api.getNetworkId();
      const address = await api.getAddress();

      // Validate network — must match VITE_NETWORK.
      if (networkId.toLowerCase() !== EXPECTED_NETWORK.toLowerCase()) {
        setState((s) => ({
          ...s,
          isConnecting: false,
          error: `Network mismatch: wallet is on "${networkId}" but this app requires "${EXPECTED_NETWORK}". Please switch your wallet to the ${EXPECTED_NETWORK} network.`,
        }));
        return;
      }

      setState({
        isConnected: true,
        isConnecting: false,
        address,
        networkId,
        error: null,
        enabledApi: api,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRejected = msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('denied');
      setState((s) => ({
        ...s,
        isConnecting: false,
        error: isRejected
          ? 'Connection rejected. Please approve the connection in your wallet.'
          : `Connection failed: ${msg}`,
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      isConnecting: false,
      address: null,
      networkId: null,
      error: null,
      enabledApi: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return {
    ...state,
    walletAvailable,
    expectedNetwork: EXPECTED_NETWORK,
    connect,
    disconnect,
    clearError,
  };
}
