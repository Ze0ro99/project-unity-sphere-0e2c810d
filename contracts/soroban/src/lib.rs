#![no_std]

// This crate builds the PiRC-209 identity-commitment reference contract only.
// Other Soroban modules remain separate reference sources until they have
// independent manifests, tests, and security review.
pub mod identity {
    pub mod did_registry;
}
