import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { Octokit } from "octokit";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  
  // GitHub Integration Routes
  const getOctokit = () => {
    const pat = process.env.GITHUB_PAT;
    return new Octokit({ auth: pat });
  };

  const REPO_OWNER = "Ze0ro99";
  const REPO_NAME = "PiRC";

  app.get("/api/github/branches", async (req, res) => {
    try {
      const octokit = getOctokit();
      const response = await octokit.rest.repos.listBranches({
        owner: REPO_OWNER,
        repo: REPO_NAME,
      });
      res.json({ status: "success", data: response.data.map((b: any) => b.name) });
    } catch (error: any) {
      console.error("GitHub API Error (branches):", error.message);
      res.status(500).json({ error: "Failed to fetch branches from GitHub" });
    }
  });

  app.get("/api/github/tree", async (req, res) => {
    try {
      const { branch = "main" } = req.query;
      const octokit = getOctokit();
      const branchInfo = await octokit.rest.repos.getBranch({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        branch: branch as string,
      });
      const sha = branchInfo.data.commit.sha;
      const treeResponse = await octokit.rest.git.getTree({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        tree_sha: sha,
        recursive: "1",
      });
      res.json({ status: "success", data: treeResponse.data.tree });
    } catch (error: any) {
      console.error("GitHub API Error (tree):", error.message);
      res.status(500).json({ error: "Failed to fetch repository tree" });
    }
  });

  app.get("/api/github/file", async (req, res) => {
    try {
      const { path, branch = "main" } = req.query;
      if (!path) return res.status(400).json({ error: "Path is required" });
      
      const octokit = getOctokit();
      const response = await octokit.rest.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: path as string,
        ref: branch as string,
      });

      if (Array.isArray(response.data)) {
        res.status(400).json({ error: "Requested path is a directory" });
        return;
      }
      
      if (response.data.type === "file" && 'content' in response.data) {
         // Content is base64 encoded
         const content = Buffer.from(response.data.content, 'base64').toString('utf8');
         res.json({ status: "success", data: { content, name: response.data.name, path: response.data.path }});
      } else {
        res.status(404).json({ error: "File not found or not a valid file" });
      }
    } catch (error: any) {
      console.error("GitHub API Error (file):", error.message);
      res.status(500).json({ error: "Failed to fetch file content" });
    }
  });

  app.post("/api/github/import", async (req, res) => {
    try {
      const { path: filePath, content } = req.body;
      if (!filePath || !content) {
         return res.status(400).json({ error: "Path and content are required" });
      }
      
      const fs = require('fs');
      const p = require('path');
      
      // Determine local path safely within project directory
      const localPath = p.join(process.cwd(), 'imported', filePath);
      
      // Ensure directory exists
      fs.mkdirSync(p.dirname(localPath), { recursive: true });
      fs.writeFileSync(localPath, content, 'utf8');
      
      res.json({ status: "success", message: `File imported to imported/${filePath}` });
    } catch (error: any) {
      console.error("Import Error:", error.message);
      res.status(500).json({ error: "Failed to import file" });
    }
  });

  // Pi Network Auth Validation
  app.post("/api/auth", async (req, res) => {
    try {
      const { accessToken } = req.body;
      if (typeof accessToken !== "string" || accessToken.length < 10 || accessToken.length > 4096) {
        return res.status(400).json({ error: "invalid_request" });
      }

      // Validate access token against Pi Network API
      const piResponse = await fetch("https://api.minepi.com/v2/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!piResponse.ok) {
        throw new Error("Invalid access token");
      }

      const userData = await piResponse.json();
      
      // Here you would typically establish a session, save to DB, etc.
      // For now, we return the validated user data to the frontend
      res.json({ 
        authenticated: true, 
        user: userData,
      });
    } catch (error: any) {
      console.error("Pi Auth Error:", error.message);
      res.status(401).json({ error: "Authentication failed" });
    }
  });

  // Pi Platform API: fail closed when the server key is missing.
  const PI_NETWORK_API_KEY = process.env.PI_API_KEY || process.env.PI_NETWORK_API_KEY;

  const verifyPiUser = async (accessToken: string) => {
    if (!accessToken || accessToken.length < 10 || accessToken.length > 4096) {
      throw new Error("unauthorized");
    }
    const response = await fetch("https://api.minepi.com/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error("unauthorized");
    const user = await response.json();
    if (!user?.uid) throw new Error("unauthorized");
    return user as { uid: string; username?: string };
  };

  const callPiApi = async (method: string, endpoint: string, body?: unknown) => {
    if (!PI_NETWORK_API_KEY) throw new Error("PI_API_KEY_NOT_CONFIGURED");
    if (process.env.PI_PAYMENTS_ENABLED !== "true") throw new Error("PI_PAYMENTS_DISABLED");
    const response = await fetch(`https://api.minepi.com${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${PI_NETWORK_API_KEY}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) {
      console.error("Pi Platform API rejected request", response.status, text.slice(0, 300));
      throw new Error(`PI_UPSTREAM_${response.status}`);
    }
    return text ? JSON.parse(text) : {};
  };

  const validPaymentId = (value: unknown): value is string =>
    typeof value === "string" && /^[A-Za-z0-9_-]{4,128}$/.test(value);

  app.get("/api/payments/config", (_req, res) => {
    res.json({
      configured: Boolean(PI_NETWORK_API_KEY),
      mode: process.env.VITE_PI_SANDBOX === "false" ? "production" : "sandbox",
      paymentsEnabled: Boolean(PI_NETWORK_API_KEY) && process.env.PI_PAYMENTS_ENABLED === "true",
    });
  });

  app.post("/api/payments/approve", async (req, res) => {
    try {
      const { paymentId, accessToken } = req.body ?? {};
      if (!validPaymentId(paymentId) || typeof accessToken !== "string") {
        return res.status(400).json({ error: "invalid_request" });
      }
      const user = await verifyPiUser(accessToken);
      const payment = await callPiApi("GET", `/v2/payments/${paymentId}`);
      if (payment.user_uid !== user.uid) return res.status(403).json({ error: "forbidden" });
      if (payment.status?.developer_completed) return res.json({ status: "success", already: true, data: payment });
      if (payment.status?.developer_approved) return res.json({ status: "success", already: true, data: payment });
      const result = await callPiApi("POST", `/v2/payments/${paymentId}/approve`);
      return res.json({ status: "success", data: result });
    } catch (error: any) {
      const message = error?.message || "";
      const status = message === "unauthorized" ? 401 : message.startsWith("PI_UPSTREAM_404") ? 404 : (message === "PI_API_KEY_NOT_CONFIGURED" || message === "PI_PAYMENTS_DISABLED") ? 503 : 502;
      return res.status(status).json({ error: status === 401 ? "Unauthorized" : status === 404 ? "payment_not_found" : status === 503 ? (message === "PI_PAYMENTS_DISABLED" ? "payments_disabled" : "payments_not_configured") : "pi_platform_error" });
    }
  });

  app.post("/api/payments/complete", async (req, res) => {
    try {
      const { paymentId, txid, accessToken } = req.body ?? {};
      if (!validPaymentId(paymentId) || typeof txid !== "string" || !/^[A-Za-z0-9]{4,128}$/.test(txid) || typeof accessToken !== "string") {
        return res.status(400).json({ error: "invalid_request" });
      }
      const user = await verifyPiUser(accessToken);
      const payment = await callPiApi("GET", `/v2/payments/${paymentId}`);
      if (payment.user_uid !== user.uid) return res.status(403).json({ error: "forbidden" });
      if (payment.status?.developer_completed) return res.json({ status: "success", already: true, data: payment });
      if (!payment.status?.developer_approved) return res.status(409).json({ error: "payment_not_approved" });
      if (payment.transaction?.txid && payment.transaction.txid !== txid) return res.status(409).json({ error: "transaction_mismatch" });
      const result = await callPiApi("POST", `/v2/payments/${paymentId}/complete`, { txid });
      return res.json({ status: "success", data: result });
    } catch (error: any) {
      const message = error?.message || "";
      const status = message === "unauthorized" ? 401 : message.startsWith("PI_UPSTREAM_404") ? 404 : message === "PI_API_KEY_NOT_CONFIGURED" ? 503 : 502;
      return res.status(status).json({ error: status === 401 ? "Unauthorized" : status === 404 ? "payment_not_found" : status === 503 ? "payments_not_configured" : "pi_platform_error" });
    }
  });

  app.post("/api/payments/incomplete", async (req, res) => {
    try {
      const { paymentId, txid, accessToken } = req.body ?? {};
      if (!validPaymentId(paymentId) || typeof accessToken !== "string") {
        return res.status(400).json({ error: "invalid_request" });
      }
      const user = await verifyPiUser(accessToken);
      const payment = await callPiApi("GET", `/v2/payments/${paymentId}`);
      if (payment.user_uid !== user.uid) return res.status(403).json({ error: "forbidden" });
      if (payment.status?.developer_completed) return res.json({ status: "success", action: "already_completed", data: payment });
      const actualTxid = payment.transaction?.txid;
      if (txid && actualTxid && txid !== actualTxid) return res.status(409).json({ error: "transaction_mismatch" });
      if (!payment.status?.developer_approved) {
        await callPiApi("POST", `/v2/payments/${paymentId}/approve`);
      }
      if (!actualTxid) return res.json({ status: "success", action: "pending_transaction" });
      const completed = await callPiApi("POST", `/v2/payments/${paymentId}/complete`, { txid: actualTxid });
      return res.json({ status: "success", action: "completed", data: completed });
    } catch (error: any) {
      const message = error?.message || "";
      const status = message === "unauthorized" ? 401 : message.startsWith("PI_UPSTREAM_404") ? 404 : message === "PI_API_KEY_NOT_CONFIGURED" ? 503 : 502;
      return res.status(status).json({ error: status === 401 ? "Unauthorized" : status === 404 ? "payment_not_found" : status === 503 ? "payments_not_configured" : "pi_platform_error" });
    }
  });

  // Mock PiRC Matrix API
  app.get("/api/pirc_matrix", (req, res) => {
    res.json({
      status: "success",
      data: [
        { id: "L1", layer: "Physical", nodeCount: 1560, health: "Optimal", volume: "1.2M", timestamp: Date.now() },
        { id: "L2", layer: "Data Link", nodeCount: 1300, health: "Good", volume: "800k", timestamp: Date.now() },
        { id: "L3", layer: "Network", nodeCount: 3000, health: "Optimal", volume: "3.5M", timestamp: Date.now() },
        { id: "L4", layer: "Transport", nodeCount: 2200, health: "Warning", volume: "4.1M", timestamp: Date.now() },
        { id: "L5", layer: "Session", nodeCount: 1000, health: "Optimal", volume: "1.5M", timestamp: Date.now() },
        { id: "L6", layer: "Presentation", nodeCount: 850, health: "Optimal", volume: "900k", timestamp: Date.now() },
        { id: "L7", layer: "Application", nodeCount: 4500, health: "Optimal", volume: "8.2M", timestamp: Date.now() },
      ]
    });
  });

  // Mock Contracts Registry
  app.get("/api/contracts", (req, res) => {
    res.json({
      status: "success",
      data: [
        { id: "C-001", name: "PiRC Vault Soroban", status: "Active", tvl: 4500000, audits: "Passed" },
        { id: "C-002", name: "Matrix Matrix Subscription", status: "Deploying", tvl: 0, audits: "Pending" },
        { id: "C-003", name: "RWA Real Estate Tokenizer", status: "Active", tvl: 12500000, audits: "Passed" },
      ]
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
