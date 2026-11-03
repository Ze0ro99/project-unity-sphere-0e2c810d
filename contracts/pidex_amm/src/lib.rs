#![no_std]
//! PiDEX constant-product AMM reference.
//! This implementation is transparent. A verified commitment can gate a swap,
//! but does not hide the swap amount, assets, addresses or resulting transfers.

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, symbol_short,
    token, Address, BytesN, Env,
};

const FEE_BPS: i128 = 30;
const BPS_DENOM: i128 = 10_000;

#[contractclient(name = "VerifierClient")]
pub trait VerifierInterface {
    fn has_commitment(env: Env, commitment: BytesN<32>) -> bool;
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    TokenA,
    TokenB,
    ReserveA,
    ReserveB,
    TotalShares,
    Shares(Address),
    Paused,
    ZkVerifier,
}

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    Paused = 4,
    ZeroAmount = 5,
    InsufficientLiquidity = 6,
    SlippageExceeded = 7,
    Overflow = 8,
    InvariantViolation = 9,
    InvalidAssetPair = 10,
    VerifierNotConfigured = 11,
    InvalidProof = 12,
}

#[contract]
pub struct PidexAmm;

#[contractimpl]
impl PidexAmm {
    pub fn initialize(env: Env, admin: Address, token_a: Address, token_b: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        if token_a == token_b {
            return Err(Error::InvalidAssetPair);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokenA, &token_a);
        env.storage().instance().set(&DataKey::TokenB, &token_b);
        env.storage().instance().set(&DataKey::ReserveA, &0i128);
        env.storage().instance().set(&DataKey::ReserveB, &0i128);
        env.storage().instance().set(&DataKey::TotalShares, &0i128);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.events().publish((symbol_short!("pidex"), symbol_short!("init")), (token_a, token_b));
        Ok(())
    }

    pub fn set_zk_verifier(env: Env, verifier: Address) -> Result<(), Error> {
        Self::only_admin(&env)?;
        env.storage().instance().set(&DataKey::ZkVerifier, &verifier);
        env.events().publish((symbol_short!("pidex"), symbol_short!("verifier")), verifier);
        Ok(())
    }

    pub fn pause(env: Env, paused: bool) -> Result<(), Error> {
        Self::only_admin(&env)?;
        env.storage().instance().set(&DataKey::Paused, &paused);
        env.events().publish((symbol_short!("pidex"), symbol_short!("pause")), paused);
        Ok(())
    }

    /// Amounts are maximum inputs. For an existing pool, only the ratio-matched
    /// amounts are transferred; excess amounts remain in the provider wallet.
    pub fn deposit(env: Env, from: Address, amount_a: i128, amount_b: i128) -> Result<i128, Error> {
        Self::not_paused(&env)?;
        from.require_auth();
        if amount_a <= 0 || amount_b <= 0 {
            return Err(Error::ZeroAmount);
        }

        let (ra, rb, total) = Self::reserves(&env);
        let (token_a, token_b) = Self::tokens(&env)?;

        let (used_a, used_b) = if total == 0 {
            if ra != 0 || rb != 0 {
                return Err(Error::InvariantViolation);
            }
            (amount_a, amount_b)
        } else {
            if ra <= 0 || rb <= 0 {
                return Err(Error::InvariantViolation);
            }
            let optimal_b = amount_a.checked_mul(rb).ok_or(Error::Overflow)? / ra;
            if optimal_b > 0 && optimal_b <= amount_b {
                (amount_a, optimal_b)
            } else {
                let optimal_a = amount_b.checked_mul(ra).ok_or(Error::Overflow)? / rb;
                (optimal_a, amount_b)
            }
        };

        if used_a <= 0 || used_b <= 0 {
            return Err(Error::ZeroAmount);
        }

        let minted = if total == 0 {
            isqrt(used_a.checked_mul(used_b).ok_or(Error::Overflow)?)
        } else {
            let shares_a = used_a.checked_mul(total).ok_or(Error::Overflow)? / ra;
            let shares_b = used_b.checked_mul(total).ok_or(Error::Overflow)? / rb;
            shares_a.min(shares_b)
        };
        if minted <= 0 {
            return Err(Error::InsufficientLiquidity);
        }

        let next_ra = ra.checked_add(used_a).ok_or(Error::Overflow)?;
        let next_rb = rb.checked_add(used_b).ok_or(Error::Overflow)?;
        let next_total = total.checked_add(minted).ok_or(Error::Overflow)?;

        token::Client::new(&env, &token_a).transfer(&from, &env.current_contract_address(), &used_a);
        token::Client::new(&env, &token_b).transfer(&from, &env.current_contract_address(), &used_b);

        Self::set_reserves(&env, next_ra, next_rb, next_total);
        Self::add_shares(&env, &from, minted)?;
        env.events().publish(
            (symbol_short!("pidex"), symbol_short!("deposit")),
            (from, used_a, used_b, minted),
        );
        Ok(minted)
    }

