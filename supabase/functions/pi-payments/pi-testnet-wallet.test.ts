import { readPiTestnetNativeBalance } from "./pi-testnet-wallet.ts";

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function fakeFetch(responses: Response[]) {
  let calls = 0;
  const fetcher: typeof fetch = async () => {
    const next = responses[calls++];
    if (!next) throw new Error("unexpected_fetch_call");
    return next;
  };
  return { fetcher, calls: () => calls };
}

Deno.test("reads only the Pi Testnet native balance after passphrase verification", async () => {
  const address = "G" + "A".repeat(55);
  const mock = fakeFetch([
    response({ network_passphrase: "Pi Testnet" }),
    response({
      account_id: address,
      sequence: "123456789",
      last_modified_ledger: 1234,
      balances: [{ asset_type: "native", balance: "42.5000000" }],
    }),
  ]);
  const result = await readPiTestnetNativeBalance(address, mock.fetcher);
  if (result.status !== "read_only_verified") throw new Error("unexpected_status");
  if (result.native_balance !== "42.5000000") throw new Error("native_balance_mismatch");
  if (result.network_id !== "pi-testnet" || result.network_alias !== "Testnet1") throw new Error("network_label_mismatch");
  if (mock.calls() !== 2) throw new Error("unexpected_fetch_count");
});

Deno.test("reports a missing Testnet account without claiming a zero balance", async () => {
  const address = "G" + "B".repeat(55);
  const mock = fakeFetch([
    response({ network_passphrase: "Pi Testnet" }),
    response({ error: "not_found" }, 404),
  ]);
  const result = await readPiTestnetNativeBalance(address, mock.fetcher);
  if (result.status !== "account_not_found") throw new Error("missing_account_not_reported");
  if (result.native_balance !== null) throw new Error("missing_account_must_not_be_zero_balance");
});

Deno.test("fails closed when Horizon reports a different network passphrase", async () => {
  const address = "G" + "C".repeat(55);
  const mock = fakeFetch([response({ network_passphrase: "Public Global Stellar Network ; September 2015" })]);
  let rejected = false;
  try {
    await readPiTestnetNativeBalance(address, mock.fetcher);
  } catch (error) {
    rejected = String(error).includes("testnet_network_identity_unverified");
  }
  if (!rejected) throw new Error("wrong_network_was_not_rejected");
  if (mock.calls() !== 1) throw new Error("account_endpoint_called_after_network_mismatch");
});

Deno.test("does not make network requests for an invalid wallet address", async () => {
  const mock = fakeFetch([]);
  const result = await readPiTestnetNativeBalance("not-a-wallet", mock.fetcher);
  if (result.status !== "wallet_address_unavailable") throw new Error("invalid_address_not_rejected");
  if (mock.calls() !== 0) throw new Error("network_called_for_invalid_address");
});
