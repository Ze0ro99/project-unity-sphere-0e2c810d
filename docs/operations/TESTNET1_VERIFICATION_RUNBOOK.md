# Pi Testnet1 Verification Runbook

**Status:** Procedure template. No deployment or transaction is claimed by this document.

## 1. Preconditions

- Confirm the target network name, passphrase, RPC endpoint, and protocol profile from an authoritative project/network configuration.
- Confirm the exact contract crate, source commit, SDK/toolchain, WASM checksum, and allowlisted contract manifest.
- Confirm the contract ID belongs to the intended network. Never infer network from an address string alone.
- Confirm admin/operator accounts and signer authorization out of band.
- Use test-only assets and test accounts. Never place secrets in repository files, CI logs, browser bundles, or chat.

## 2. Build and artifact record

Capture:
- repository and commit SHA;
- Rust toolchain and Soroban SDK versions;
- build command and exit status;
- WASM file SHA-256;
- dependency lockfile SHA-256;
- SBOM and build log reference;
- independent reviewer and timestamp.

A successful build is not a deployment.

## 3. Deployment

Deployment must be a manual, explicitly approved operation:
1. Verify the allowlisted crate and WASM checksum.
2. Verify network configuration and signer permissions.
3. Simulate deployment where supported.
4. Submit deployment using an isolated operator process.
5. Record transaction hash and final ledger/transaction status.
6. Read the deployed contract ID and code hash back from the network.
7. Compare the readback code hash with the approved artifact.
8. Initialize exactly once and verify the admin state.

Do not loop over all Cargo manifests or deploy every generated WASM artifact.

## 4. Functional verification

For each contract:
- test authorized operation;
- test unauthorized operation;
- test duplicate initialization;
- test invalid input and boundary values;
- verify state readback;
- verify event payload and transaction metadata;
- verify TTL/expiry behavior where relevant.

For economic settlement:
- execute the shared golden fixture cases;
- verify underfunded settlement is rejected;
- verify allocations conserve all atomic units;
- verify duplicate period is rejected;
- reconcile stored period, allocation records, and events.

For oracle:
- verify reporter allowlist;
- reject duplicate sequence;
- test stale/future observation and key revocation;
- do not claim quorum unless independent source identities are aggregated.

For reserve attestation:
- verify authorized auditor only;
- inspect report hash and as-of timestamp;
- distinguish attestation from custody proof.

## 5. Evidence record

Record each test with:
- test ID and expected result;
- network and RPC identity;
- contract ID and code hash;
- transaction hash and ledger sequence;
- timestamp;
- operator and reviewer;
- readback result;
- logs/artifact references;
- exceptions and unresolved risks.

## 6. Stop conditions

Stop and do not retry blindly if:
- transaction submission times out with unknown finality;
- contract ID or code hash differs;
- state readback does not match expected values;
- network identity is ambiguous;
- signer or operator is not allowlisted;
- an invariant or authorization test fails.

Reconcile the original transaction before any resubmission. Never treat Testnet success as Mainnet readiness or financial backing.
