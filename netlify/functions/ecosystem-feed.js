const REPOSITORIES = [
  "Ze0ro99/PiRC",
  "Ze0ro99/SmartContracts",
  "Ze0ro99/project-unity-sphere-0e2c810d",
];
const PI_RPC = "https://rpc.testnet.minepi.com";
const PI_HORIZON = "https://api.testnet.minepi.com";
const EXPECTED_PASSPHRASE = "Pi Testnet";
const CACHE_SECONDS = 600;

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": `public, max-age=15, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=30`,
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "X-Content-Type-Options": "nosniff",
};

async function getJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(8000),
    headers: {
      Accept: "application/vnd.github+json, application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`upstream_http_${response.status}`);
  return response.json();
}

function compactPull(pull) {
  return {
    number: pull.number,
    title: String(pull.title || "").slice(0, 180),
    state: pull.state,
    draft: Boolean(pull.draft),
    merged: Boolean(pull.merged_at),
    mergeable: pull.mergeable,
    branch: pull.head?.ref || null,
    headSha: pull.head?.sha || null,
    updatedAt: pull.updated_at || null,
    url: pull.html_url || null,
  };
}

function compactRun(run) {
  return {
    name: String(run.name || run.display_title || "Workflow").slice(0, 120),
    status: run.status || "unknown",
    conclusion: run.conclusion || null,
    updatedAt: run.updated_at || run.created_at || null,
    url: run.html_url || null,
    headSha: run.head_sha || null,
  };
}

function compactEvent(event) {
  const payload = event.payload || {};
  const pull = payload.pull_request;
  const issue = payload.issue;
  const release = payload.release;
  return {
    id: String(event.id || ""),
    type: String(event.type || "UnknownEvent"),
    actor: String(event.actor?.login || "unknown"),
    createdAt: event.created_at || null,
    action: payload.action ? String(payload.action).slice(0, 40) : null,
    title: String(pull?.title || issue?.title || release?.name || "").slice(0, 140) || null,
    number: pull?.number || issue?.number || null,
    ref: payload.ref ? String(payload.ref).slice(0, 160) : null,
    commitCount: Array.isArray(payload.commits) ? payload.commits.length : null,
    url: pull?.html_url || issue?.html_url || release?.html_url || null,
  };
}

async function githubRepositoryFeed(repository) {
  const [runsResult, eventsResult] = await Promise.allSettled([
    getJson(`https://api.github.com/repos/${repository}/actions/runs?per_page=1`),
    getJson(`https://api.github.com/repos/${repository}/events?per_page=8`),
  ]);

  const rawEvents = eventsResult.status === "fulfilled" && Array.isArray(eventsResult.value)
    ? eventsResult.value
    : [];
  const pulls = rawEvents
    .filter((event) => event.type === "PullRequestEvent" && event.payload?.pull_request?.state === "open")
    .map((event) => compactPull(event.payload.pull_request))
    .filter((pull, index, all) => all.findIndex((item) => item.number === pull.number) === index)
    .slice(0, 8);
  const pushEvent = rawEvents.find((event) => event.type === "PushEvent" && Array.isArray(event.payload?.commits) && event.payload.commits.length > 0);
  const pushedCommit = pushEvent?.payload.commits?.at(-1) || null;
  const commit = pushedCommit ? {
    sha: pushedCommit.sha,
    commit: { message: pushedCommit.message, committer: { date: pushEvent.created_at } },
    html_url: `https://github.com/${repository}/commit/${pushedCommit.sha}`,
  } : null;
  const run = runsResult.status === "fulfilled"
    ? runsResult.value.workflow_runs?.[0] || null
    : null;
  const events = rawEvents.map(compactEvent);
  const failures = [runsResult, eventsResult]
    .filter((result) => result.status === "rejected").length;

  return {
    repository,
    status: failures === 0 ? "ok" : failures === 3 ? "unavailable" : "partial",
    openPullRequests: pulls,
    latestCommit: commit ? {
      sha: commit.sha,
      shortSha: commit.sha?.slice(0, 10),
      message: String(commit.commit?.message || "").split("\n")[0].slice(0, 180),
      committedAt: commit.commit?.committer?.date || null,
      url: commit.html_url || null,
    } : null,
    latestWorkflow: run ? compactRun(run) : null,
    recentEvents: events,
    failedSources: failures,
  };
}

