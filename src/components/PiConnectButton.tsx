import { useState } from "react";
import { usePiConnection, usePiPurchase, type PaymentData } from "@/lib/piSdk";
import { Wallet } from "lucide-react";

const defaultPayment: PaymentData = {
  amount: 1,
  memo: "PiRC Governance Contribution",
  metadata: { type: "pirc_proposal", proposalId: "PiRC-101" },
};

export default function PiConnectButton({
  payment = defaultPayment,
}: {
  payment?: PaymentData;
}) {
  const { connected, user, loading, error, connect } = usePiConnection();
  const purchase = usePiPurchase(payment);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleClick = async () => {
    setPaymentError(null);
    if (!connected) return connect();
    setPaying(true);
    try {
      await purchase();
    } catch (e) {
      setPaymentError(e instanceof Error ? e.message : "Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading || paying}
        className="flex items-center gap-1.5 rounded-md bg-gradient-to-br from-gold to-orange px-3 py-1.5 text-xs font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
      >
        <Wallet size={14} />
        {loading || paying
          ? "…"
          : connected
          ? `Pay ${payment.amount}π (${user?.username})`
          : "Connect Pi"}
      </button>
      {(error || paymentError) && <span role="alert" className="text-[10px] text-red">{error || paymentError}</span>}
    </div>
  );
}
