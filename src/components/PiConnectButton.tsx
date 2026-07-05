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

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => (connected ? purchase() : connect())}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-md bg-gradient-to-br from-gold to-orange px-3 py-1.5 text-xs font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
      >
        <Wallet size={14} />
        {loading
          ? "…"
          : connected
          ? `Pay 1π (${user?.username})`
          : "Connect Pi"}
      </button>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
}
