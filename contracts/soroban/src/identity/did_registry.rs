#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, BytesN, Env};

#[contracttype]
#[derive(Clone)]
enum DataKey {
    IdentityCommitment(Address),
}

#[contract]
pub struct DIDRegistry;

#[contractimpl]
impl DIDRegistry {
    /// Stores a user-submitted 32-byte commitment. This does not verify KYC,
    /// identity ownership beyond transaction authorization, or a ZK proof.
    pub fn register_identity_commitment(env: Env, user: Address, commitment: BytesN<32>) {
        user.require_auth();
        env.storage().persistent().set(&DataKey::IdentityCommitment(user.clone()), &commitment);
        env.events().publish((symbol_short!("did"), symbol_short!("commit")), user);
    }

    pub fn get_identity_commitment(env: Env, user: Address) -> Option<BytesN<32>> {
        env.storage().persistent().get(&DataKey::IdentityCommitment(user))
    }

    /// Reports whether a commitment is stored, not whether a person is verified.
    pub fn has_identity_commitment(env: Env, user: Address) -> bool {
        env.storage().persistent().has(&DataKey::IdentityCommitment(user))
    }
}

#[cfg(test)]
mod test {
    use super::{DIDRegistry, DIDRegistryClient};
    use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};

    #[test]
    fn user_can_store_and_read_identity_commitment() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register(DIDRegistry, ());
        let client = DIDRegistryClient::new(&env, &id);
        let user = Address::generate(&env);
        let commitment = BytesN::from_array(&env, &[8u8; 32]);
        client.register_identity_commitment(&user, &commitment);
        assert!(client.has_identity_commitment(&user));
        assert_eq!(client.get_identity_commitment(&user), Some(commitment));
    }
}
