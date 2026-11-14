import { useCallback, useEffect, useState } from "react";
import { Activity, GitBranch, RefreshCw, ShieldCheck, AlertTriangle } from "lucide-react";
import { usePortalFeed } from "@/lib/usePortalFeed";
import { useI18n } from "@/i18n";

type RepoFeed = {
  repository: string;
  status: "ok" | "partial" | "unavailable";
  openPullRequests: Array<{ number: number; title: string; draft: boolean; merged: boolean; url: string | null }>;
  latestCommit: { shortSha: string; message: string; committedAt: string | null; url: string | null } | null;
  latestWorkflow: { name: string; status: string; conclusion: string | null; url: string | null } | null;
  recentEvents: Array<{ id: string; type: string; actor: string; createdAt: string | null; action: string | null; title: string | null; number: number | null; ref: string | null; commitCount: number | null; url: string | null }>;
};
type Feed = {
  generatedAt: string;
  repositories: RepoFeed[];
  piTestnet: { status: string; identityVerified: boolean; latestLedger?: { sequence?: number | null } | null; notice?: string };
  safety: { readOnly: boolean; mainnetWrites: boolean; signingEnabled: boolean };
};

const endpoint = "/api/ecosystem-feed";

export default function EcosystemSync() {
  const { t, lang } = useI18n();
  const portal = usePortalFeed();
  const [feed, setFeed] = useState<Feed | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(endpoint, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json() as Feed;
      setFeed(data);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Feed unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 600_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const openCount = feed?.repositories.reduce((sum, repo) => sum + repo.openPullRequests.length, 0) ?? 0;
  const failed = feed?.repositories.filter((repo) => repo.status !== "ok").length ?? 0;
  const recentEvents = feed?.repositories.flatMap((repo) => repo.recentEvents.map((event) => ({ ...event, repository: repo.repository.split("/")[1] }))).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 8) ?? [];
  const networkLabel = feed?.piTestnet.identityVerified ? "TESTNET ID VERIFIED" : feed?.piTestnet.status || "WAITING";

  return (
    <section className="mb-4 rounded-xl border border-border bg-panel/70 p-3" aria-live="polite" aria-label="Live ecosystem synchronization">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Activity size={15} className="text-[#d8b56d]" />
          {t("portal.title")}
        </div>
        <span className="text-[11px] text-muted flex items-center gap-1"><GitBranch size={12} /> {feed ? `${openCount} recent open PRs · 3 repositories` : loading ? "Connecting…" : "Feed unavailable"}</span>
        <span className={`text-[11px] flex items-center gap-1 ${feed?.piTestnet.identityVerified ? "text-emerald-400" : "text-amber-300"}`}>
          {feed?.piTestnet.identityVerified ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
          {networkLabel}
          {feed?.piTestnet.latestLedger?.sequence ? ` · Ledger ${feed.piTestnet.latestLedger.sequence}` : ""}
        </span>
        <button type="button" onClick={() => { void refresh(); portal.refresh(); }} disabled={portal.isFetching || portal.cooldown} className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted hover:text-text disabled:opacity-50" aria-label={t("portal.refresh")}>
          <RefreshCw size={12} /> {t("Refresh")}
        </button>
      </div>
      <div className="mt-3 border-t border-border pt-3" data-testid="portal-feed">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <ShieldCheck size={13} className="text-gold" />
          <span className="font-semibold">Pi Testnet / Testnet1</span>
          <span className="chip">{t("portal.readonly")}</span>
          <span className="chip" role="status">{t(`portal.${portal.state}`)}</span>
        </div>
        <p className="mt-2 text-xs text-muted">{t("portal.notice")}</p>
        {portal.state === "awaiting_testnet_ingestion" && <p className="mt-2 text-xs text-muted">awaiting_testnet_ingestion</p>}
        {portal.error && <p className="mt-2 text-xs text-red" role="alert">{t("portal.failure")}</p>}
        {portal.data && portal.data.events.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-start text-muted"><th>{t("portal.event")}</th><th>{t("Ledger")}</th><th>{t("Type")}</th><th>{t("Time")}</th></tr></thead>
              <tbody>{portal.data.events.slice(0, 20).map(e => <tr key={e.id} className="border-t border-border"><td className="py-2 mono break-all">{e.id}</td><td>{e.ledger ?? "—"}</td><td>{e.type ?? "—"}</td><td>{e.observedAt ? new Date(e.observedAt).toLocaleString(lang) : "—"}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        {portal.dataUpdatedAt > 0 && <p className="mt-2 text-[11px] text-muted">{t("portal.checked")}: {new Date(portal.dataUpdatedAt).toLocaleTimeString(lang)}</p>}
      </div>
      {error && <p className="mt-2 text-[11px] text-amber-300">API sync issue: {error}. Last successful data is retained.</p>}
      {feed && (
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {feed.repositories.map((repo) => (
            <div key={repo.repository} className="min-w-0 rounded-lg border border-border/70 bg-panel2/50 p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-semibold">{repo.repository.split("/")[1]}</span>
                <span className={`text-[10px] ${repo.status === "ok" ? "text-emerald-400" : "text-amber-300"}`}>{repo.status.toUpperCase()}</span>
              </div>
              {repo.latestCommit && (
                <p className="mt-1 truncate text-[10px] text-muted" title={repo.latestCommit.message}>
                  {repo.latestCommit.shortSha} · {repo.latestCommit.message}
                </p>
              )}
              {repo.latestWorkflow && (
                <p className="mt-1 truncate text-[10px] text-muted">
                  CI: {repo.latestWorkflow.status}{repo.latestWorkflow.conclusion ? ` / ${repo.latestWorkflow.conclusion}` : ""}
                </p>
              )}
              <div className="mt-1 flex flex-wrap gap-1">
                {repo.openPullRequests.slice(0, 4).map((pr) => (
                  <a key={pr.number} href={pr.url || "#"} target="_blank" rel="noreferrer" className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted hover:text-text">
                    #{pr.number}{pr.draft ? " draft" : ""}
                  </a>
                ))}
                {repo.openPullRequests.length === 0 && <span className="text-[10px] text-muted">No recent open PR events</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {feed && recentEvents.length > 0 && (
        <div className="mt-3 border-t border-border/70 pt-3">
          <div className="mb-2 text-[11px] font-semibold text-muted">Recent repository events</div>
          <div className="grid gap-1 sm:grid-cols-2">
            {recentEvents.map((event) => (
              <div key={event.id} className="min-w-0 rounded-md bg-panel2/40 px-2 py-1.5 text-[10px]">
                <span className="font-semibold">{event.repository}</span>
                <span className="text-muted"> · {event.type.replace("Event", "")}{event.action ? ` · ${event.action}` : ""}</span>
                {event.title && <div className="truncate text-muted">{event.title}</div>}
                {event.ref && <div className="truncate text-muted">{event.ref}{event.commitCount != null ? ` · ${event.commitCount} commits` : ""}</div>}
                <div className="text-muted/70">{event.actor} · {event.createdAt ? new Date(event.createdAt).toLocaleString() : "time unavailable"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {feed && <p className="mt-2 text-[10px] text-muted">Updated {new Date(feed.generatedAt).toLocaleTimeString()} · Read-only API · no signing or Mainnet writes{failed ? ` · ${failed} partial repository feeds` : ""}</p>}
    </section>
  );
}
