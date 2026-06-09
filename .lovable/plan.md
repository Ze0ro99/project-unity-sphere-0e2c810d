Subject: Final Build Requirements – PiRC Sovereign Portal, Live Blockchain Synchronization & Services Marketplace

&nbsp;

Thank you for the work completed so far. The Resources, Alpha Hub, Sovereign Portal, Professional Live Dashboard, Pi Authentication, Pi Payments, repository synchronization, standards integration, and smart contract registry additions are aligned with the project direction.

&nbsp;

Please proceed with the next implementation phase using the following requirements as the authoritative specification.

&nbsp;

1. Pi Network Compliance

&nbsp;

Ensure all authentication, wallet, payment, and account functionality strictly follows the official Pi SDK and Pi Platform requirements.

&nbsp;

Authentication must support:

&nbsp;

* username

* payments

* wallet_address

&nbsp;

Wallet functionality must display:

&nbsp;

* Authenticated wallet address

* Live balance

* Transaction history

* Payment status

* Confirmation status

&nbsp;

All payment operations must continue to use the official Pi SDK payment flow.

&nbsp;

No custom custodial wallet functionality should be introduced.

&nbsp;

Server-side verification must be used for all payment confirmations and account validation.

&nbsp;

2. Live Blockchain Synchronization

&nbsp;

Implement real-time synchronization across:

&nbsp;

* Pi Mainnet

* Pi Testnet 1

* Pi Testnet 2

&nbsp;

The dashboard must continuously synchronize and display:

&nbsp;

* Ledger height

* Recent transactions

* Account balances

* Network status

* Transaction confirmations

* Block information

* Payment verification status

&nbsp;

All network data should refresh automatically and remain synchronized with Horizon endpoints.

&nbsp;

3. Vanguard-Style Professional Dashboard

&nbsp;

The dashboard should operate similarly to institutional investment platforms.

&nbsp;

Required indicators include:

&nbsp;

* Wallet Balance

* Purchasing Power

* Market Value

* Portfolio Value

* Active Services

* Pending Services

* Network Status

* Ledger Height

* Transaction Volume

* Service Utilization

* Sovereign Portal Statistics

* Smart Contract Statistics

* PiRC Standards Statistics

* Fairness Index Indicators

* Justice Layer Indicators

&nbsp;

Purchasing Power must calculate dynamically from:

&nbsp;

Current Pi Balance × Current Market Value

&nbsp;

and update automatically as market data changes.

&nbsp;

4. Market Data and Japanese Candlesticks

&nbsp;

Install and integrate professional TradingView-style Japanese candlestick charts.

&nbsp;

Required:

&nbsp;

* 1D

* 7D

* 30D

* 90D

* 1Y

&nbsp;

Display:

&nbsp;

* Open

* High

* Low

* Close

* Volume

&nbsp;

Include exchange aggregation and ticker monitoring where available.

&nbsp;

All charts should update automatically.

&nbsp;

5. Repository Synchronization

&nbsp;

Continue live synchronization from the PiRC repository.

&nbsp;

Synchronize:

&nbsp;

* Standards

* Smart Contracts

* Registries

* Governance Documents

* Manifest Files

* Matrix Files

* Sovereign Data

&nbsp;

The application should automatically detect updates and refresh without requiring redeployment.

&nbsp;

6. Service Marketplace

&nbsp;

Implement a fully operational service marketplace integrated into the Sovereign Portal.

&nbsp;

Users must be able to:

&nbsp;

* Select a service

* Enter their application URL

* Select a duration

* Submit payment

* Receive activation automatically

&nbsp;

Services should include:

&nbsp;

24-Hour Test Hosting

Price: 0.0003 π

Duration: 24 Hours

&nbsp;

Integration Review

Price: 0.05 π

&nbsp;

Application Integration Slot

Price: 1 π

Duration: 30 Days

&nbsp;

Sovereign Endpoint Access

Price: 5 π

Duration: 30 Days

&nbsp;

Premium Monitoring

Price: 10 π

Duration: 30 Days

&nbsp;

Custom Service

Minimum: 0.0003 π

User-defined amount

&nbsp;

7. Payment Activation Workflow

&nbsp;

The marketplace must function as follows:

&nbsp;

* User submits request

* User enters application URL

* System creates order

* System generates unique payment reference

* System provides payment instructions

* Payment is verified on-chain

* Service activates automatically

* Activation period is tracked

* Service expires automatically when duration ends

&nbsp;

Use a secure payment-reference architecture.

&nbsp;

Do not generate or store private keys.

&nbsp;

Do not request wallet credentials from users.

&nbsp;

8. Service Activation Requirements