async function rpc(method) {
  const payload = await getJson(PI_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: method, method, params: {} }),
  });
  if (payload.error || !payload.result || typeof payload.result !== "object") {
    throw new Error("pi_rpc_invalid_response");
  }
  return payload.result;
}

async function piTestnetStatus() {
  const [networkResult, healthResult, ledgerResult, horizonResult] = await Promise.allSettled([
    rpc("getNetwork"),
    rpc("getHealth"),
    rpc("getLatestLedger"),
    getJson(`${PI_HORIZON}/`),
  ]);
  const network = networkResult.status === "fulfilled" ? networkResult.value : null;
  const health = healthResult.status === "fulfilled" ? healthResult.value : null;
  const ledger = ledgerResult.status === "fulfilled" ? ledgerResult.value : null;
  const horizon = horizonResult.status === "fulfilled" ? horizonResult.value : null;
  const passphrase = network?.passphrase || network?.networkPassphrase || null;
  const horizonPassphrase = horizon?.network_passphrase || null;
  const identityVerified = Boolean(
    passphrase === EXPECTED_PASSPHRASE &&
    horizonPassphrase === EXPECTED_PASSPHRASE &&
    health && ["healthy", "ok"].includes(String(health.status || "").toLowerCase()) &&
    ledger?.id
  );
  const reachable = Boolean(network && health && ledger && horizon);
  return {
    networkId: "pi-testnet1",
    networkAlias: "Testnet1",
    status: identityVerified ? "IDENTITY_VERIFIED" : reachable ? "REACHABLE_UNVERIFIED" : "DEGRADED",
    identityVerified,
    protocolVersion: network?.protocolVersion ?? null,
    latestLedger: ledger ? {
      sequence: ledger.sequence ?? null,
      hash: ledger.id ?? null,
      closeTime: ledger.closeTime ?? null,
    } : null,
    rpcHealth: health ? {
      status: health.status || "unknown",
      latestLedger: health.latestLedger ?? null,
      oldestLedger: health.oldestLedger ?? null,
    } : null,
    sourceStatus: {
      sorobanNetwork: networkResult.status,
      rpcHealth: healthResult.status,
      latestLedger: ledgerResult.status,
      horizonRoot: horizonResult.status,
    },
    contractEvents: "NOT_INGESTED",
    contractVerification: "NOT_PERFORMED",
    notice: "Read-only network status only; no contract balances, liquidity, event finality, signatures or transactions are asserted.",
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: jsonHeaders, body: "" };
  }
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers: { ...jsonHeaders, Allow: "GET, OPTIONS" }, body: JSON.stringify({ error: "method_not_allowed" }) };
  }

  const [repositories, network] = await Promise.all([
    Promise.all(REPOSITORIES.map(async (repository) => {
      try {
        return await githubRepositoryFeed(repository);
      } catch {
        return { repository, status: "unavailable", openPullRequests: [], latestCommit: null, latestWorkflow: null, recentEvents: [], failedSources: 2 };
      }
    })),
    piTestnetStatus().catch(() => ({
      networkId: "pi-testnet1",
      networkAlias: "Testnet1",
      status: "DEGRADED",
      identityVerified: false,
      latestLedger: null,
      contractEvents: "NOT_INGESTED",
      contractVerification: "NOT_PERFORMED",
      notice: "Read-only network probe unavailable; no on-chain state is inferred.",
    })),
  ]);

  const failedRepositories = repositories.filter((item) => item.status === "unavailable").length;
  return {
    statusCode: 200,
    headers: jsonHeaders,
    body: JSON.stringify({
      schemaVersion: "pirc.ecosystem-feed.v1",
      generatedAt: new Date().toISOString(),
      refreshAfterSeconds: CACHE_SECONDS,
      sourceStatus: failedRepositories === repositories.length ? "PARTIAL" : "AVAILABLE",
      repositories,
      piTestnet: network,
      safety: {
        readOnly: true,
        mainnetWrites: false,
        signingEnabled: false,
        tokenTransfersEnabled: false,
        liquidityInvented: false,
      },
    }),
  };
};