    pub fn withdraw(env: Env, to: Address, shares: i128) -> Result<(i128, i128), Error> {
        Self::not_paused(&env)?;
        to.require_auth();
        if shares <= 0 {
            return Err(Error::ZeroAmount);
        }

        let (ra, rb, total) = Self::reserves(&env);
        if total <= 0 || shares > total || ra <= 0 || rb <= 0 {
            return Err(Error::InsufficientLiquidity);
        }

        let out_a = shares.checked_mul(ra).ok_or(Error::Overflow)? / total;
        let out_b = shares.checked_mul(rb).ok_or(Error::Overflow)? / total;
        if out_a <= 0 || out_b <= 0 {
            return Err(Error::ZeroAmount);
        }

        let next_ra = ra.checked_sub(out_a).ok_or(Error::Overflow)?;
        let next_rb = rb.checked_sub(out_b).ok_or(Error::Overflow)?;
        let next_total = total.checked_sub(shares).ok_or(Error::Overflow)?;
        Self::sub_shares(&env, &to, shares)?;
        Self::set_reserves(&env, next_ra, next_rb, next_total);

        let (token_a, token_b) = Self::tokens(&env)?;
        token::Client::new(&env, &token_a).transfer(&env.current_contract_address(), &to, &out_a);
        token::Client::new(&env, &token_b).transfer(&env.current_contract_address(), &to, &out_b);
        env.events().publish(
            (symbol_short!("pidex"), symbol_short!("withdraw")),
            (to, shares, out_a, out_b),
        );
        Ok((out_a, out_b))
    }

    /// Transparent constant-product swap with 30 bps fee and min_out protection.
    pub fn swap(
        env: Env,
        from: Address,
        a_to_b: bool,
        amount_in: i128,
        min_out: i128,
    ) -> Result<i128, Error> {
        Self::not_paused(&env)?;
        from.require_auth();
        if amount_in <= 0 || min_out < 0 {
            return Err(Error::ZeroAmount);
        }

        let (ra, rb, total) = Self::reserves(&env);
        if total <= 0 || ra <= 0 || rb <= 0 {
            return Err(Error::InsufficientLiquidity);
        }

        let (reserve_in, reserve_out) = if a_to_b { (ra, rb) } else { (rb, ra) };
        let amount_in_after_fee = amount_in
            .checked_mul(BPS_DENOM - FEE_BPS)
            .ok_or(Error::Overflow)? / BPS_DENOM;
        if amount_in_after_fee <= 0 {
            return Err(Error::ZeroAmount);
        }

        let numerator = reserve_in.checked_mul(reserve_out).ok_or(Error::Overflow)?;
        let denominator = reserve_in.checked_add(amount_in_after_fee).ok_or(Error::Overflow)?;
        let amount_out = reserve_out.checked_sub(numerator / denominator).ok_or(Error::Overflow)?;
        if amount_out <= 0 {
            return Err(Error::InsufficientLiquidity);
        }
        if amount_out < min_out {
            return Err(Error::SlippageExceeded);
        }

        let (token_a, token_b) = Self::tokens(&env)?;
        let (token_in, token_out) = if a_to_b { (token_a, token_b) } else { (token_b, token_a) };
        let (next_ra, next_rb) = if a_to_b {
            (
                ra.checked_add(amount_in).ok_or(Error::Overflow)?,
                rb.checked_sub(amount_out).ok_or(Error::Overflow)?,
            )
        } else {
            (
                ra.checked_sub(amount_out).ok_or(Error::Overflow)?,
                rb.checked_add(amount_in).ok_or(Error::Overflow)?,
            )
        };

        let old_k = ra.checked_mul(rb).ok_or(Error::Overflow)?;
        let new_k = next_ra.checked_mul(next_rb).ok_or(Error::Overflow)?;
        if new_k < old_k {
            return Err(Error::InvariantViolation);
        }

        token::Client::new(&env, &token_in).transfer(&from, &env.current_contract_address(), &amount_in);
        token::Client::new(&env, &token_out).transfer(&env.current_contract_address(), &from, &amount_out);
        Self::set_reserves(&env, next_ra, next_rb, total);
        env.events().publish(
            (symbol_short!("pidex"), symbol_short!("swap")),
            (from, a_to_b, amount_in, amount_out),
        );
        Ok(amount_out)
    }

    /// A previously verified commitment can authorize a normal transparent
    /// swap. This is not shielded settlement: amounts and transfers remain public.
    pub fn swap_with_verified_commitment(
        env: Env,
        from: Address,
        a_to_b: bool,
        amount_in: i128,
        min_out: i128,
        commitment: BytesN<32>,
    ) -> Result<i128, Error> {
        let verifier: Address = env.storage().instance().get(&DataKey::ZkVerifier)
            .ok_or(Error::VerifierNotConfigured)?;
        let verified = VerifierClient::new(&env, &verifier).has_commitment(&commitment);
        if !verified {
            return Err(Error::InvalidProof);
        }
        Self::swap(env, from, a_to_b, amount_in, min_out)
    }

