import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCode2, ShieldCheck, Coins, Vote, Lock, Repeat } from "lucide-react";

export const Route = createFileRoute("/contracts")({
  head: () => ({ meta: [{ title: "Smart Contracts — PiRC" }, { name: "description", content: "Audited Soroban contract templates." }] }),
  component: ContractsPage,
});

const contracts = [
  { icon: Coins, name: "Pi Token Vault", desc: "Time-locked Pi vault with multi-sig withdrawal.", tag: "Treasury" },
  { icon: Vote, name: "DAO Governance", desc: "Proposal lifecycle with quadratic voting.", tag: "Governance" },
  { icon: Repeat, name: "Pi Swap AMM", desc: "Constant-product market maker for Pi pairs.", tag: "DeFi" },
  { icon: Lock, name: "Escrow Lock", desc: "Trustless escrow with arbiter resolution.", tag: "Payments" },
  { icon: ShieldCheck, name: "KYC Registry", desc: "On-chain pioneer attestation registry.", tag: "Identity" },
  { icon: FileCode2, name: "NFT Collection", desc: "Soroban-compatible NFT mint contract.", tag: "NFT" },
];

function ContractsPage() {
  const { t } = useTranslation();
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground">{t("contracts.title")}</h1>
        <p className="text-muted-foreground text-sm mt-2 mb-8">{t("contracts.subtitle")}</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {contracts.map((c) => (
            <Card key={c.name} className="glass border-0 p-6 hover:shadow-[var(--shadow-glow)] transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="h-11 w-11 rounded-lg bg-gradient-gold text-gold-foreground flex items-center justify-center">
                  <c.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="gold-border text-gold text-xs">{c.tag}</Badge>
              </div>
              <h3 className="font-semibold text-foreground">{c.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4 leading-relaxed">{c.desc}</p>
              <div className="flex gap-2">
                <Button size="sm" className="bg-gradient-gold text-gold-foreground font-semibold flex-1">{t("contracts.deploy")}</Button>
                <Button size="sm" variant="outline" className="gold-border flex-1">{t("contracts.view")}</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
