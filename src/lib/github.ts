// Live read-only client for the canonical PiRC monorepo on GitHub.
export const REPO_OWNER = "Ze0ro99";
export const REPO_NAME = "PiRC";
export const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
const API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
export const RAW = (branch: string, path: string) =>
  `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${branch}/${path}`;

async function gh<T>(path: string): Promise<T> {
  const r = await fetch(`${API}${path}`, { headers: { Accept: "application/vnd.github+json" } });
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${r.statusText}`);
  return r.json() as Promise<T>;
}

export type RepoMeta = {
  full_name: string;
  description: string | null;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string;
  size: number;
  license?: { spdx_id?: string } | null;
};

export type Branch = { name: string; commit: { sha: string; url: string }; protected: boolean };

export type Commit = {
  sha: string;
  commit: { message: string; author: { name: string; date: string } };
  html_url: string;
};

export type TreeEntry = { path: string; type: "blob" | "tree"; size?: number; sha: string };

export const fetchRepoMeta = () => gh<RepoMeta>("");
export const fetchBranches = () => gh<Branch[]>("/branches?per_page=100");
export const fetchCommits = (branch: string, limit = 12) =>
  gh<Commit[]>(`/commits?sha=${encodeURIComponent(branch)}&per_page=${limit}`);

export async function fetchTree(branch: string): Promise<TreeEntry[]> {
  const data = await gh<{ tree: TreeEntry[]; truncated: boolean }>(
    `/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  );
  return data.tree ?? [];
}

export type RepoStats = {
  files: number;
  markdown: number;
  standards: number;
  contracts: { sol: number; rs: number; total: number };
  workflows: string[];
  scripts: number;
  schemas: number;
  hasWebhook: boolean;
};

const STANDARD_RE = /pirc[-_ ]?(\d{1,4})/i;

export function analyzeTree(tree: TreeEntry[]): RepoStats {
  const blobs = tree.filter((t) => t.type === "blob");
  const standards = new Set<string>();
  let sol = 0;
  let rs = 0;
  let markdown = 0;
  let scripts = 0;
  let schemas = 0;
  const workflows: string[] = [];
  let hasWebhook = false;

  for (const b of blobs) {
    const p = b.path;
    const lower = p.toLowerCase();
    if (lower.endsWith(".md")) markdown++;
    if (lower.endsWith(".sol")) sol++;
    if (lower.endsWith(".rs")) rs++;
    if (lower.endsWith(".sh")) scripts++;
    if (lower.includes("schema") && lower.endsWith(".json")) schemas++;
    if (lower.startsWith(".github/workflows/")) workflows.push(p.replace(".github/workflows/", ""));
    if (lower.includes("webhook")) hasWebhook = true;
    const m = STANDARD_RE.exec(p);
    if (m) standards.add(m[1].replace(/^0+/, ""));
  }

  return {
    files: blobs.length,
    markdown,
    standards: standards.size,
    contracts: { sol, rs, total: sol + rs },
    workflows,
    scripts,
    schemas,
    hasWebhook,
  };
}

/** Canonical config files the exchange depends on. */
export const CANONICAL_FILES = [
  "schemas/pirc207_layers.json",
  ".well-known/pi.toml",
  "assets/js/constants.js",
  "contracts/PiRC_7Layers_Config.sol",
  "README.md",
];

export async function fetchRaw(branch: string, path: string): Promise<string> {
  const r = await fetch(RAW(branch, path));
  if (!r.ok) throw new Error(`${r.status}`);
  return r.text();
}
