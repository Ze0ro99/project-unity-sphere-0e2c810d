#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol, String};

#[contract]
pub struct PiDEXCore;

#[contractimpl]
impl PiDEXCore {
    /// Initializes the master contract. Layer and subscription bindings must
    /// be configured and verified before any trade path can be enabled.
    pub fn init_matrix(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&Symbol::short("ADMIN"), &admin);
    }

    /// Fail-closed until the canonical PiRC-2 subscription client is bound.
    ///
    /// The previous implementation returned true without querying PiRC-2.
    /// That demonstration stub must never authorize a live trade.
    /// PiDEX AMM execution must use the separately deployed, verified AMM
    /// contract and must not treat this placeholder as a settlement engine.
    pub fn execute_layer_trade(env: Env, caller: Address, _layer_id: String) -> bool {
        caller.require_auth();
        let _admin: Option<Address> = env.storage().instance().get(&Symbol::short("ADMIN"));
        false
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn layer_trade_is_denied_until_subscription_adapter_is_verified() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(PiDEXCore, ());
        let client = PiDEXCoreClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let caller = Address::generate(&env);

        client.init_matrix(&admin);
        let allowed = client.execute_layer_trade(
            &caller,
            &String::from_str(&env, "L5"),
        );

        assert!(!allowed);
    }
}
