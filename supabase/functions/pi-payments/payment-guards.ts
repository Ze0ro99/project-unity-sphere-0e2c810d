export type PiPaymentRecord = {
  status?: {
    developer_approved?: boolean;
    developer_completed?: boolean;
  } | null;
  transaction?: {
    txid?: string | null;
  } | null;
};

/** Payment writes require an explicit operator opt-in; missing values stay disabled. */
export function paymentsEnabled(value: string | undefined): boolean {
  return value === "true";
}

/** Verify Pi's own approval state and exact chain transaction before completion. */
export function paymentCompletionError(
  payment: PiPaymentRecord,
  submittedTxid: string,
): "payment_not_approved" | "transaction_mismatch" | null {
  if (payment.status?.developer_approved !== true) return "payment_not_approved";
  const recordedTxid = payment.transaction?.txid;
  if (typeof recordedTxid !== "string" || recordedTxid.length === 0 || recordedTxid !== submittedTxid) {
    return "transaction_mismatch";
  }
  return null;
}
