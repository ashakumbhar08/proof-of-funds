# ProofOfFunds — Product Proposal

## 1. PRODUCT AND USERS

**What the product does:**
ProofOfFunds is a privacy-preserving financial verification dApp that allows users to prove they meet minimum balance requirements without revealing their actual financial details.

**The problem it solves:**
Traditional financial verification (rental applications, loan pre-approval, employment screening) forces applicants to share invasive bank statements showing exact balances, account numbers, and transaction histories. Verifiers only need to know "does the applicant have at least $X?" but current systems require disclosure of all financial details. This exposes sensitive data, creates identity theft risks, and violates financial privacy.

**Target users:**
- **Provers**: Tenants, job applicants, freelancers, loan applicants who need to demonstrate financial capacity
- **Verifiers**: Landlords, employers, lenders, service providers who need to confirm minimum financial thresholds

**User interaction workflow:**
1. **Verifier** creates a verification request with a minimum threshold (e.g. "≥ $5,000") on-chain
2. **Verifier** shares the Request ID with the applicant
3. **Prover** enters the Request ID and their actual balance in the dApp interface
4. **Zero-Knowledge proof** is generated locally on the prover's device
5. **Smart contract** verifies the proof and publishes a boolean attestation on-chain
6. **Verifier** checks the on-chain result: "Verified ≥ $5,000: TRUE"

The verifier receives cryptographic proof of eligibility. The prover maintains complete privacy over exact balances and financial details.

## 2. WHY MIDNIGHT SPECIFICALLY?

This product **requires** Midnight's privacy architecture and cannot be built on traditional public blockchains:

**Private Witnesses:**
The prover's actual balance (`proverBalance`) must participate in the computation (`balance >= threshold`) but never reach public state. Midnight's Compact language natively supports private witness inputs through the `witness` keyword. These inputs are cryptographically proven but never stored on-chain or transmitted to validators.

**Zero-Knowledge Range Proofs:**
The core verification (`balance >= threshold`) must be evaluated in zero-knowledge. Midnight's Compact compiler automatically generates ZK circuits from this constraint. The proof confirms the relationship holds without revealing the underlying balance value.

**Selective Disclosure:**
Only the boolean attestation (`meets threshold: true/false`) should be publicly verifiable, while the balance remains private. Midnight's dual-ledger model (public + private state) enables this by design. The `disclose()` function explicitly controls what data transitions from private computation to public state.

**Public Verification Without Data Exposure:**
Verifiers need cryptographic proof they can trust without relying on the prover's word alone. Midnight publishes immutable attestations on-chain that verifiers can independently verify. The ZK proof ensures the underlying private data never leaked during verification.

**Why public blockchains fail:**
On Ethereum or other public chains, any data entered into smart contracts becomes permanently public and visible to all network participants. There is no concept of private witness inputs or selective disclosure at the protocol level. Layer-2 privacy solutions add complexity and often compromise on decentralization or verifiability.

## 3. DATA MODEL

**PUBLIC STATE (on Midnight blockchain):**
- `nextRequestId`: Auto-incrementing counter for request tracking
- `reqThreshold`: The minimum amount required for this request (e.g., 5000 units)
- `reqVerifierKey`: Cryptographic commitment to verifier identity
- `reqStatus`: Request lifecycle state (0 = OPEN, 1 = CLOSED)
- `reqAttestation`: Boolean result indicating if proof succeeded (true/false)
- `reqTimestamp`: Block height when proof was submitted

**PRIVATE WITNESS (never leaves prover's device):**
- `proverBalance()`: The user's actual financial balance (Uint<64>)
- `verifierSecret()`: Verifier's private key for request ownership verification

**DISCLOSURE (what on-chain observers learn):**
On-chain observers see: *"Request #3 requires ≥ 5,000 units. At block height 812, someone submitted a valid proof showing they meet the requirement."*

**What observers CANNOT learn:**
- The prover's actual balance (could be $5,001 or $5,000,000)
- Prover identity or wallet address (not linked to the attestation)
- Account details, transaction history, or financial patterns
- Any numeric information beyond the threshold value
- The margin by which they exceeded the threshold

The Compact implementation enforces this:
```compact
const balance = proverBalance();  // Private witness - never public
assert(balance >= threshold, "Balance does not meet threshold");  // ZK constraint
reqAttestation.insert(pubId, disclose(true));  // Only boolean published
```

The `proverBalance()` witness enters the circuit locally, satisfies the constraint in zero-knowledge, and never appears in any ledger field or transaction payload.

## 4. MAINNET FEASIBILITY — LEVEL 6 SCOPE

**Current Status:**
Working prototype with complete ZK circuits, passing test suite, deployment scripts, and functional frontend. The privacy model is sound and the core architecture is production-ready conceptually.

**Path to Mainnet:**

**Security & Auditing:**
- Formal audit of Compact circuits and ZK proof generation logic
- Cryptographic review of witness handling and private state management
- Smart contract audit covering state transitions, access controls, and edge cases
- Frontend security review for private input handling and wallet integration
- Penetration testing for attack vectors

**Testing & Quality:**
- Expand test coverage to include property-based testing for circuit edge cases
- Integration testing with production Midnight Lace wallet
- Load testing for concurrent verification requests
- Fuzz testing for unexpected inputs and state conditions
- End-to-end testing across different balance ranges and failure scenarios

**Wallet Integration:**
- Integration with Midnight Lace wallet production release
- Multi-wallet support and connection management
- Transaction signing UX and error handling
- Request history persistence and recovery
- Multi-device synchronization

**Error Handling & Reliability:**
- Robust proof generation failure recovery mechanisms
- Network outage resilience and automatic retry logic
- Clear error messaging for failed verifications
- Request expiration and automatic cleanup
- Transaction confirmation and status tracking

**Production Infrastructure:**
- Production-grade Midnight node deployment and monitoring
- CDN deployment for global frontend availability
- Indexer infrastructure for efficient state queries
- Rate limiting and spam prevention
- Logging and alerting without compromising privacy

**Privacy & Security Enhancements:**
- Metadata privacy (prevent timing analysis attacks)
- Enhanced verifier identity protection
- Audit logging that preserves user privacy
- Protection against front-running and MEV
- Request batching for anonymity sets

**User Validation:**
- Real-world pilot with property management companies or lending platforms
- User feedback collection and UX iteration
- Integration APIs for existing rental/employment verification systems
- User education materials explaining ZK privacy benefits
- Compliance review for financial data handling regulations

**Deployment & Operations:**
- Mainnet contract deployment with production parameters
- Contract upgrade governance model
- Economic sustainability model for network fees
- Documentation for verifiers and provers
- Support channels and incident response procedures

The current architecture provides a solid foundation. The privacy model is correct, the ZK circuits implement the required constraints, and the frontend demonstrates proper handling of private inputs. With security hardening, production infrastructure, and real-world validation, this prototype can scale to mainnet deployment.
