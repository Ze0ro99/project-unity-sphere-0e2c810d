import { useEffect, useMemo, useState } from "react";
import {
  GitBranch, GitCommit, ShieldCheck, ShieldAlert, RefreshCw, FileCode2, FileText,
  Workflow, KeyRound, ExternalLink, Loader2,
} from "lucide-react";
import {
  REPO_URL, fetchRepoMeta, fetchBranches, fetchCommits, fetchTree, analyzeTree,
  fetchRaw, CANONICAL_FILES, type RepoMeta, type Branch, type Commit, type RepoStats,
} from "@/lib/github";
import { verifyStrKey } from "@/lib/strkey";
import { ISSUER, MASTER_REGISTRY, LAYERS } from "@/data/layers";
import { relTime, shorten } from "@/lib/pi";

type FileState = { path: string; status: "loading" | "ok" | "missing"; bytes?: number };

export default function Repository() {
  const [meta, setMeta] = useState<RepoMeta | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branch, setBranch] = useState<string>("");
  const [commits, setCommits] = useState<Commit[]>([]);
  const [stats, setStats] = useState<RepoStats | null>(null);
  const [files, setFiles] = useState<FileState[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadRepo() {
    setBusy(true);
    setErr(null);
    try {
      const [m, b] = await Promise.all([fetchRepoMeta(), fetchBranches()]);
      setMeta(m);
      setBranches(b);
      setBranch((prev) => prev || m.default_branch);
    } catch (e: any) {
      setErr(e?.message ?? "GitHub unreachable");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadRepo();
  }, []);

  useEffect(() => {
    if (!branch) return;
    let alive = true;
    setStats(null);
    setCommits([]);
    fetchCommits(branch).then((c) => alive && setCommits(c)).catch(() => alive && setCommits([]));
    fetchTree(branch)
      .then((t) => alive && setStats(analyzeTree(t)))
      .catch(() => alive && setStats(null));

    setFiles(CANONICAL_FILES.map((p) => ({ path: p, status: "loading" as const })));
    CANONICAL_FILES.forEach((p) => {
      fetchRaw(branch, p)
        .then((txt) => alive && setFiles((f) => f.map((x) => (x.path === p ? { ...x, status: "ok", bytes: txt.length } : x))))
        .catch(() => alive && setFiles((f) => f.map((x) => (x.path === p ? { ...x, status: "missing" } : x))));
    });
    return () => {
      alive = false;
    };
  }, [branch]);

  const keys = useMemo(
    () => [
      { label: "Sovereign Issuer", value: ISSUER, expected: "ed25519PublicKey" as const },
      { label: "Master Registry", value: MASTER_REGISTRY, expected: "contract" as const },
      ...LAYERS.map((l) => ({
        label: `${l.id} · ${l.name} (${l.role})`,
        value: l.address,
        expected: "contract" as const,
      })),
    ],
    [],
  );

  const keyResults = keys.map((k) => ({ ...k, check: verifyStrKey(k.value, k.expected) }));
  const validKeys = keyResults.filter((k) => k.check.valid).length;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Repository Integration</h1>
          <p className="text-xs text-muted mono">
            {meta?.full_name ?? "Ze0ro99/PiRC"} · live via GitHub API
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border hover:bg-panel2"
          >
            <ExternalLink size={14} /> GitHub
          </a>
          <button
            onClick={loadRepo}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border hover:bg-panel2"
          >
            <RefreshCw size={14} className={busy ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </header>

      {err && (
        <div className="rounded-lg border border-red/40 bg-red/10 px-3 py-2 text-xs text-red">
          {err} — GitHub public API is rate limited to 60 requests/hour per IP.
        </div>
      )}

      {/* Repo summary */}
      <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2">
        <Stat label="Default branch" value={meta?.default_branch ?? "—"} />
        <Stat label="Branches" value={branches.length || "—"} />
        <Stat label="Last push" value={meta ? relTime(meta.pushed_at) : "—"} />
        <Stat label="Tracked files" value={stats?.files ?? "…"} />
        <Stat label="Markdown docs" value={stats?.markdown ?? "…"} />
        <Stat label="Standards found" value={stats?.standards ?? "…"} />
        <Stat label="Solidity contracts" value={stats?.contracts.sol ?? "…"} />
        <Stat label="Rust / Soroban" value={stats?.contracts.rs ?? "…"} />
        <Stat label="Shell pipelines" value={stats?.scripts ?? "…"} />
        <Stat label="JSON schemas" value={stats?.schemas ?? "…"} />
        <Stat label="CI workflows" value={stats?.workflows.length ?? "…"} />
        <Stat label="Webhook present" value={stats ? (stats.hasWebhook ? "yes" : "no") : "…"} />
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Branches */}
        <Panel title="Branches" icon={GitBranch}>
          <div className="max-h-64 overflow-auto divide-y divide-border">
            {branches.length === 0 && <Empty />}
            {branches.map((b) => (
              <button
                key={b.name}
                onClick={() => setBranch(b.name)}
                className={`w-full flex items-center gap-2 px-2 py-2 text-left text-xs hover:bg-panel2 ${
                  branch === b.name ? "bg-panel2" : ""
                }`}
              >
                <GitBranch size={13} className="text-muted shrink-0" />
                <span className="mono truncate">{b.name}</span>
                {b.protected && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/15 text-gold">protected</span>}
                <span className="ml-auto mono text-muted">{shorten(b.commit.sha, 7, 0)}</span>
              </button>
            ))}
          </div>
        </Panel>

        {/* Commits */}
        <Panel title={`Recent commits · ${branch || "—"}`} icon={GitCommit}>
          <div className="max-h-64 overflow-auto divide-y divide-border">
            {commits.length === 0 && <Empty />}
            {commits.map((c) => (
              <a
                key={c.sha}
                href={c.html_url}
                target="_blank"
                rel="noreferrer noopener"
                className="block px-2 py-2 text-xs hover:bg-panel2"
              >
                <div className="truncate">{c.commit.message.split("\n")[0]}</div>
                <div className="mono text-[11px] text-muted">
                  {shorten(c.sha, 7, 0)} · {c.commit.author?.name} · {relTime(c.commit.author?.date)}
                </div>
              </a>
            ))}
          </div>
        </Panel>

        {/* CI */}
        <Panel title="Continuous integration" icon={Workflow}>
          <div className="p-2 flex flex-wrap gap-1.5">
            {!stats && <Empty />}
            {stats?.workflows.length === 0 && <span className="text-xs text-muted p-1">No workflows on this branch.</span>}
            {stats?.workflows.map((w) => (
              <span key={w} className="mono text-[11px] px-2 py-1 rounded border border-border bg-panel2">
                {w}
              </span>
            ))}
          </div>
        </Panel>

        {/* Canonical files */}
        <Panel title="Canonical exchange inputs" icon={FileCode2}>
          <div className="divide-y divide-border">
            {files.map((f) => (
              <div key={f.path} className="flex items-center gap-2 px-2 py-2 text-xs">
                <FileText size={13} className="text-muted shrink-0" />
                <span className="mono truncate">{f.path}</span>
                <span className="ml-auto">
                  {f.status === "loading" && <Loader2 size={13} className="animate-spin text-muted" />}
                  {f.status === "ok" && <span className="text-green mono">{f.bytes} B</span>}
                  {f.status === "missing" && <span className="text-muted mono">missing</span>}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Keys */}
      <Panel title={`Key & address verification — ${validKeys}/${keyResults.length} verified`} icon={KeyRound}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-muted">
              <tr className="border-b border-border">
                <th className="text-left font-medium px-2 py-2">Entity</th>
                <th className="text-left font-medium px-2 py-2">Key</th>
                <th className="text-left font-medium px-2 py-2">Type</th>
                <th className="text-left font-medium px-2 py-2">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {keyResults.map((k) => (
                <tr key={k.label}>
                  <td className="px-2 py-2 whitespace-nowrap">{k.label}</td>
                  <td className="px-2 py-2 mono text-muted">{shorten(k.value, 10, 6)}</td>
                  <td className="px-2 py-2 mono text-muted">{k.expected}</td>
                  <td className="px-2 py-2">
                    {k.check.valid ? (
                      <span className="inline-flex items-center gap-1 text-green">
                        <ShieldCheck size={13} /> verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red">
                        <ShieldAlert size={13} /> {k.check.reason}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-2 py-2 text-[11px] text-muted">
          Validation performs full strkey decoding: base32 alphabet, 35-byte payload, version byte and CRC16-XModem
          checksum. Keys that fail here are never sent to Horizon, which is why the 7-layer registry shows an
          "unpublished" state instead of fabricated metrics.
        </p>
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-panel px-3 py-2">
      <div className="text-[11px] text-muted truncate">{label}</div>
      <div className="text-base font-semibold mono truncate">{value}</div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-panel overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border text-xs font-semibold">
        <Icon size={14} className="text-muted" /> {title}
      </div>
      {children}
    </section>
  );
}

function Empty() {
  return <div className="px-2 py-4 text-xs text-muted flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> Loading…</div>;
}
