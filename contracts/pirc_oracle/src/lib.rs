#![no_std]
//! PiRC-214 — Sovereign Oracle (Soroban)
//!
//! Median aggregation across authorised reporters with heartbeat staleness and
//! deviation quorum, mirroring `contracts/chainlink_consumer` semantics so the
//! Stellar/Soroban side of PiDEX consumes identical purchasing-power data.

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, Symbol, Vec};

const ADMIN: Symbol = symbol_short!("ADMIN");
const REPORTERS: Symbol = symbol_short!("REPS");

use soroban_sdk::symbol_short;

#[contracttype]
#[derive(Clone)]
pub struct Report {
    pub reporter: Address,
    pub price: i128,   // 7 decimals (stroop-like)
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct FeedConfig {
    pub heartbeat: u64,
    pub max_deviation_bps: u32,
    pub min_sources: u32,
    pub weight_bps: u32,
    pub ref_price: i128,
}

#[contracttype]
pub enum DataKey {
    Config(Symbol),
    Reports(Symbol),
    Feeds,
}

#[contracterror]
#[derive(Copy, Clone, PartialEq, Eq, Debug)]
#[repr(u32)]
pub enum Error {
    NotAuthorized = 1,
    UnknownFeed = 2,
    Stale = 3,
    NoQuorum = 4,
    BadPrice = 5,
}

#[contract]
pub struct PircOracle;

#[contractimpl]
impl PircOracle {
    pub fn init(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&REPORTERS, &Vec::<Address>::new(&env));
    }

    fn admin(env: &Env) -> Result<Address, Error> {
        env.storage().instance().get(&ADMIN).ok_or(Error::NotAuthorized)
    }

    pub fn add_reporter(env: Env, reporter: Address) -> Result<(), Error> {
        let admin = Self::admin(&env)?;
        admin.require_auth();
        let mut reps: Vec<Address> = env.storage().instance().get(&REPORTERS).unwrap_or(Vec::new(&env));
        if !reps.contains(&reporter) {
            reps.push_back(reporter);
            env.storage().instance().set(&REPORTERS, &reps);
        }
        Ok(())
    }

    pub fn set_feed(env: Env, feed: Symbol, cfg: FeedConfig) -> Result<(), Error> {
        let admin = Self::admin(&env)?;
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Config(feed.clone()), &cfg);
        let mut feeds: Vec<Symbol> = env.storage().persistent().get(&DataKey::Feeds).unwrap_or(Vec::new(&env));
        if !feeds.contains(&feed) {
            feeds.push_back(feed);
            env.storage().persistent().set(&DataKey::Feeds, &feeds);
        }
        Ok(())
    }

    /// Submit a signed price observation for `feed`.
    pub fn report(env: Env, feed: Symbol, reporter: Address, price: i128) -> Result<(), Error> {
        reporter.require_auth();
        if price <= 0 {
            return Err(Error::BadPrice);
        }
        let reps: Vec<Address> = env.storage().instance().get(&REPORTERS).unwrap_or(Vec::new(&env));
        if !reps.contains(&reporter) {
            return Err(Error::NotAuthorized);
        }
        if !env.storage().persistent().has(&DataKey::Config(feed.clone())) {
            return Err(Error::UnknownFeed);
        }
        let now = env.ledger().timestamp();
        let key = DataKey::Reports(feed);
        let mut reports: Vec<Report> = env.storage().persistent().get(&key).unwrap_or(Vec::new(&env));
        let mut replaced = false;
        for i in 0..reports.len() {
            let r = reports.get(i).unwrap();
            if r.reporter == reporter {
                reports.set(i, Report { reporter: reporter.clone(), price, timestamp: now });
                replaced = true;
                break;
            }
        }
        if !replaced {
            reports.push_back(Report { reporter, price, timestamp: now });
        }
        env.storage().persistent().set(&key, &reports);
        Ok(())
    }

    /// Median of fresh reports, enforcing quorum and deviation bounds.
    pub fn latest(env: Env, feed: Symbol) -> Result<i128, Error> {
        let cfg: FeedConfig = env
            .storage()
            .persistent()
            .get(&DataKey::Config(feed.clone()))
            .ok_or(Error::UnknownFeed)?;
        let reports: Vec<Report> = env
            .storage()
            .persistent()
            .get(&DataKey::Reports(feed))
            .unwrap_or(Vec::new(&env));
        let now = env.ledger().timestamp();

        let mut fresh: Vec<i128> = Vec::new(&env);
        for r in reports.iter() {
            if now.saturating_sub(r.timestamp) <= cfg.heartbeat {
                fresh.push_back(r.price);
            }
        }
        if (fresh.len() as u32) < cfg.min_sources {
            return Err(Error::NoQuorum);
        }

        // insertion sort (small n)
        let mut sorted: Vec<i128> = Vec::new(&env);
        for v in fresh.iter() {
            let mut idx = sorted.len();
            for i in 0..sorted.len() {
                if v < sorted.get(i).unwrap() {
                    idx = i;
                    break;
                }
            }
            sorted.insert(idx, v);
        }
        let n = sorted.len();
        let median = if n % 2 == 1 {
            sorted.get(n / 2).unwrap()
        } else {
            (sorted.get(n / 2 - 1).unwrap() + sorted.get(n / 2).unwrap()) / 2
        };

        for v in sorted.iter() {
            let diff = (v - median).abs();
            let dev_bps = (diff.saturating_mul(10_000)) / median.max(1);
            if dev_bps > cfg.max_deviation_bps as i128 {
                return Err(Error::NoQuorum);
            }
        }
        Ok(median)
    }

    /// Weighted purchasing-power index scaled by 1e7 (1e7 == genesis basket).
    pub fn ppi(env: Env) -> Result<i128, Error> {
        let feeds: Vec<Symbol> = env.storage().persistent().get(&DataKey::Feeds).unwrap_or(Vec::new(&env));
        let mut acc: i128 = 0;
        let mut wsum: i128 = 0;
        for f in feeds.iter() {
            let cfg: FeedConfig = match env.storage().persistent().get(&DataKey::Config(f.clone())) {
                Some(c) => c,
                None => continue,
            };
            if cfg.weight_bps == 0 || cfg.ref_price <= 0 {
                continue;
            }
            if let Ok(px) = Self::latest(env.clone(), f) {
                acc += (px * 10_000_000 / cfg.ref_price) * cfg.weight_bps as i128;
                wsum += cfg.weight_bps as i128;
            }
        }
        if wsum == 0 {
            return Err(Error::NoQuorum);
        }
        Ok(acc / wsum)
    }
}
