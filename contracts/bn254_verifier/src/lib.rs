#![no_std]
//! PiRC-800 — BN254 / Groth16 Verifier (feature-gated)
//!
//! PiRC-800 reference verifier. This source does not claim deployment or audit status.
//!
//! Default mode verifies an Ed25519 attestation from one configured trusted
//! signer over a domain-separated SHA-256 commitment. The contract stores that
//! commitment and the ledger sequence. This is not decentralized verification,
//! does not perform Groth16 pairing on-chain, and does not make transactions private.
//!
//! The optional `bn254` feature deliberately fails closed with
//! `HostFunctionUnavailable` until a real Soroban host-function binding and
//! protocol-specific integration tests are implemented.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Bytes, BytesN, Env, Symbol, Vec,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    /// Groth16 verification key (serialized). Set once, updatable by admin.
    Vk,
    /// Recorded commitments: proof_hash -> block ledger sequence.
    Commitment(BytesN<32>),
    /// Trusted off-chain verifier signer (commitment mode only).
    Attestor,
    /// Active mode marker for observability.
    Mode,
}

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidProof = 4,
    InvalidPublicInputs = 5,
    VkNotSet = 6,
    Replay = 7,
    AttestorMissing = 8,
    BadAttestation = 9,
    HostFunctionUnavailable = 10,
}

#[contract]
pub struct Bn254Verifier;

#[contractimpl]
impl Bn254Verifier {
    /// One-shot init. `attestor` is the Ed25519 public key of the trusted
    /// off-chain verifier used by the default commitment mode.
    pub fn initialize(env: Env, admin: Address, attestor: BytesN<32>) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Attestor, &attestor);
        env.storage().instance().set(&DataKey::Mode, &mode_tag(&env));
        Ok(())
    }

    /// Admin: set/rotate a verification key for a future native BN254 implementation.
    pub fn set_vk(env: Env, vk: Bytes) -> Result<(), Error> {
        Self::only_admin(&env)?;
        env.storage().instance().set(&DataKey::Vk, &vk);
        Ok(())
    }

    /// Admin: rotate off-chain attestor (commitment mode).
    pub fn set_attestor(env: Env, attestor: BytesN<32>) -> Result<(), Error> {
        Self::only_admin(&env)?;
        env.storage().instance().set(&DataKey::Attestor, &attestor);
        Ok(())
    }

    /// Verify a Groth16 proof for `public_inputs`.
    ///
    /// * Default mode: verifies the Ed25519 attestation over the domain-separated
    ///   commitment hash, then records that commitment. Replay is rejected.
    /// * The `bn254` feature currently fails closed; no pairing is performed.
    ///
    /// Returns the 32-byte commitment (proof hash) on success.
    pub fn verify(
        env: Env,
        proof: Bytes,
        public_inputs: Vec<Bytes>,
        attestation: Bytes,
    ) -> Result<BytesN<32>, Error> {
        #[cfg(feature = "bn254")]
        if !env.storage().instance().has(&DataKey::Vk) {
            return Err(Error::VkNotSet);
        }
        if public_inputs.is_empty() {
            return Err(Error::InvalidPublicInputs);
        }

        let commitment = commitment_hash(&env, &proof, &public_inputs);

        // Replay guard: a proof is verified at most once per commitment.
        if env.storage().persistent().has(&DataKey::Commitment(commitment.clone())) {
            return Err(Error::Replay);
        }

        Self::run_verify(&env, &proof, &public_inputs, &attestation, &commitment)?;

        env.storage()
            .persistent()
            .set(&DataKey::Commitment(commitment.clone()), &env.ledger().sequence());
        env.events().publish(
            (Symbol::new(&env, "verified"),),
            (commitment.clone(), mode_tag(&env)),
        );
        Ok(commitment)
    }

    /// True if a previously-verified commitment exists (used by PiDEX AMM
    /// PiRC-800 shielded-settlement hook).
    pub fn has_commitment(env: Env, commitment: BytesN<32>) -> bool {
        env.storage().persistent().has(&DataKey::Commitment(commitment))
    }

    pub fn mode(env: Env) -> Symbol { mode_tag(&env) }

    // ---- internals ----

    fn only_admin(env: &Env) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();
        Ok(())
    }

    #[cfg(feature = "bn254")]
    fn run_verify(
        _env: &Env,
        _proof: &Bytes,
        _public_inputs: &Vec<Bytes>,
        _attestation: &Bytes,
        _commitment: &BytesN<32>,
    ) -> Result<(), Error> {
        // Fail closed: this repository does not yet bind a real Soroban
        // BN254 pairing host function. Never return success from a stub.
        Err(Error::HostFunctionUnavailable)
    }

    #[cfg(not(feature = "bn254"))]
    fn run_verify(
        env: &Env,
        proof: &Bytes,
        public_inputs: &Vec<Bytes>,
        attestation: &Bytes,
        commitment: &BytesN<32>,
    ) -> Result<(), Error> {
        // Commitment mode: trust the off-chain verifier's Ed25519 signature
        // over the exact domain-separated commitment returned to consumers.
        let attestor: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::Attestor)
            .ok_or(Error::AttestorMissing)?;

        let digest = commitment.to_bytes();

        // Reject malformed signatures before invoking the cryptographic host function.
        if attestation.len() != 64 {
            return Err(Error::BadAttestation);
        }
        let sig: BytesN<64> = attestation
            .clone()
            .try_into()
            .map_err(|_| Error::BadAttestation)?;
        env.crypto()
            .ed25519_verify(&attestor, &digest.to_bytes(), &sig);
        Ok(())
    }
}

