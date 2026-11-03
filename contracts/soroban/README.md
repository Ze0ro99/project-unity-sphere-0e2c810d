# PiRC-209 Soroban Identity Reference

This Cargo package builds the PiRC-209 identity-commitment reference contract only.

## Current contract surface
- `register_identity_commitment(user, commitment)`: user-authenticated storage of a 32-byte commitment.
- `get_identity_commitment(user)`: returns the stored commitment.
- `has_identity_commitment(user)`: reports whether a commitment exists.

**Important:** storing a commitment does not verify identity, KYC, a credential, or a zero-knowledge proof. The commitment should be salted and must not be a raw hash of low-entropy personal information.

Other Soroban source files in this directory are not included in this crate until they have independent manifests, tests, and security review. Canonical PiRC-207/214/225/237 reference crates are in the SmartContracts repository.
