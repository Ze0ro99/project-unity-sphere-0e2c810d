import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getServiceOrder, verifyServiceOrder } from "@/lib/services.functions";
import { createPiPayment } from "@/lib/pi-sdk";
import { approvePiPayment, completePiPayment } from "@/lib/pi-payments.functions";
import { explorerTx, type PiNetwork } from "@/lib/pi-horizon";
import { Copy, ExternalLink, RefreshCw, Wallet, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/services/$orderId")({
  head: () => ({ meta: [{ title: "Order — PiRC Services" }] }),
  component: OrderPage,
});

function OrderPage() {
  const { orderId } = Route.useParams();
  const getFn = useServerFn(getServiceOrder);
  const verifyFn = useServerFn(verifyServiceOrder);

  const order = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getFn({ data: { id: orderId } }),
    refetchInterval: 8_000,
  });

  const verify = useMutation({
    mutationFn: () => verifyFn({ data: { id: orderId } }),
    onSuccess: () => order.refetch(),
  });

  // auto-verify every 15s while pending
  useEffect(() => {
    if (!order.data || order.data.status !== "pending") return;
    const t = setInterval(() => verify.mutate(), 15_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.data?.status]);

  if (order.isLoading) return <Layout><div className="container mx-auto py-20 text-center text-muted-foreground">Loading order…</div></Layout>;
  if (order.error || !order.data) return <Layout><div className="container mx-auto py-20 text-center text-destructive">Order not found.</div></Layout>;

  const o = order.data as {
    id: string; service_id: string; amount_pi: number; deposit_memo: string;
    receiver_address: string; network: PiNetwork; status: string; txid: string | null;
    expires_at: string | null; activated_at: string | null; app_url: string | null;
    service?: { name?: string };
  };

  const payInApp = async () => {
    await createPiPayment(
      {
        amount: Number(o.amount_pi),
        memo: o.deposit_memo,
        metadata: { orderId: o.id, serviceId: o.service_id, kind: "service_order" },
      },
      {
        onReadyForServerApproval: async (id) => {
          try { await approvePiPayment({ data: { paymentId: id } }); toast.info("Payment approved"); }
          catch (e) { toast.error((e as Error).message); }
        },
        onReadyForServerCompletion: async (id, txid) => {
          try {
            await completePiPayment({ data: { paymentId: id, txid } });
            toast.success(`Confirmed ${txid.slice(0, 8)}…`);
            verify.mutate();
          } catch (e) { toast.error((e as Error).message); }
        },
        onCancel: () => toast.warning("Payment cancelled"),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const StatusBadge = () => {
    if (o.status === "active") return <Badge variant="outline" className="border-emerald-400/40 text-emerald-400 gap-1"><CheckCircle2 className="h-3 w-3" /> Active</Badge>;
    if (o.status === "expired") return <Badge variant="outline" className="text-muted-foreground gap-1"><AlertCircle className="h-3 w-3" /> Expired</Badge>;
    return <Badge variant="outline" className="gold-border text-gold gap-1"><Clock className="h-3 w-3" /> Awaiting payment</Badge>;
  };

  const copy = (s: string, label: string) => { navigator.clipboard.writeText(s); toast.success(`${label} copied`); };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <Link to="/services" className="text-xs text-gold hover:underline">← Back to services</Link>
        <div className="flex items-center justify-between mt-2 mb-6">
          <h1 className="text-3xl font-bold text-foreground">{o.service?.name ?? o.service_id}</h1>
          <StatusBadge />
        </div>

        <Card className="glass border-0 p-6 mb-5">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <Detail label="Amount" value={`π ${Number(o.amount_pi)}`} />
            <Detail label="Network" value={o.network} />
            {o.app_url && <Detail label="Application URL" value={o.app_url} />}
            <Detail label="Order ID" value={o.id.slice(0, 8) + "…"} />
            {o.expires_at && <Detail label="Expires" value={new Date(o.expires_at).toLocaleString()} />}
            {o.txid && (
              <Detail label="Transaction" value={
                <a href={explorerTx(o.network, o.txid)} target="_blank" rel="noreferrer" className="text-gold hover:underline inline-flex items-center gap-1 font-mono">
                  {o.txid.slice(0, 10)}… <ExternalLink className="h-3 w-3" />
                </a>
              } />
            )}
          </div>
        </Card>

        {o.status === "pending" && (
          <Card className="glass border-0 p-6 mb-5">
            <h2 className="font-semibold text-foreground mb-2">Send payment</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Send exactly <span className="text-gold font-mono">π {Number(o.amount_pi)}</span> to the address below with the memo. The service activates automatically once confirmed on-chain.
            </p>
            <div className="space-y-3">
              <Field label="Receiver" value={o.receiver_address} onCopy={() => copy(o.receiver_address, "Address")} />
              <Field label="Memo (required)" value={o.deposit_memo} onCopy={() => copy(o.deposit_memo, "Memo")} />
            </div>
            <div className="flex flex-wrap gap-2 mt-5">
              <Button onClick={payInApp} className="bg-gradient-gold text-gold-foreground font-semibold">
                <Wallet className="h-4 w-4" /> Pay with Pi
              </Button>
              <Button variant="outline" onClick={() => verify.mutate()} disabled={verify.isPending}>
                {verify.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Check payment now
              </Button>
            </div>
          </Card>
        )}

        {o.status === "active" && (
          <Card className="glass border-0 p-6 bg-gradient-primary">
            <div className="flex items-center gap-2 text-emerald-400 mb-2"><CheckCircle2 className="h-5 w-5" /> Service active</div>
            <p className="text-sm text-muted-foreground">
              Activated {o.activated_at ? new Date(o.activated_at).toLocaleString() : ""}.
              {o.expires_at && ` Expires ${new Date(o.expires_at).toLocaleString()}.`}
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-foreground mt-0.5">{value}</div>
    </div>
  );
}

function Field({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className="flex items-center gap-2 bg-secondary/40 rounded-md px-3 py-2">
        <code className="text-xs sm:text-sm font-mono text-foreground break-all flex-1">{value}</code>
        <Button size="sm" variant="ghost" onClick={onCopy}><Copy className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}
