# ProofOfFunds — Private Proof of Solvency

> Zero-Knowledge financial verification on Midnight Network. Prove you meet a financial threshold — without revealing your balance, account numbers, or transaction history.

---

## Project Vision

Traditional financial verification forces applicants to share invasive bank statements, full credit reports, or raw transaction histories — leaking far more sensitive data than the verifier actually needs. ProofOfFunds solves this with Midnight's Zero-Knowledge architecture.

A landlord sets a minimum balance requirement (e.g. "≥ $5,000 in liquid assets"). A tenant enters their actual balance **locally** into a Compact ZK circuit. The circuit evaluates `balance >= threshold` on-device. Only a cryptographic boolean attestation — "verified: yes" — reaches the blockchain. The landlord learns the applicant qualifies. They learn nothing else.

Midnight is uniquely suited to this because its Compact language compiles range-proof logic directly into ZK circuits, and its dual-ledger model keeps private witnesses off-chain by design. No other L1 makes this privacy guarantee at the smart-contract level.

---

## Smart Contract Deployment

- **Network:** Preview (Midnight testnet)
- **Deployed contract ID:** `[PENDING — run: npm run deploy -- --network preview]`

> To deploy: fund a wallet at https://faucet.preview.midnight.network, then:
> ```
> export MIDNIGHT_SEED="your 24-word mnemonic"
> npm run deploy -- --network preview
> ```
> Paste the returned contract address here and into `frontend/.env.local`.

---

## Key Features

- **ZK Range Proof** — The Compact circuit evaluates `proverBalance >= threshold`. The exact balance is a private witness: it enters the circuit locally and is cryptographically hidden from validators and verifiers alike.

- **Public attestation only** — The only on-chain output is a boolean (`attestation: true/false`) plus a block-height timestamp. Observers see "Request #3 requires ≥ 5 000 units. At block 812, someone proved they qualify." Nothing else.

- **Verifier Portal** — Landlords/employers create proof requests by publishing a threshold on-chain. They receive a `requestId` to share with applicants.

- **Prover Portal** — Applicants enter a `requestId` and their private balance in the browser. The ZK proof is generated locally. The balance never leaves the device.

- **Request lifecycle** — Verifiers can close requests (`revokeRequest`). Requests can only be attested once.

- **Privacy labels in UI** — Every privacy-sensitive action shows a visible "Proved without revealing your input" badge. Private inputs are never rendered, logged, or stored in React state.

- **Deployable frontend** — React + Vite SPA with Vercel/Netlify config ready.

---

## Future Scope

- **Credential types** — Extend the circuit to support credit score ranges, income bands, or any numeric credential — not just liquid balance.
- **Multi-threshold requests** — Verifiers set compound requirements (e.g. balance ≥ $5K AND credit score ≥ 700).
- **Recurring verification** — Time-bounded attestations that expire, requiring periodic re-proof without re-revealing data.
- **Anonymised prover identity** — Add a commitment scheme so even the prover's address is not linked to the attestation on-chain.
- **Mainnet path** — Audit the Compact circuits, integrate with the Midnight Lace wallet's production build, and deploy to mainnet once available.
- **Issuer attestations** — Let banks or credit bureaus sign off-chain credentials (e.g. a signed JSON with a balance figure) that the circuit verifies alongside the range proof, removing the self-reporting trust assumption.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart contract | Compact (language v0.23), compiled with `compact` toolchain v0.31.1 |
| ZK proving | Midnight proof server (local devnet via Docker) |
| Blockchain | Midnight Network (local devnet / Preview testnet) |
| Indexer | Midnight standalone indexer |
| Frontend | React 18 + Vite + TypeScript |
| Wallet connector | DApp Connector API (`window.midnight`) — wallet-agnostic |
| Testing | Vitest |
| Deployment hosting | Vercel / Netlify (SPA with `_redirects`) |

---

## Local Development

### Prerequisites

- macOS / Linux / WSL (Windows)
- Node.js ≥ 18
- Docker Desktop (running)
- `compact` toolchain installed (`compact --version` → 0.31.1+)

### 1. Clone and install

```bash
git clone <repo-url>
cd proof-of-funds
npm install
cd frontend && npm install && cd ..
```

### 2. Start the local devnet

```bash
npm run network        # starts node :9944, proof-server :6300, indexer :8088
npm run network:logs   # tail logs to confirm all three are healthy
```

### 3. Compile the contract

```bash
npm run compile
# → managed/ directory is generated with compiled circuits + proving keys
```

### 4. Deploy (local)

```bash
export MIDNIGHT_SEED="your 24-word mnemonic"
npm run deploy                           # deploys to local devnet
npm run deploy -- --network preview      # deploys to Preview testnet
```

### 5. Run tests

```bash
npm test
# 17 tests passing (circuit logic, state transitions, privacy guarantee)
```

### 6. Run the frontend

```bash
# Copy and fill in the env file
cp frontend/.env.example frontend/.env.local
# edit VITE_CONTRACT_ADDRESS with the address from step 4

npm run frontend:dev     # starts dev server at http://localhost:5173
npm run frontend:build   # production build (zero errors)
```

### Stop the devnet

```bash
npm run network:stop
```

---

## Privacy Story

```
[ Tenant's device ]
  proverBalance = 12,400   ← stays here, never transmitted
        ↓
  Compact ZK circuit:  12,400 >= 5,000  →  true
        ↓
[ Midnight blockchain ]
  requestId: 3
  attestation: true          ← only this reaches the chain
  timestamp: block 812

[ Landlord dashboard ]
  reads: "Request #3 — Verified ≥ 5,000: TRUE"
  does NOT see: 12,400
```

The balance is a **private witness** in Compact terminology. It enters the ZK circuit as a callback (`witness proverBalance(): Uint<64>`) and is used only to satisfy the circuit constraint. It is never assigned to a ledger field, never logged, and never appears in any transaction payload.