&nbsp;

When payment is confirmed:

&nbsp;

* Hosting services activate

* Monitoring services activate

* Integration services activate

* Endpoint services activate

&nbsp;

The dashboard must display:

&nbsp;

* Service status

* Activation date

* Expiration date

* Payment transaction ID

* Current state

&nbsp;

Users must only receive services they have paid for.

&nbsp;

9. Database and Audit Controls

&nbsp;

Implement:

&nbsp;

* Service Orders

* Payment Audit Logs

* Transaction History

* Activation History

* Service Status Tracking

&nbsp;

All actions should be auditable.

&nbsp;

10. UI and Stability Review

&nbsp;

Before final delivery:

&nbsp;

* Verify every navigation item

* Verify every button

* Verify every route

* Verify every dashboard widget

* Verify every service workflow

* Verify wallet functionality

* Verify payment functionality

* Verify mobile responsiveness

* Verify localization support

&nbsp;

No dead links, broken actions, hydration errors, or missing translations should remain.

&nbsp;

11. Final Objective

&nbsp;

The final system should function as a production-grade PiRC Sovereign Portal with:

&nbsp;

* Live blockchain synchronization

* Professional financial dashboard

* Real-time purchasing power calculations

* Japanese candlestick market analysis

* Repository synchronization

* Pi SDK authentication

* Pi SDK payments

* Service marketplace

* Automated service activation

* Multi-network support (Mainnet, Testnet1, Testnet2)

* Full PiRC standards and smart contract integration

&nbsp;

Please proceed with implementation using these requirements as the final build specification and provide a completion report once all modules are operational and tested.  Your implementation plan is strong, but before development I would make several adjustments to ensure it is compliant with Pi SDK expectations, scalable, and aligned with the behavior users expect from investment-style dashboards such as Vanguard.

&nbsp;

## Recommended Responses to the Four Questions

&nbsp;

### 1. Lovable Cloud / Supabase

&nbsp;

**Answer: YES**

&nbsp;

The marketplace, order tracking, payment verification, activation lifecycle, and RLS policies require persistent backend storage.

&nbsp;

Recommended architecture:

&nbsp;

* Supabase Auth

* Supabase Postgres

* Row Level Security

* Edge Functions for payment verification

* Audit logging table

* Payment verification history table

&nbsp;

Do not rely solely on client-side polling for payment verification.

&nbsp;

---

&nbsp;

### 2. Receiving Account

&nbsp;

**Answer: Use the provided application wallet**

&nbsp;

Application wallet:

&nbsp;

```text

GD6HJ6WAXF4I7EW7M3SHOKRALOOPSSYSNVLCJ66PBFZRBZKYMPQFNMP4

```

&nbsp;

Recommendations:

&nbsp;

* Development → Pi Testnet

* Production → Pi Mainnet

* Same architecture across both networks

* Memo-based order tracking is appropriate

* Never generate private keys server-side

* Never request wallet passphrases from users

&nbsp;

The wallet address should be stored as:

&nbsp;

```env

VITE_PI_RECEIVER_ADDRESS=GD6HJ6WAXF4I7EW7M3SHOKRALOOPSSYSNVLCJ66PBFZRBZKYMPQFNMP4

```

&nbsp;

Pi Wallet ownership remains entirely with the operator. Pi wallets are non-custodial and users should only transact through the official Pi Wallet flow. ([Pi Network][1])

&nbsp;

---

&nbsp;

### 3. Charts

&nbsp;

**Answer: YES**

&nbsp;

Install:

&nbsp;

```bash

npm install lightweight-charts

```

&nbsp;

This is the correct choice.

&nbsp;

Benefits:

&nbsp;

* TradingView engine

* Lightweight

* Fast rendering

* Professional candlesticks

* Volume overlays

* Mobile-friendly

&nbsp;

---

&nbsp;

### 4. Network Default

&nbsp;

**Answer: Testnet by default**

&nbsp;

Recommended:

&nbsp;

```text

Default: Testnet

Optional: Mainnet Switch

```

&nbsp;

Reason:

&nbsp;

* Prevent accidental real Pi transfers

* Easier QA

* Safer for new users

* Faster debugging

&nbsp;

For production release:

&nbsp;

```text

Admin configurable:

TESTNET

TESTNET2

MAINNET

```

&nbsp;

stored in environment variables.

&nbsp;

---

&nbsp;

# Additional Corrections Before Build

&nbsp;

## A. Pi SDK Authentication

&nbsp;

The authentication scope should include:

&nbsp;

```ts

const scopes = [

  "username",

  "payments",

  "wallet_address"

];

```

&nbsp;

