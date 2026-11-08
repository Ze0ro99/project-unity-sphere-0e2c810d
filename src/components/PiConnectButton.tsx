import { useState } from "react";
import { usePiConnection } from "@/lib/piSdk";
import { Wallet } from "lucide-react";
import { useI18n } from "@/i18n";

export default function PiConnectButton() {
  const { connected, user, loading, error, connect } = usePiConnection();
  const { t } = useI18n();
  const [showError, setShowError] = useState<string | null>(null);

  const handleConnect = async () => {
    setShowError(null);
    if (connected) return;
    try {
      await connect();
    } catch (cause) {
      setShowError(cause instanceof Error ? cause.message : t("pi.connectFailed"));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleConnect}
        disabled={loading || connected}
        aria-live="polite"
        className="flex items-center gap-1.5 rounded-md bg-gradient-to-br from-gold to-orange px-3 py-1.5 text-xs font-semibold text-black transition hover:opacity-90 disabled:opacity-60"
      >
        <Wallet size={14} />
        {loading ? t("common.loading") : connected ? t("pi.connected", { username: user?.username ?? "" }) : t("pi.connect")}
      </button>
      {(error || showError) && <span role="alert" className="max-w-48 text-[10px] text-red">{error || showError}</span>}
    </div>
  );
}
