import { paymentCompletionError, paymentsEnabled } from "./payment-guards.ts";

Deno.test("payment writes are disabled unless the operator explicitly sets true", () => {
  if (paymentsEnabled(undefined)) throw new Error("missing flag must remain disabled");
  if (paymentsEnabled("")) throw new Error("empty flag must remain disabled");
  if (paymentsEnabled("false")) throw new Error("false flag must remain disabled");
  if (paymentsEnabled("TRUE")) throw new Error("flag parsing must be exact");
  if (!paymentsEnabled("true")) throw new Error("explicit true must enable writes");
});

Deno.test("completion rejects a payment that Pi has not approved", () => {
  const error = paymentCompletionError(
    { status: { developer_approved: false }, transaction: { txid: "tx_1234" } },
    "tx_1234",
  );
  if (error !== "payment_not_approved") throw new Error("unapproved payment was accepted");
});

Deno.test("completion requires Pi's exact recorded transaction id", () => {
  const payment = { status: { developer_approved: true }, transaction: { txid: "tx_1234" } };
  if (paymentCompletionError(payment, "tx_9999") !== "transaction_mismatch") {
    throw new Error("mismatched transaction id was accepted");
  }
  if (paymentCompletionError({ status: { developer_approved: true } }, "tx_1234") !== "transaction_mismatch") {
    throw new Error("missing recorded transaction id was accepted");
  }
});

Deno.test("completion accepts only approved payments with the matching transaction", () => {
  const error = paymentCompletionError(
    { status: { developer_approved: true }, transaction: { txid: "tx_1234" } },
    "tx_1234",
  );
  if (error !== null) throw new Error("valid payment completion was rejected");
});