Pi officially supports the `wallet_address` scope for retrieving the authenticated user's wallet address. ([GitHub][2])

&nbsp;

The returned user object should contain:

&nbsp;

```ts

auth.user.uid

auth.user.username

auth.user.wallet_address

```

&nbsp;

when permissions are granted. ([GitHub][2])

&nbsp;

---

&nbsp;

## B. Payment Flow Compliance

&nbsp;

Keep:

&nbsp;

```ts

Pi.createPayment()

```

&nbsp;

Do not build a custom wallet transfer interface.

&nbsp;

Users should:

&nbsp;

1. Click Purchase

2. Pi Wallet opens

3. User signs

4. SDK returns transaction

5. Server verifies

6. Server completes payment

&nbsp;

This follows the documented Pi payment flow. ([pi-apps.github.io][3])

&nbsp;

---

&nbsp;

## C. Vanguard-Style Purchasing Power Engine

&nbsp;

For the dashboard, add three separate metrics.

&nbsp;

### Wallet Balance

&nbsp;

```text

Current Pi balance

```

&nbsp;

### Purchasing Power

&nbsp;

```text

Pi Balance × Current Market Price

```

&nbsp;

Example:

&nbsp;

```text

100 Pi × $0.60 = $60

```

&nbsp;

### Service Capacity

&nbsp;

How many services the balance can purchase.

&nbsp;

Example:

&nbsp;

```text

100 Pi ÷ 0.0003

=

333,333 Test Hosting Activations

```

&nbsp;

This is much closer to the portfolio and buying-power concepts used by investment dashboards.

&nbsp;

---

&nbsp;

## D. Service Pricing Review

&nbsp;

The proposed pricing is mostly logical.

&nbsp;

Recommended catalog:

&nbsp;

| Service              |    Price (π) | Duration |

| -------------------- | -----------: | -------- |

| 24h Test Hosting     |       0.0003 | 24h      |

| Integration Review   |         0.05 | One-time |

| App Integration Slot |          1.0 | 30d      |

| Sovereign Endpoint   |          5.0 | 30d      |

| Premium Monitoring   |         10.0 | 30d      |

| Custom               | User Defined | Variable |

&nbsp;

The 0.0003 π entry works well as a low-friction onboarding service.

&nbsp;

---

&nbsp;

## E. Real-Time Blockchain Synchronization

&nbsp;

The proposed Horizon integration is correct.

&nbsp;

Recommended refresh:

&nbsp;

```text

Network status: 10s

Ledgers: 10s

Transactions: 10s

Account balance: 5s

```

&nbsp;

Dashboard cards:

&nbsp;

* Latest Ledger

* Network Status

* Transactions

* Wallet Balance

* Purchasing Power

* Active Services

* Pending Orders

&nbsp;

---

&nbsp;

## F. Security Requirements

&nbsp;

Before release:

&nbsp;

### Server Side

&nbsp;

* Verify every payment server-side

* Verify txid against Horizon

* Validate memo

* Prevent duplicate activations

* Rate limit order creation

&nbsp;

### Database

&nbsp;

Add:

&nbsp;

```sql

payment_audit_log

```

&nbsp;

and

&nbsp;

```sql

service_payment_events

```

&nbsp;

for traceability.

&nbsp;

### Frontend

&nbsp;

Never expose:

&nbsp;

* Access tokens

* Service role keys

* Wallet secrets

* API secrets

&nbsp;

---

&nbsp;

# Final Build Decision

&nbsp;

I would proceed with:

&nbsp;

✅ Lovable Cloud enabled

✅ Provided wallet address as receiver account

✅ `lightweight-charts` installed

✅ Testnet as default network

✅ Pi SDK scopes: `username`, `payments`, `wallet_address`

✅ Memo-based service order tracking

✅ Real-time Horizon synchronization

✅ Vanguard-style purchasing power calculations

✅ Supabase RLS + audit logging

✅ Server-side payment verification before activation

&nbsp;

This configuration is aligned with current Pi SDK authentication and payment requirements while providing the real-time portfolio-style experience you want. ([GitHub][2])

&nbsp;

[1]: https://minepi.com/support/?utm_source=chatgpt.com "FAQ and Support | Pi Network"

[2]: https://github.com/pi-apps/pi-platform-docs/blob/master/SDK_reference.md?utm_source=chatgpt.com "pi-platform-docs/SDK_reference.md at master · pi-apps/pi-platform-docs · GitHub"

[3]: https://pi-apps.github.io/community-developer-guide/docs/importantTopics/paymentFlow/?utm_source=chatgpt.com "Pi Payments | Pi Developer Guide"

&nbsp;

&nbsp;