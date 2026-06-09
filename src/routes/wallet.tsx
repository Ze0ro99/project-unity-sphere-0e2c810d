import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Wallet as WalletIcon, Crown, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { createPiPayment } from "@/lib/pi-sdk";
import { approvePiPayment, completePiPayment } from "@/lib/pi-payments.functions";
import { usePiAuth, PREMIUM_ACCESS_PRODUCT } from "@/lib/pi-auth-context";
import { useAccount, explorerAccount, type PiNetwork } from "@/lib/pi-horizon";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [{ title: "Wallet — PiRC" }, { name: "description", content: "Manage your Pi wallet." }] }),
  component: WalletPage,
});

function WalletPage() {
  const { t } = useTranslation();
  const { user, hasPremium, paymentStatus, paymentError, purchase, signIn } = usePiAuth();
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [network] = useState<PiNetwork>("testnet");
  const address = user?.wallet_address ?? "Sign in to view address";
  const account = useAccount(user?.wallet_address, network);
  const balance = account.data?.balances?.find((b) => b.asset_type === "native")?.balance;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    await createPiPayment(
      { amount: amt, memo: memo || "PiRC transfer", metadata: { source: "pirc-wallet" } },
      {
        onReadyForServerApproval: async (id) => {
          try { await approvePiPayment({ data: { paymentId: id } }); toast.info("Approved"); }
          catch (err) { toast.error((err as Error).message); }
        },
        onReadyForServerCompletion: async (id, txid) => {
          try { await completePiPayment({ data: { paymentId: id, txid } }); toast.success(`Completed ${txid.slice(0, 8)}…`); }
          catch (err) { toast.error((err as Error).message); }
        },
        onCancel: () => toast.warning("Payment cancelled"),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const buyPremium = async () => {
    if (!user) { toast.info("Sign in with Pi to purchase."); await signIn(); return; }
    await purchase();
  };

  const paying = paymentStatus === "creating" || paymentStatus === "approving" || paymentStatus === "completing";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t("wallet.title")}</h1>
        <p className="text-muted-foreground text-sm mb-6">{t("tagline")}</p>

        <Card className="glass border-0 p-6 mb-5 bg-gradient-primary">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="h-11 w-11 rounded-full bg-gradient-gold text-gold-foreground flex items-center justify-center">
                <Crown className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{PREMIUM_ACCESS_PRODUCT.name}</h2>
                  {hasPremium && (
                    <Badge variant="outline" className="gold-border text-gold gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground max-w-xl mt-0.5">{PREMIUM_ACCESS_PRODUCT.memo}</p>
                {paymentError && <p className="text-xs text-destructive mt-1">{paymentError}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Price</div>
                <div className="text-2xl font-bold text-gold">π {PREMIUM_ACCESS_PRODUCT.amount}</div>
              </div>
              <Button
                onClick={buyPremium}
                disabled={paying || hasPremium}
                className="bg-gradient-gold text-gold-foreground font-semibold"
              >
                {paying && <Loader2 className="h-4 w-4 animate-spin" />}
                {hasPremium ? "Unlocked" : paying ? paymentStatus : "Buy with Pi"}
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-5 gap-5">
          <Card className="glass border-0 p-6 lg:col-span-3 bg-gradient-primary">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <WalletIcon className="h-4 w-4" /> {t("wallet.address")}
            </div>
            <div className="flex items-center gap-2 mb-6">
              <code className="text-foreground font-mono text-xs sm:text-sm bg-secondary/40 px-3 py-1.5 rounded break-all">{address}</code>
              {user?.wallet_address && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(address); toast.success("Copied"); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <a href={explorerAccount(network, user.wallet_address)} target="_blank" rel="noreferrer" className="text-gold">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </>
              )}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              {t("wallet.balance")}
              {account.isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
            </div>
            <div className="text-4xl font-bold text-gold mt-1">
              π {balance ? Number(balance).toLocaleString(undefined, { maximumFractionDigits: 4 }) : user?.wallet_address ? "0.00" : "—"}
            </div>
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
