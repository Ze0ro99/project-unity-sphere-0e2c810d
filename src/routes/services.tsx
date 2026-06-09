import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCatalog, createServiceOrder, listMyOrders } from "@/lib/services.functions";
import { usePiAuth } from "@/lib/pi-auth-context";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Rocket, Shield, ShoppingCart, Activity, Globe } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({ meta: [
    { title: "Services — Sovereign Portal" },
    { name: "description", content: "Hosting, integration, monitoring & endpoint services. Pay in Pi, activate instantly." },
  ] }),
  component: ServicesPage,
});

const ICONS: Record<string, typeof Rocket> = {
  hosting: Globe, review: Shield, integration: Rocket, endpoint: Activity, monitoring: Activity, custom: ShoppingCart,
};

function ServicesPage() {
  const { user, signIn } = usePiAuth();
  const navigate = useNavigate();
  const catalogFn = useServerFn(listCatalog);
  const ordersFn = useServerFn(listMyOrders);
  const createFn = useServerFn(createServiceOrder);

  const catalog = useQuery({ queryKey: ["service-catalog"], queryFn: () => catalogFn() });
  const orders = useQuery({
    queryKey: ["my-orders", user?.uid],
    queryFn: () => ordersFn({ data: { userUid: user!.uid } }),
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: (vars: { serviceId: string; amount: number; appUrl: string }) =>
      createFn({
        data: {
          serviceId: vars.serviceId,
          amount: vars.amount,
          appUrl: vars.appUrl || undefined,
          userUid: user!.uid,
          username: user!.username,
          network: "testnet",
        },
      }),
    onSuccess: (res) => {
      toast.success("Order created");
      navigate({ to: "/services/$orderId", params: { orderId: res.order.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Sovereign Services</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pay in π. Receive a unique deposit address. Service activates automatically when payment lands on-chain.
          </p>
        </div>

        {!user && (
          <Card className="glass border-0 p-4 mb-6 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Sign in with Pi to purchase a service.</span>
            <Button onClick={signIn} className="bg-gradient-gold text-gold-foreground font-semibold">Sign in with Pi</Button>
          </Card>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(catalog.data ?? []).map((s) => {
            const Icon = ICONS[s.category] ?? Rocket;
            return (
              <Card key={s.id} className="glass border-0 p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="h-10 w-10 rounded-full bg-gradient-gold text-gold-foreground flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </span>
                  <Badge variant="outline" className="gold-border text-gold text-[10px] uppercase">{s.category}</Badge>
                </div>
                <h3 className="text-lg font-semibold text-foreground">{s.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 flex-1">{s.description}</p>
                <div className="flex items-end justify-between mt-4 pt-3 border-t border-border/40">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">From</div>
                    <div className="text-xl font-bold text-gold">π {Number(s.min_price_pi)}</div>
                  </div>
                  <PurchaseDialog
                    service={s}
                    onSubmit={(amount, appUrl) => {
                      if (!user) { signIn(); return; }
                      create.mutate({ serviceId: s.id, amount, appUrl });
                    }}
                    pending={create.isPending}
                  />
                </div>
              </Card>
            );
          })}
        </div>

        {user && (orders.data?.length ?? 0) > 0 && (
          <Card className="glass border-0 p-5 mt-8">
            <h2 className="font-semibold text-foreground mb-3">Your Orders</h2>
            <div className="divide-y divide-border/40">
              {(orders.data ?? []).map((o) => (
                <button
                  key={o.id}
                  onClick={() => navigate({ to: "/services/$orderId", params: { orderId: o.id } })}
                  className="w-full flex items-center justify-between py-3 text-sm text-left hover:bg-secondary/30 px-2 rounded"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        o.status === "active"
                          ? "border-emerald-400/40 text-emerald-400"
                          : o.status === "expired"
                          ? "border-muted-foreground/40 text-muted-foreground"
                          : "gold-border text-gold"
                      }
                    >
                      {o.status}
                    </Badge>
                    <span className="text-foreground">{(o as { service?: { name?: string } }).service?.name ?? o.service_id}</span>
                    {o.app_url && <span className="text-muted-foreground truncate max-w-xs">{o.app_url}</span>}
                  </div>
                  <span className="text-gold font-mono">π {Number(o.amount_pi)}</span>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}

function PurchaseDialog({
  service, onSubmit, pending,
}: {
  service: { id: string; name: string; min_price_pi: number | string };
  onSubmit: (amount: number, appUrl: string) => void;
  pending: boolean;
}) {
  const min = Number(service.min_price_pi);
  const [amount, setAmount] = useState(String(min));
  const [appUrl, setAppUrl] = useState("");
  const [open, setOpen] = useState(false);
  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt < min) { toast.error(`Minimum is ${min} π`); return; }
    onSubmit(amt, appUrl);
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-gold text-gold-foreground font-semibold" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Buy
        </Button>
      </DialogTrigger>
      <DialogContent className="glass border-border/40">
        <DialogHeader><DialogTitle>{service.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Amount (π) — min {min}</Label>
            <Input type="number" step="0.0001" min={min} value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-secondary/40 mt-1.5" />
          </div>
          <div>
            <Label>Your application URL (optional)</Label>
            <Input type="url" placeholder="https://your-app.example.com" value={appUrl} onChange={(e) => setAppUrl(e.target.value)} className="bg-secondary/40 mt-1.5" />
          </div>
          <Button onClick={submit} className="w-full bg-gradient-gold text-gold-foreground font-semibold">Create order</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
