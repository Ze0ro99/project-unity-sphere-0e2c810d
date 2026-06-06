import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, BookOpen, Terminal, Webhook, Github } from "lucide-react";

export const Route = createFileRoute("/developers")({
  head: () => ({ meta: [{ title: "Developers — PiRC" }, { name: "description", content: "PiRC Developer Portal." }] }),
  component: DevPage,
});

function DevPage() {
  const { t } = useTranslation();
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground">{t("devs.title")}</h1>
        <p className="text-muted-foreground text-sm mt-2 mb-8">{t("devs.subtitle")}</p>

        <div className="grid lg:grid-cols-3 gap-5 mb-6">
          {[
            { icon: BookOpen, title: t("nav.docs"), desc: "Pi SDK reference and integration guides.", cta: t("devs.docs") },
            { icon: Terminal, title: "CLI Tools", desc: "Deploy contracts and manage resources via CLI." },
            { icon: Webhook, title: "Webhooks", desc: "Real-time payment & transaction event hooks." },
          ].map((c) => (
            <Card key={c.title} className="glass border-0 p-6">
              <div className="h-11 w-11 rounded-lg bg-gradient-gold text-gold-foreground flex items-center justify-center mb-4">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">{c.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">{c.desc}</p>
              {c.cta && <Button size="sm" variant="outline" className="gold-border">{c.cta}</Button>}
            </Card>
          ))}
        </div>

        <Card className="glass border-0 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-gold" />
              <h2 className="font-semibold text-foreground">{t("devs.apiKeys")}</h2>
            </div>
            <Button size="sm" className="bg-gradient-gold text-gold-foreground font-semibold">{t("devs.create")}</Button>
          </div>
          <div className="divide-y divide-border/40">
            {[
              { name: "Production", key: "pirc_live_••••••••4f2a", scope: "payments, wallet" },
              { name: "Sandbox", key: "pirc_test_••••••••91be", scope: "all" },
              { name: "Webhook signing", key: "whsec_••••••••07cd", scope: "webhooks" },
            ].map((k) => (
              <div key={k.name} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-foreground">{k.name}</div>
                  <code className="text-xs text-muted-foreground font-mono">{k.key}</code>
                </div>
                <Badge variant="outline" className="gold-border text-gold text-xs">{k.scope}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass border-0 p-6 mt-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Github className="h-5 w-5 text-foreground" />
            <div>
              <div className="text-sm font-medium text-foreground">Open Source</div>
              <div className="text-xs text-muted-foreground">Fork the PiRC reference implementation on GitHub.</div>
            </div>
          </div>
          <a href="https://github.com/Ze0ro99/PiRC" target="_blank" rel="noreferrer">
            <Button variant="outline" className="gold-border">View Repo</Button>
          </a>
        </Card>
      </div>
    </Layout>
  );
}
