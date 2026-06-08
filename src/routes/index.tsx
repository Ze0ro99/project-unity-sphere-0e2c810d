import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfessionalLiveDashboard } from "@/components/ProfessionalLiveDashboard";
import heroBg from "@/assets/hero-bg.jpg";
import {
  Shield, Wallet, FileCode2, Vote, Sparkles, Lock,
  ArrowRight, Users, Activity, FileSignature, Gauge,
  Copy, Check,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PiRC — The Sovereign Portal for the Pi Economy" },
      { name: "description", content: "Enterprise-grade resource center for Pi Network: Pi SDK auth, payments, smart contracts, governance and developer tools." },
      { property: "og:title", content: "PiRC — Pi Network Resource Center" },
      { property: "og:description", content: "Authenticate, transact and build on the Pi Network with PiRC." },
    ],
  }),
  component: Index,
});

const featureIcons = [Shield, Wallet, FileCode2, Lock, Vote, Sparkles] as const;
const featureKeys = ["auth", "payments", "contracts", "vaults", "governance", "security"] as const;
const statIcons = [Users, Activity, FileSignature, Gauge] as const;
const statValues = ["47M+", "1.2B+", "8,420", "99.99%"];

function Index() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const snippet = `// 1) Initialize
window.Pi.init({ version: "2.0", sandbox: true });

// 2) Authenticate
const auth = await window.Pi.authenticate(
  ["username", "payments", "wallet_address"],
  onIncompletePaymentFound,
);

// 3) Create a payment
window.Pi.createPayment(
  { amount: 1, memo: "PiRC service", metadata: { orderId: "abc" } },
  {
    onReadyForServerApproval: (id) => approveOnServer(id),
    onReadyForServerCompletion: (id, txid) => completeOnServer(id, txid),
    onCancel: () => {},
    onError: console.error,
  },
);`;

  const copy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-60"
          style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/60 via-background/80 to-background" />

        <div className="container mx-auto px-4 pt-20 pb-28 lg:pt-28 lg:pb-36">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <Badge variant="outline" className="gold-border text-gold mb-6 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> {t("hero.badge")}
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.05]">
              {t("hero.title")}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard">
                <Button size="lg" className="bg-gradient-gold text-gold-foreground hover:opacity-90 font-semibold shadow-[var(--shadow-glow)]">
                  {t("cta.launch")} <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
              <Link to="/developers">
                <Button size="lg" variant="outline" className="gold-border">
                  {t("cta.learnMore")}
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* STATS */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statIcons.map((Icon, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.5 }}
              >
                <Card className="glass p-5 border-0">
                  <Icon className="h-5 w-5 text-gold mb-3" />
                  <div className="text-2xl lg:text-3xl font-bold text-foreground">{statValues[i]}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t(`hero.stat${i + 1}`)}</div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE SOVEREIGN TELEMETRY */}
      <ProfessionalLiveDashboard />

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">{t("features.title")}</h2>
          <p className="text-muted-foreground mt-3">{t("features.subtitle")}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featureKeys.map((key, i) => {
            const Icon = featureIcons[i];
            return (
              <motion.div key={key} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Card className="glass p-6 border-0 h-full hover:shadow-[var(--shadow-glow)] transition-shadow">
                  <div className="h-11 w-11 rounded-lg bg-gradient-gold text-gold-foreground flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{t(`features.${key}.title`)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(`features.${key}.desc`)}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* SDK */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <Badge variant="outline" className="gold-border text-gold mb-4">SDK</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">{t("sdk.title")}</h2>
            <p className="text-muted-foreground mt-3 mb-6">{t("sdk.subtitle")}</p>
            <ol className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <li key={n} className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-7 w-7 rounded-full bg-gradient-gold text-gold-foreground flex items-center justify-center text-xs font-bold">{n}</span>
                  <span className="text-sm text-foreground/90 pt-1">{t(`sdk.step${n}`)}</span>
                </li>
              ))}
            </ol>
          </div>
          <Card className="glass border-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-destructive/60" />
                <span className="h-3 w-3 rounded-full bg-gold/60" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
              </div>
              <Button size="sm" variant="ghost" onClick={copy} className="h-7 gap-1.5 text-xs">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? t("sdk.copied") : t("sdk.copy")}
              </Button>
            </div>
            <pre dir="ltr" className="text-xs leading-relaxed p-5 overflow-x-auto text-foreground/90 font-mono">
              <code>{snippet}</code>
            </pre>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
