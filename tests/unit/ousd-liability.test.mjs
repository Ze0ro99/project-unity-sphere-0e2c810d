import test from "node:test";
import assert from "node:assert/strict";
import {
  OUSD_POLICY_ID,
  OUSD_DECIMALS,
  OUSD_TEST_ONLY,
  requiredReserveUsdMicros,
  createOusdLiability,
  attachVerifiedReserve,
  authorizeOusdIssuance,
  requestOusdRedemption,
  recordOusdPayoutFailure,
  retryOusdPayout,
  confirmOusdPayout,
  disputeOusdLiability,
  getOusdActionGate,
} from "../../src/lib/ousd-liability.mjs";

function reserve(liabilityId) {
  return {
    status: "SETTLED",
    independentlyVerified: true,
    currency: "USD",
    liabilityId,
    evidenceId: `bank-statement:${liabilityId}`,
    reserveAccountingId: "usd-reserve:segregated:001",
    reserveAllocationId: `usd-allocation:${liabilityId}`,
    reserveAllocationExclusive: true,
    allocatedUsdMicros: "1000000",
  };
}
function payout(record) {
  return {
    status: "SETTLED",
    independentlyVerified: true,
    evidenceId: `payout:${record.liabilityId}`,
    liabilityId: record.liabilityId,
    requestId: record.redemptionRequestId,
    beneficiaryRef: record.beneficiaryRef,
    currency: "USD",
    amountUsdMicros: record.requiredReserveUsdMicros,
  };
}

test("OUSD test profile has seven decimals and never enables execution", () => {
  assert.equal(OUSD_POLICY_ID, "ousd-test-liability-v1");
  assert.equal(OUSD_DECIMALS, 7);
  assert.equal(OUSD_TEST_ONLY, true);
  const liability = createOusdLiability({ liabilityId: "order:001", ousdAmountAtomic: "10000000" });
  assert.equal(getOusdActionGate(liability).executionEnabled, false);
});

test("reserve coverage rounds upward and rejects unverified, unsettled or underfunded evidence", () => {
  assert.equal(requiredReserveUsdMicros("1"), "1");
  assert.equal(requiredReserveUsdMicros("10"), "1");
  assert.equal(requiredReserveUsdMicros("11"), "2");
  const liability = createOusdLiability({ liabilityId: "order:002", ousdAmountAtomic: "10000000" });
  assert.throws(() => attachVerifiedReserve(liability, { ...reserve("order:002"), independentlyVerified: false }), /independently verified/);
  assert.throws(() => attachVerifiedReserve(liability, { ...reserve("order:002"), status: "PENDING" }), /settled/);
  assert.throws(() => attachVerifiedReserve(liability, { ...reserve("different-order"), liabilityId: "different-order" }), /bound to this liability/);
  assert.throws(() => attachVerifiedReserve(liability, { ...reserve("order:002"), reserveAllocationExclusive: false }), /exclusive reserve allocation/);
  assert.throws(() => attachVerifiedReserve(liability, { ...reserve("order:002"), allocatedUsdMicros: "999999" }), /below/);
});

test("issuance preparation requires verified reserve and explicit issuer approval", () => {
  const liability = createOusdLiability({ liabilityId: "order:003", ousdAmountAtomic: "10000000" });
  const ready = attachVerifiedReserve(liability, reserve("order:003"));
  assert.throws(() => authorizeOusdIssuance(ready, { approved: false, approvalId: "no" }), /issuer approval/);
  const issued = authorizeOusdIssuance(ready, { approved: true, approvalId: "issuer-approval-001" });
  assert.equal(issued.status, "ISSUED");
  assert.equal(getOusdActionGate(issued).mintPreparationEligible, true);
  assert.equal(getOusdActionGate(issued).executionEnabled, false);
});

test("failed payout leaves liability outstanding and forbids burn preparation", () => {
  const ready = attachVerifiedReserve(createOusdLiability({ liabilityId: "order:004", ousdAmountAtomic: "10000000" }), reserve("order:004"));
  const issued = authorizeOusdIssuance(ready, { approved: true, approvalId: "issuer-approval-002" });
  const pending = requestOusdRedemption(issued, { requestId: "redeem-001", beneficiaryRef: "beneficiary:001" });
  const failed = recordOusdPayoutFailure(pending, "bank-failure-001");
  assert.equal(failed.status, "PAYOUT_FAILED");
  assert.equal(failed.outstandingLiability, true);
  assert.equal(getOusdActionGate(failed).burnPreparationEligible, false);
  const retried = retryOusdPayout(failed, "redeem-retry-001");
  assert.equal(retried.status, "PAYOUT_PENDING");
  assert.equal(retried.outstandingLiability, true);
});

test("burn preparation becomes eligible only after independently verified settled payout", () => {
  const ready = attachVerifiedReserve(createOusdLiability({ liabilityId: "order:005", ousdAmountAtomic: "10000000" }), reserve("order:005"));
  const issued = authorizeOusdIssuance(ready, { approved: true, approvalId: "issuer-approval-003" });
  const pending = requestOusdRedemption(issued, { requestId: "redeem-002", beneficiaryRef: "beneficiary:002" });
  assert.throws(() => confirmOusdPayout(pending, { ...payout(pending), independentlyVerified: false }), /independently verified/);
  assert.throws(() => confirmOusdPayout(pending, { ...payout(pending), beneficiaryRef: "beneficiary:wrong" }), /beneficiary or currency/);
  assert.throws(() => confirmOusdPayout(pending, { ...payout(pending), amountUsdMicros: "1" }), /below the liability/);
  const redeemed = confirmOusdPayout(pending, payout(pending));
  assert.equal(redeemed.status, "REDEEMED");
  assert.equal(redeemed.outstandingLiability, false);
  assert.equal(getOusdActionGate(redeemed).burnPreparationEligible, true);
  assert.equal(getOusdActionGate(redeemed).executionEnabled, false);
});

test("disputes freeze issuance and payout actions", () => {
  const ready = attachVerifiedReserve(createOusdLiability({ liabilityId: "order:006", ousdAmountAtomic: "10000000" }), reserve("order:006"));
  const disputed = disputeOusdLiability(ready, "dispute-001");
  assert.equal(disputed.status, "DISPUTED");
  assert.equal(disputed.outstandingLiability, true);
  assert.equal(getOusdActionGate(disputed).mintPreparationEligible, false);
  assert.equal(getOusdActionGate(disputed).burnPreparationEligible, false);
});
