import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/governance")({
  head: () => ({ meta: [{ title: "Governance — PiRC" }, { name: "description", content: "On-chain governance for Pi." }] }),
  component: GovernancePage,
});

const proposals = [
  { id: "PIP-042", title: "Increase staking rewards by 1.5%", status: "active", for: 68, against: 32 },
  { id: "PIP-041", title: "Onboard PiRC as core resource hub", status: "passed", for: 92, against: 8 },
  { id: "PIP-040", title: "Reduce gas fees for micro-payments", status: "active", for: 54, against: 46 },
  { id: "PIP-039", title: "Add post-quantum signature scheme", status: "passed", for: 87, against: 13 },
  { id: "PIP-038", title: "Sunset legacy testnet endpoints", status: "rejected", for: 22, against: 78 },
];

function GovernancePage() {
  const { t } = useTranslation();
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <h1 className="text-3xl font-bold text-foreground">{t("governance.title")}</h1>
        <p className="text-muted-foreground text-sm mt-2 mb-8">{t("governance.subtitle")}</p>

        <div className="space-y-4">
          {proposals.map((p) => (
            <Card key={p.id} className="glass border-0 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gold font-mono">{p.id}</span>
                    <Badge variant="outline" className={
                      p.status === "active" ? "border-gold/40 text-gold" :
                      p.status === "passed" ? "border-emerald-500/40 text-emerald-400" :
                      "border-destructive/40 text-destructive"
                    }>{t(`governance.${p.status}`)}</Badge>
                  </div>
                  <h3 className="font-semibold text-foreground">{p.title}</h3>
                </div>
                {p.status === "active" && (
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-gradient-gold text-gold-foreground font-semibold">{t("governance.vote_for")}</Button>
                    <Button size="sm" variant="outline" className="gold-border">{t("governance.vote_against")}</Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t("governance.vote_for")} · {p.for}%</span>
                  <span>{t("governance.vote_against")} · {p.against}%</span>
                </div>
                <Progress value={p.for} className="h-2" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
