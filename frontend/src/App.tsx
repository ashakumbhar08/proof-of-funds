/**
 * App.tsx — ProofOfFunds dApp
 * Private Proof of Solvency | Midnight Network
 */

import { useState } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { VerifierPortal } from './components/VerifierPortal';
import { ProverPortal } from './components/ProverPortal';
import './App.css';

type Tab = 'verifier' | 'prover';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('prover');

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <span className="logo" aria-hidden="true">🔐</span>
            <div>
              <h1 className="app-title">ProofOfFunds</h1>
              <p className="app-subtitle">Private Proof of Solvency · Midnight Network</p>
            </div>
          </div>
          <WalletConnect />
        </div>
      </header>

      {/* Main */}
      <main className="app-main">
        {/* Hero */}
        <section className="hero" aria-labelledby="hero-heading">
          <h2 id="hero-heading">Zero-Knowledge Financial Verification</h2>
          <p>
            Prove you meet a financial requirement — without revealing your balance,
            account numbers, or transaction history. Powered by Midnight's ZK proofs.
          </p>
          <div className="hero-chips">
            <span className="chip chip--private">🔒 Balance stays private</span>
            <span className="chip chip--proof">✅ Cryptographic attestation</span>
            <span className="chip chip--network">⛓ On-chain verification</span>
          </div>
        </section>

        {/* Tab navigation */}
        <nav className="tab-nav" aria-label="Portal selection">
          <button
            className={`tab-btn ${activeTab === 'prover' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('prover')}
            aria-pressed={activeTab === 'prover'}
            aria-controls="prover-panel"
          >
            🧑‍💼 Prover Portal
            <span className="tab-hint">Tenant / Applicant</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'verifier' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('verifier')}
            aria-pressed={activeTab === 'verifier'}
            aria-controls="verifier-panel"
          >
            🏠 Verifier Portal
            <span className="tab-hint">Landlord / Employer</span>
          </button>
        </nav>

        {/* Panels */}
        <div className="portal-container">
          <div
            id="prover-panel"
            role="tabpanel"
            hidden={activeTab !== 'prover'}
            aria-labelledby="prover-tab"
          >
            {activeTab === 'prover' && <ProverPortal />}
          </div>
          <div
            id="verifier-panel"
            role="tabpanel"
            hidden={activeTab !== 'verifier'}
            aria-labelledby="verifier-tab"
          >
            {activeTab === 'verifier' && <VerifierPortal />}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          ProofOfFunds · Built on{' '}
          <a href="https://midnight.network" target="_blank" rel="noopener noreferrer">
            Midnight Network
          </a>
          {' '}· INTO the Midnight — SPPU Bootcamp
        </p>
        <p className="footer-privacy">
          🔒 Private inputs are never stored, logged, or transmitted. Only ZK proofs reach the chain.
        </p>
      </footer>
    </div>
  );
}

export default App;