    pub fn get_reserves(env: Env) -> (i128, i128, i128) {
        Self::reserves(&env)
    }

    pub fn shares_of(env: Env, who: Address) -> i128 {
        env.storage().persistent().get(&DataKey::Shares(who)).unwrap_or(0)
    }

    fn only_admin(env: &Env) -> Result<(), Error> {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).ok_or(Error::NotInitialized)?;
        admin.require_auth();
        Ok(())
    }

    fn not_paused(env: &Env) -> Result<(), Error> {
        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }
        let paused: bool = env.storage().instance().get(&DataKey::Paused).unwrap_or(false);
        if paused { Err(Error::Paused) } else { Ok(()) }
    }

    fn reserves(env: &Env) -> (i128, i128, i128) {
        (
            env.storage().instance().get(&DataKey::ReserveA).unwrap_or(0),
            env.storage().instance().get(&DataKey::ReserveB).unwrap_or(0),
            env.storage().instance().get(&DataKey::TotalShares).unwrap_or(0),
        )
    }

    fn set_reserves(env: &Env, a: i128, b: i128, total: i128) {
        env.storage().instance().set(&DataKey::ReserveA, &a);
        env.storage().instance().set(&DataKey::ReserveB, &b);
        env.storage().instance().set(&DataKey::TotalShares, &total);
    }

    fn tokens(env: &Env) -> Result<(Address, Address), Error> {
        let token_a: Address = env.storage().instance().get(&DataKey::TokenA).ok_or(Error::NotInitialized)?;
        let token_b: Address = env.storage().instance().get(&DataKey::TokenB).ok_or(Error::NotInitialized)?;
        Ok((token_a, token_b))
    }

    fn add_shares(env: &Env, who: &Address, delta: i128) -> Result<(), Error> {
        let current: i128 = env.storage().persistent().get(&DataKey::Shares(who.clone())).unwrap_or(0);
        let next = current.checked_add(delta).ok_or(Error::Overflow)?;
        env.storage().persistent().set(&DataKey::Shares(who.clone()), &next);
        Ok(())
    }

    fn sub_shares(env: &Env, who: &Address, delta: i128) -> Result<(), Error> {
        let current: i128 = env.storage().persistent().get(&DataKey::Shares(who.clone())).unwrap_or(0);
        if current < delta {
            return Err(Error::InsufficientLiquidity);
        }
        let next = current.checked_sub(delta).ok_or(Error::Overflow)?;
        env.storage().persistent().set(&DataKey::Shares(who.clone()), &next);
        Ok(())
    }
}

fn isqrt(n: i128) -> i128 {
    if n <= 0 {
        return 0;
    }
    let mut low = 1i128;
    let mut high = n / 2 + 1;
    let mut answer = 0i128;
    while low <= high {
        let mid = low + (high - low) / 2;
        if mid <= n / mid {
            answer = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    answer
}

#[cfg(test)]
mod test {
    use super::{isqrt, Error, PidexAmm, PidexAmmClient};
    use soroban_sdk::{contract, contractimpl, testutils::Address as _, Address, BytesN, Env};

    #[contract]
    pub struct RejectingVerifier;

    #[contractimpl]
    impl RejectingVerifier {
        pub fn has_commitment(_env: Env, _commitment: BytesN<32>) -> bool {
            false
        }
    }

    #[test]
    fn integer_square_root_is_bounded_and_correct() {
        assert_eq!(isqrt(0), 0);
        assert_eq!(isqrt(1), 1);
        assert_eq!(isqrt(2), 1);
        assert_eq!(isqrt(15), 3);
        assert_eq!(isqrt(16), 4);
        assert_eq!(isqrt(17), 4);
    }

    #[test]
    fn proof_gated_swap_fails_without_verifier() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register(PidexAmm, ());
        let client = PidexAmmClient::new(&env, &id);
        let from = Address::generate(&env);
        let commitment = BytesN::from_array(&env, &[1u8; 32]);
        assert_eq!(
            client.swap_with_verified_commitment(&from, &true, &100, &1, &commitment),
            Err(Error::VerifierNotConfigured)
        );
    }

    #[test]
    fn unrecognized_commitment_is_rejected_before_swap() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register(PidexAmm, ());
        let client = PidexAmmClient::new(&env, &id);
        let admin = Address::generate(&env);
        let token_a = Address::generate(&env);
        let token_b = Address::generate(&env);
        let verifier = env.register(RejectingVerifier, ());
        let commitment = BytesN::from_array(&env, &[2u8; 32]);
        client.initialize(&admin, &token_a, &token_b).unwrap();
        client.set_zk_verifier(&verifier).unwrap();
        assert_eq!(
            client.swap_with_verified_commitment(&Address::generate(&env), &true, &100, &1, &commitment),
            Err(Error::InvalidProof)
        );
    }
}
