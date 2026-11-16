/**
 * OUSD test-only reserve/liability lifecycle.
 *
 * This is a deterministic policy state machine, not a token issuer, custodian,
 * bank integration, reserve attestor, payout processor, or on-chain executor.
 * It never mints or burns. It only determines whether a separately authorized
 * adapter may prepare an action after verified evidence is supplied.
 */
export const OUSD_POLICY_ID = "ousd-test-liability-v1";
export const OUSD_DECIMALS = 7;
export const OUSD_ATOMIC_PER_WHOLE = 10_000_000n;
export const OUSD_TEST_ONLY = true;

const terminal = new Set(["REDEEMED", "CANCELLED"]);

function uint(value, field) {
  if (typeof value === "bigint") {
    if (value < 0n) throw new RangeError(`${field} must be unsigned`);
    return value;
  }
  if (typeof value !== "string" || !/^(0|[1-9][0-9]*)$/.test(value)) {
    throw new TypeError(`${field} must be an unsigned integer string or bigint`);
  }
  return BigInt(value);
}

function freezeRecord(record) {
  return Object.freeze({ ...record, testOnly: true, policyId: OUSD_POLICY_ID });
}

/**
 * Reserve coverage uses a conservative ceiling:
 * 10 OUSD atomic units (7 decimals) represent 1 USD micro (6 decimals).
 * This is an accounting convention for the test profile, not proof of parity.
 */
export function requiredReserveUsdMicros(ousdAmountAtomic) {
  const amount = uint(ousdAmountAtomic, "ousdAmountAtomic");
  return ((amount + 9n) / 10n).toString();
}

export function createOusdLiability({ liabilityId, ousdAmountAtomic }) {
  if (typeof liabilityId !== "string" || !/^[A-Za-z0-9._:-]{1,128}$/.test(liabilityId)) {
    throw new TypeError("liabilityId must be a stable non-empty identifier");
  }
  const amount = uint(ousdAmountAtomic, "ousdAmountAtomic");
  if (amount === 0n) throw new RangeError("ousdAmountAtomic must be greater than zero");
  return freezeRecord({
    liabilityId,
    ousdAmountAtomic: amount.toString(),
    requiredReserveUsdMicros: requiredReserveUsdMicros(amount),
    status: "AWAITING_RESERVE",
    reserveEvidenceId: null,
    reserveAccountingId: null,
    reserveAllocationId: null,
    issuerApprovalId: null,
    payoutEvidenceId: null,
    outstandingLiability: true,
    mintPreparationEligible: false,
    burnPreparationEligible: false,
  });
}

export function attachVerifiedReserve(record, evidence) {
  if (record.status !== "AWAITING_RESERVE") throw new Error("reserve evidence is only accepted before issuance");
  if (!evidence || evidence.status !== "SETTLED" || evidence.independentlyVerified !== true) {
    throw new Error("reserve must be independently verified and settled");
  }
  if (evidence.currency !== "USD") throw new Error("reserve currency must be USD");
  if (evidence.liabilityId !== record.liabilityId) throw new Error("reserve evidence must be bound to this liability");
  if (typeof evidence.evidenceId !== "string" || !evidence.evidenceId.trim()) throw new Error("reserve evidenceId is required");
  if (typeof evidence.reserveAccountingId !== "string" || !evidence.reserveAccountingId.trim()) throw new Error("reserveAccountingId is required");
  if (typeof evidence.reserveAllocationId !== "string" || !evidence.reserveAllocationId.trim() || evidence.reserveAllocationExclusive !== true) {
    throw new Error("exclusive reserve allocation evidence is required to prevent double counting");
  }
  const reserve = uint(evidence.allocatedUsdMicros, "allocatedUsdMicros");
  const required = uint(record.requiredReserveUsdMicros, "requiredReserveUsdMicros");
  if (reserve < required) throw new Error("exclusive reserve allocation is below the required liability coverage");
  return freezeRecord({
    ...record,
    status: "READY_TO_ISSUE",
    reserveEvidenceId: evidence.evidenceId,
    reserveAccountingId: evidence.reserveAccountingId,
    reserveAllocationId: evidence.reserveAllocationId,
    allocatedUsdMicros: reserve.toString(),
  });
}

