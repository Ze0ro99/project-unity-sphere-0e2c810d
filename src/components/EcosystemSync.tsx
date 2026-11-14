import { useCallback, useEffect, useState } from "react";
import { Activity, GitBranch, RefreshCw, ShieldCheck, AlertTriangle } from "lucide-react";

type RepoFeed = {
  repository: string;
  status: "ok" | "partial" | "unavailable";
  openPullRequests: Array<{ number: number; title: string; draft: boolean; merged: boolean; url: string | null }>;
  latestCommit: { shortSha: string; message: string; committedAt: string | null; url: string | null } | null;
  latestWorkflow: { name: string; status: string; conclusion: string | null; url: string | null } | null;
};
type Feed = {
  generatedAt: string;
  repositories: RepoFeed[];
  piTestnet: { status: string; identityVerified: boolean; latestLedger?: { sequence?: number | null } | null; notice?: string };
  safety: { readOnly: boolean; mainnetWrites: boolean; signingEnabled: boolean };
};

const endpoint = "/api/ecosystem-feed";

export default function EcosystemSync() {
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
    const timer = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const openCount = feed?.repositories.reduce((sum, repo) => sum + repo.openPullRequests.length, 0) ?? 0;
  const failed = feed?.repositories.filter((repo) => repo.status !== "ok").length ?? 0;
  const networkLabel = feed?.piTestnet.identityVerified ? "TESTNET ID VERIFIED" : feed?.piTestnet.status || "WAITING";

  return (
    <section className="mb-4 rounded-xl border border-border bg-panel/70 p-3" aria-live="polite" aria-label="Live ecosystem synchronization">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Activity size={15} className="text-[#d8b56d]" />
          Ecosystem API Sync
        </div>
        <span className="text-[11px] text-muted flex items-center gap-1"><GitBranch size={12} /> {feed ? `${openCount} open PRs · 3 repositories` : loading ? "Connecting…" : "Feed unavailable"}</span>
        <span className={`text-[11px] flex items-center gap-1 ${feed?.piTestnet.identityVerified ? "text-emerald-400" : "text-amber-300"}`}>
          {feed?.piTestnet.identityVerified ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
          {networkLabel}
          {feed?.piTestnet.latestLedger?.sequence ? ` · Ledger ${feed.piTestnet.latestLedger.sequence}` : ""}
        </span>
        <button type="button" onClick={() => void refresh()} className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted hover:text-text" aria-label="Refresh ecosystem feed">
          <RefreshCw size={12} /> Refresh
        </button>
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
                {repo.openPullRequests.length === 0 && <span className="text-[10px] text-muted">No open PRs</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {feed && <p className="mt-2 text-[10px] text-muted">Updated {new Date(feed.generatedAt).toLocaleTimeString()} · Read-only API · no signing or Mainnet writes{failed ? ` · ${failed} partial repository feeds` : ""}</p>}
    </section>
  );
}
