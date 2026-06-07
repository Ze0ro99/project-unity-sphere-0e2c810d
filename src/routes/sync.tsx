import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listBranches, listTree, readFile } from "@/lib/github.functions";
import { GitBranch, FileCode2, FolderTree, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/sync")({
  head: () => ({ meta: [
    { title: "Repository Sync — PiRC" },
    { name: "description", content: "Live browser for the Ze0ro99/PiRC sovereign monorepo: 126 branches, 300+ standards and contracts." },
  ] }),
  component: SyncPage,
});

function SyncPage() {
  const branchesFn = useServerFn(listBranches);
  const treeFn = useServerFn(listTree);
  const readFn = useServerFn(readFile);

  const [branch, setBranch] = useState("main");
  const [path, setPath] = useState("");
  const [filter, setFilter] = useState("");
  const [content, setContent] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  const branchesQ = useQuery({ queryKey: ["gh-branches"], queryFn: () => branchesFn() });
  const treeQ = useQuery({
    queryKey: ["gh-tree", branch],
    queryFn: () => treeFn({ data: { branch } }),
    enabled: !!branch,
  });

  const open = async (p: string) => {
    setPath(p);
    setReading(true);
    setContent(null);
    try {
      const res = await readFn({ data: { branch, path: p } });
      setContent(res.content || "[empty]");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setReading(false);
    }
  };

  const entries = (treeQ.data?.entries ?? []).filter(
    (e) => e.type === "blob" && (!filter || e.path.toLowerCase().includes(filter.toLowerCase())),
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 space-y-6">
        <header>
          <Badge variant="outline" className="gold-border text-gold mb-3"><GitBranch className="h-3 w-3 mr-1" /> Ze0ro99/PiRC</Badge>
          <h1 className="text-3xl font-bold text-foreground">Repository Sync</h1>
          <p className="text-muted-foreground text-sm mt-2">Live, read-only mirror of the sovereign PiRC monorepo — browse all branches, standards and contract sources in real time.</p>
        </header>

        <div className="grid lg:grid-cols-3 gap-5">
          <Card className="glass border-0 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><GitBranch className="h-4 w-4 text-gold" /> Branches</h2>
              <span className="text-xs text-muted-foreground">{branchesQ.data?.length ?? "…"}</span>
            </div>
            {branchesQ.isLoading && <Loader2 className="h-4 w-4 animate-spin text-gold" />}
            {branchesQ.error && <p className="text-xs text-destructive">Rate-limited or offline. Try again later.</p>}
            <div className="max-h-[480px] overflow-y-auto space-y-1">
              {branchesQ.data?.map((b) => (
                <button
                  key={b.name}
                  onClick={() => { setBranch(b.name); setContent(null); setPath(""); }}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs font-mono truncate ${branch === b.name ? "bg-gold/20 text-gold" : "text-muted-foreground hover:bg-secondary/40"}`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </Card>

          <Card className="glass border-0 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><FolderTree className="h-4 w-4 text-gold" /> Files</h2>
              <span className="text-xs text-muted-foreground">{entries.length}</span>
            </div>
            <Input placeholder="Filter…" value={filter} onChange={(e) => setFilter(e.target.value)} className="mb-3 h-8 text-xs" />
            {treeQ.isLoading && <Loader2 className="h-4 w-4 animate-spin text-gold" />}
            <div className="max-h-[440px] overflow-y-auto space-y-0.5">
              {entries.slice(0, 200).map((e) => (
                <button
                  key={e.path}
                  onClick={() => open(e.path)}
                  className={`w-full text-left px-2 py-1 rounded text-xs font-mono truncate ${path === e.path ? "bg-gold/20 text-gold" : "text-muted-foreground hover:bg-secondary/40"}`}
                >
                  {e.path}
                </button>
              ))}
              {treeQ.data?.truncated && <div className="text-[10px] text-muted-foreground mt-2">Tree truncated by GitHub API.</div>}
            </div>
          </Card>

          <Card className="glass border-0 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><FileCode2 className="h-4 w-4 text-gold" /> Source</h2>
              {content && (
                <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(content); toast.success("Copied"); }}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono mb-2 truncate">{path || "Select a file"}</div>
            {reading && <Loader2 className="h-4 w-4 animate-spin text-gold" />}
            <pre className="max-h-[440px] overflow-auto bg-background/60 rounded p-3 text-[11px] leading-relaxed text-foreground font-mono whitespace-pre-wrap">
              {content || (!reading && "// File preview")}
            </pre>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