export function authorizeOusdIssuance(record, approval) {
  if (record.status !== "READY_TO_ISSUE") throw new Error("liability is not ready for issuance");
  if (!approval || approval.approved !== true || typeof approval.approvalId !== "string" || !approval.approvalId.trim()) {
    throw new Error("explicit issuer approval is required");
  }
  return freezeRecord({
    ...record,
    status: "ISSUED",
    issuerApprovalId: approval.approvalId,
    outstandingLiability: true,
    mintPreparationEligible: true,
    burnPreparationEligible: false,
  });
}

export function requestOusdRedemption(record, request) {
  if (record.status !== "ISSUED") throw new Error("only issued liabilities can enter redemption");
  if (!request || typeof request.requestId !== "string" || !request.requestId.trim()) throw new Error("redemption requestId is required");
  if (typeof request.beneficiaryRef !== "string" || !request.beneficiaryRef.trim()) throw new Error("beneficiaryRef is required");
  return freezeRecord({
    ...record,
    status: "PAYOUT_PENDING",
    redemptionRequestId: request.requestId,
    beneficiaryRef: request.beneficiaryRef,
    mintPreparationEligible: false,
    burnPreparationEligible: false,
    payoutEvidenceId: null,
  });
}

export function recordOusdPayoutFailure(record, failureEvidenceId) {
  if (record.status !== "PAYOUT_PENDING") throw new Error("payout failure requires a pending payout");
  if (typeof failureEvidenceId !== "string" || !failureEvidenceId.trim()) throw new Error("failure evidence is required");
  return freezeRecord({
    ...record,
    status: "PAYOUT_FAILED",
    payoutFailureEvidenceId: failureEvidenceId,
    outstandingLiability: true,
    burnPreparationEligible: false,
  });
}

export function retryOusdPayout(record, retryRequestId) {
  if (record.status !== "PAYOUT_FAILED") throw new Error("only failed payouts can be retried");
  if (typeof retryRequestId !== "string" || !retryRequestId.trim()) throw new Error("retry requestId is required");
  return freezeRecord({
    ...record,
    status: "PAYOUT_PENDING",
    redemptionRequestId: retryRequestId,
    payoutFailureEvidenceId: null,
    burnPreparationEligible: false,
  });
}

export function confirmOusdPayout(record, payoutEvidence) {
  if (record.status !== "PAYOUT_PENDING") throw new Error("payout must be pending");
  if (!payoutEvidence || payoutEvidence.status !== "SETTLED" || payoutEvidence.independentlyVerified !== true) {
    throw new Error("payout must be independently verified and settled before burn preparation");
  }
  if (payoutEvidence.liabilityId !== record.liabilityId || payoutEvidence.requestId !== record.redemptionRequestId) {
    throw new Error("payout evidence must bind to the exact liability and redemption request");
  }
  if (payoutEvidence.beneficiaryRef !== record.beneficiaryRef || payoutEvidence.currency !== "USD") {
    throw new Error("payout beneficiary or currency does not match the liability");
  }
  if (uint(payoutEvidence.amountUsdMicros, "amountUsdMicros") < uint(record.requiredReserveUsdMicros, "requiredReserveUsdMicros")) {
    throw new Error("settled payout is below the liability amount");
  }
  if (typeof payoutEvidence.evidenceId !== "string" || !payoutEvidence.evidenceId.trim()) {
    throw new Error("payout evidenceId is required");
  }
  return freezeRecord({
    ...record,
    status: "REDEEMED",
    payoutEvidenceId: payoutEvidence.evidenceId,
    outstandingLiability: false,
    burnPreparationEligible: true,
    mintPreparationEligible: false,
  });
}

export function disputeOusdLiability(record, disputeId) {
  if (terminal.has(record.status)) throw new Error("terminal liability cannot be disputed");
  if (typeof disputeId !== "string" || !disputeId.trim()) throw new Error("disputeId is required");
  return freezeRecord({
    ...record,
    status: "DISPUTED",
    disputeId,
    outstandingLiability: true,
    mintPreparationEligible: false,
    burnPreparationEligible: false,
  });
}

export function getOusdActionGate(record) {
  return Object.freeze({
    policyId: OUSD_POLICY_ID,
    testOnly: true,
    status: record.status,
    outstandingLiability: record.outstandingLiability,
    mintPreparationEligible: record.mintPreparationEligible === true,
    burnPreparationEligible: record.burnPreparationEligible === true,
    executionEnabled: false,
  });
}