fn commitment_hash(env: &Env, proof: &Bytes, public_inputs: &Vec<Bytes>) -> BytesN<32> {
    // Domain separation and length prefixes prevent ambiguous concatenations.
    let mut buf = Bytes::from_slice(env, b"PiRC-800:COMMITMENT:v1");
    let proof_len = proof.len().to_be_bytes();
    buf.append(&Bytes::from_slice(env, &proof_len));
    buf.append(proof);
    for input in public_inputs.iter() {
        let input_len = input.len().to_be_bytes();
        buf.append(&Bytes::from_slice(env, &input_len));
        buf.append(&input);
    }
    env.crypto().sha256(&buf).to_bytes()
}

fn mode_tag(env: &Env) -> Symbol {
    #[cfg(feature = "bn254")]
    { Symbol::new(env, "bn254_unavailable") }
    #[cfg(not(feature = "bn254"))]
    { Symbol::new(env, "commitment") }
}



#[cfg(test)]
mod test {
    use super::{Bn254Verifier, Bn254VerifierClient, Error};
    use soroban_sdk::{testutils::Address as _, Address, Bytes, BytesN, Env, Vec};

    #[test]
    fn commitment_mode_rejects_missing_attestation_without_requiring_vk() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register(Bn254Verifier, ());
        let client = Bn254VerifierClient::new(&env, &id);
        let admin = Address::generate(&env);
        let attestor = BytesN::from_array(&env, &[6u8; 32]);
        client.initialize(&admin, &attestor).unwrap();
        let proof = Bytes::from_slice(&env, b"proof");
        let mut inputs = Vec::new(&env);
        inputs.push_back(Bytes::from_slice(&env, b"public-input"));
        let empty_attestation = Bytes::new(&env);
        assert_eq!(client.verify(&proof, &inputs, &empty_attestation), Err(Error::BadAttestation));
    }

    #[cfg(feature = "bn254")]
    #[test]
    fn bn254_feature_fails_closed_until_host_function_is_implemented() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register(Bn254Verifier, ());
        let client = Bn254VerifierClient::new(&env, &id);
        let admin = Address::generate(&env);
        let attestor = BytesN::from_array(&env, &[7u8; 32]);
        client.initialize(&admin, &attestor).unwrap();
        client.set_vk(&Bytes::from_slice(&env, b"verification-key")).unwrap();
        let proof = Bytes::from_slice(&env, b"proof");
        let mut inputs = Vec::new(&env);
        inputs.push_back(Bytes::from_slice(&env, b"public-input"));
        assert_eq!(client.verify(&proof, &inputs, &Bytes::new(&env)), Err(Error::HostFunctionUnavailable));
    }
}
