export type PiTestnetWalletBalance = {
  status: "read_only_verified" | "account_not_found" | "wallet_address_unavailable";
  network_id: "pi-testnet";
  network_alias: "Testnet1";
  account_id?: string;
  native_balance: string | null;
  asset?: "Test Pi";
  sequence?: string | null;
  ledger?: number | null;
  notice: string;
};

const HORIZON = "https://api.testnet.minepi.com";
const TESTNET_PASSPHRASE = "Pi Testnet";

export async function readPiTestnetNativeBalance(
  walletAddress: string | null | undefined,
  fetcher: typeof fetch = fetch,
): Promise<PiTestnetWalletBalance> {
  if (!walletAddress || !/^G[A-Z2-7]{55}$/.test(walletAddress)) {
    return {
      status: "wallet_address_unavailable",
      network_id: "pi-testnet",
      network_alias: "Testnet1",
      native_balance: null,
      notice: "Pi Platform did not return a valid wallet address.",
    };
  }

  const rootResponse = await fetcher(HORIZON + "/", { redirect: "error", signal: AbortSignal.timeout(8000) });
  const root = await rootResponse.json().catch(() => null);
  if (!rootResponse.ok || root?.network_passphrase !== TESTNET_PASSPHRASE) {
    throw new Error("testnet_network_identity_unverified");
  }

  const accountResponse = await fetcher(
    HORIZON + "/accounts/" + encodeURIComponent(walletAddress),
    { redirect: "error", signal: AbortSignal.timeout(8000) },
  );
  if (accountResponse.status === 404) {
    return {
      status: "account_not_found",
      network_id: "pi-testnet",
      network_alias: "Testnet1",
      account_id: walletAddress,
      native_balance: null,
      ledger: null,
      notice: "No Pi Testnet account was found for this wallet address. This is not a zero-balance proof.",
    };
  }
  if (!accountResponse.ok) throw new Error("testnet_account_read_failed");

  const account = await accountResponse.json().catch(() => null);
  if (!account || account.account_id !== walletAddress || !Array.isArray(account.balances)) {
    throw new Error("invalid_testnet_account_response");
  }
  const native = account.balances.find((item: { asset_type?: string; balance?: string }) => item?.asset_type === "native");

  return {
    status: "read_only_verified",
    network_id: "pi-testnet",
    network_alias: "Testnet1",
    account_id: walletAddress,
    native_balance: typeof native?.balance === "string" ? native.balance : "0",
    asset: "Test Pi",
    sequence: typeof account.sequence === "string" ? account.sequence : null,
    ledger: Number.isSafeInteger(account.last_modified_ledger) ? account.last_modified_ledger : null,
    notice: "Read-only Pi Testnet native balance. Test Pi has no monetary value and may be reset.",
  };
}
