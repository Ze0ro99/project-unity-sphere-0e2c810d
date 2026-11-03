# PiRC-207 Seven-Layer Source Mapping

This mapping is derived from the repository's `docs/audit/PiRC-207-Token-Layer-Color-System-and-Calculation-Mechanism.md` and `assets/js/token_layers.js`. It records the proposal's labels; it does not establish a live token, market price, redeemable value, or official Pi Network standard.

| Chakra order | Color | Repository label | Role stated in source | Numeric constant | Conversion evidence |
|---:|---|---|---|---:|---|
| 1 | Red | Root / Governance | Governance and network decision-making | GOV (non-numeric) | Not specified |
| 2 | Orange | Sacral / 3141 Orange | Mid-tier utility / creative economic expression | 3141 | Not specified |
| 3 | Yellow | Solar Plexus / 31,140 Yellow | High-tier utility | 31140 | Not specified |
| 4 | Green | Heart / PiCash | General utility and daily cash layer | 3.14 | 10,000 units = 1 Pi; 1,000 units = 1 PiGCV; 1 unit = 1,000 micro |
| 5 | Blue | Throat / Banks | Banking and institutional layer | 314 | 10,000 units = 1 Pi; 1,000 units = 1 PiGCV; 1 unit = 1,000 micro |
| 6 | Indigo | Third Eye / Premium Reserve | Premium / strategic reserve layer | 314159 | Not specified |
| 7 | Purple | Crown / Mined Pi | Main mined currency and fractions | 1 | 10,000,000 micro = 1 Pi |

## Registry reconciliation issue

The repository's `LIVE_MATRIX_REGISTRY.csv` instead lists Purple, Gold, Yellow, Orange, Blue, Green and Red as L0-L6. Gold has no corresponding chakra entry in the seven-layer JavaScript proposal; Indigo has no corresponding contract ID in that CSV. The contract registry and chakra taxonomy therefore cannot be joined by array position or color alone.

Required resolution: create a versioned mapping proposal with explicit semantic IDs, token contract IDs, issuer identity, network, decimals, units, logo URI, and status evidence. Do not silently rename Gold to Indigo or invent an Indigo contract.

## Economic and exchange constraints

- A color or symbol is a display convention, not a token price.
- The source statement “all symbols ≡ 1 Pi on CEX” must not be interpreted as guaranteed market equivalence, conversion, liquidity or redemption.
- Heart/Throat conversions are represented as exact integer micro-Pi amounts in the reference utility module. GCV units are represented as a rational ratio and are not silently equated with external USD.
- Red, Orange, Yellow and Indigo have no sufficiently specified conversion rule in the cited source and must return UNSUPPORTED until a normative proposal defines one.
- Purple is parsed as a Pi-denominated amount with seven decimal places in the reference utility module.
- The 10,000,000 micro/Pi constant is the repository's algorithm constant, not an independent statement about Pi Core Team protocol configuration.

## Verification status

All contract IDs copied from `LIVE_MATRIX_REGISTRY.csv` are marked UNVERIFIED in the new machine-readable registry until network-specific readback evidence is attached. Existing “ACTIVE” text in the source CSV is retained as a repository claim only.
