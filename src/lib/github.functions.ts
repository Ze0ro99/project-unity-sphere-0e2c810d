import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public GitHub API — no auth required for public repos. Rate limited
// (60 req/h per IP) but sufficient for browsing the PiRC repository.
const OWNER = "Ze0ro99";
const REPO = "PiRC";

const githubFetch = async (path: string) => {
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}${path}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "pirc-app" },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  return res.json();
};

export const listBranches = createServerFn({ method: "GET" }).handler(async () => {
  const data = (await githubFetch(`/branches?per_page=100`)) as Array<{ name: string; commit: { sha: string } }>;
  return data.map((b) => ({ name: b.name, sha: b.commit.sha }));
});

export const listTree = createServerFn({ method: "POST" })
  .inputValidator((d: { branch: string }) => z.object({ branch: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const branch = (await githubFetch(`/branches/${encodeURIComponent(data.branch)}`)) as { commit: { commit: { tree: { sha: string } } } };
    const sha = branch.commit.commit.tree.sha;
    const tree = (await githubFetch(`/git/trees/${sha}?recursive=1`)) as {
      tree: Array<{ path: string; type: string; size?: number }>;
      truncated: boolean;
    };
    return {
      truncated: tree.truncated,
      entries: tree.tree.slice(0, 500).map((e) => ({ path: e.path, type: e.type, size: e.size ?? 0 })),
    };
  });

export const readFile = createServerFn({ method: "POST" })
  .inputValidator((d: { branch: string; path: string }) =>
    z.object({ branch: z.string().min(1).max(200), path: z.string().min(1).max(500) }).parse(d),
  )
  .handler(async ({ data }) => {
    const file = (await githubFetch(`/contents/${encodeURIComponent(data.path)}?ref=${encodeURIComponent(data.branch)}`)) as {
      content?: string;
      encoding?: string;
      size: number;
      name: string;
    };
    let content = "";
    if (file.content && file.encoding === "base64") {
      try {
        content = atob(file.content.replace(/\n/g, ""));
      } catch {
        content = "[binary]";
      }
    }
    return { name: file.name, size: file.size, content: content.slice(0, 50_000) };
  });
