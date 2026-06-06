import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Wallet as WalletIcon, Crown, CheckCircle2, Loader2 } from "lucide-react";
import { createPiPayment } from "@/lib/pi-sdk";
import { approvePiPayment, completePiPayment } from "@/lib/pi-payments.functions";
import { usePiAuth, PREMIUM_ACCESS_PRODUCT } from "@/lib/pi-auth-context";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [{ title: "Wallet — PiRC" }, { name: "description", content: "Manage your Pi wallet." }] }),
  component: WalletPage,
});

function WalletPage() {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const address = "GACQ7XQ...M3N4P9KLM";

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    createPiPayment(
      { amount: amt, memo: memo || "PiRC transfer", metadata: { source: "pirc-wallet" } },
      {
        onReadyForServerApproval: (id) => toast.info(`Approve on server: ${id}`),
        onReadyForServerCompletion: (id, txid) => toast.success(`Completed ${txid}`),
        onCancel: () => toast.warning("Payment cancelled"),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t("wallet.title")}</h1>
        <p className="text-muted-foreground text-sm mb-8">{t("tagline")}</p>

        <div className="grid lg:grid-cols-5 gap-5">
          <Card className="glass border-0 p-6 lg:col-span-3 bg-gradient-primary">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <WalletIcon className="h-4 w-4" /> {t("wallet.address")}
            </div>
            <div className="flex items-center gap-2 mb-6">
              <code className="text-foreground font-mono text-sm bg-secondary/40 px-3 py-1.5 rounded">{address}</code>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(address); toast.success("Copied"); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">{t("wallet.balance")}</div>
            <div className="text-4xl font-bold text-gold mt-1">π 12,480.32</div>
          </Card>

          <Card className="glass border-0 p-6 lg:col-span-2">
            <form onSubmit={send} className="space-y-4">
              <div>
                <Label htmlFor="to">{t("wallet.to")}</Label>
                <Input id="to" placeholder="GA...XYZ" className="mt-1.5 bg-secondary/40 border-border" />
              </div>
              <div>
                <Label htmlFor="amount">{t("wallet.amount")} (π)</Label>
                <Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1.5 bg-secondary/40 border-border" />
              </div>
              <div>
                <Label htmlFor="memo">{t("wallet.memo")}</Label>
                <Input id="memo" value={memo} onChange={(e) => setMemo(e.target.value)} className="mt-1.5 bg-secondary/40 border-border" />
              </div>
              <Button type="submit" className="w-full bg-gradient-gold text-gold-foreground font-semibold">
                {t("wallet.submit")}
              </Button>
            </form>
          </Card>
        </div>

        <Card className="glass border-0 p-6 mt-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t("wallet.history")}</h2>
          <div className="divide-y divide-border/40">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="py-3 flex justify-between text-sm">
                <span className="text-muted-foreground">Tx #{1024 + i} · {i}d ago</span>
                <span className={i % 2 ? "text-emerald-400" : "text-foreground"}>π {(Math.random() * 100).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
