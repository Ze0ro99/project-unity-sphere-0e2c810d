// Server-only helper: fetches the canonical PiRC files from raw.githubusercontent.com
// and upserts them into public.pirc_snapshots. Used by the GitHub webhook
// and by the manual sync server function.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const RAW = "https://raw.githubusercontent.com/Ze0ro99/PiRC/main";

export const PIRC_FILES = [
  "CONTRACTS_REGISTRY.json",
  "7_layer_packets.json",
  "sovereign_manifest.json",
  "LIVE_MATRIX_REGISTRY.csv",
] as const;

export type ImportResult = {
  path: string;
  ok: boolean;
  bytes: number;
  error?: string;
};

export async function importPircFile(path: string, commitSha?: string): Promise<ImportResult> {
  try {
    const res = await fetch(`${RAW}/${path}`, { cache: "no-store" });
    if (!res.ok) return { path, ok: false, bytes: 0, error: `${res.status} ${res.statusText}` };
    const text = await res.text();
    let content: unknown = null;
    if (path.endsWith(".json")) {
      try { content = JSON.parse(text); } catch { /* keep raw_text only */ }
    } else if (path.endsWith(".csv")) {
      const [header, ...rows] = text.trim().split(/\r?\n/);
      const cols = header.split(",").map((c) => c.trim());
      content = rows.map((line) => {
        const cells: string[] = [];
        let cur = ""; let q = false;
        for (const ch of line) {
          if (ch === '"') { q = !q; continue; }
          if (ch === "," && !q) { cells.push(cur); cur = ""; continue; }
          cur += ch;
        }
        cells.push(cur);
        return Object.fromEntries(cols.map((c, i) => [c, (cells[i] ?? "").trim()]));
      });
    }
    const { error } = await supabaseAdmin
      .from("pirc_snapshots")
      .upsert(
        {
          path,
          commit_sha: commitSha ?? null,
          content: content as never,
          raw_text: text.slice(0, 200_000),
          bytes: text.length,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: "path" },
      );
    if (error) return { path, ok: false, bytes: text.length, error: error.message };
    return { path, ok: true, bytes: text.length };
  } catch (e) {
    return { path, ok: false, bytes: 0, error: (e as Error).message };
  }
}

export async function importAllPirc(commitSha?: string): Promise<ImportResult[]> {
  return Promise.all(PIRC_FILES.map((p) => importPircFile(p, commitSha)));
}
