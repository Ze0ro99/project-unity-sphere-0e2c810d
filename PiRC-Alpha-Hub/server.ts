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
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
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
        sessionId: Math.random().toString(36).substring(7)
      });
    } catch (error: any) {
      console.error("Pi Auth Error:", error.message);
      res.status(401).json({ error: "Authentication failed" });
    }
  });

  // Pi Network Payments Implementation
  const PI_NETWORK_API_KEY = process.env.PI_NETWORK_API_KEY;

  const callPiApi = async (method: string, endpoint: string, body?: any) => {
    if (!PI_NETWORK_API_KEY) {
      console.warn(`[Mock Pi API] PI_NETWORK_API_KEY is not set. Simulating response for ${method} ${endpoint}`);
      
      const paymentId = endpoint.split("/")[3] || "mock_payment_id";
      
      if (endpoint.endsWith("/approve")) {
        return {
          identifier: paymentId,
          amount: body?.amount || 1.0,
          memo: "Mock Approved Payment",
          status: { developer_approved: true, developer_completed: false },
          transaction: null,
        };
      } else if (endpoint.endsWith("/complete")) {
        return {
          identifier: paymentId,
          amount: body?.amount || 1.0,
          memo: "Mock Completed Payment",
          status: { developer_approved: true, developer_completed: true },
          transaction: { txid: body?.txid || "mock_txid_12345" },
        };
      } else {
        // GET payment status
        return {
          identifier: paymentId,
          amount: 1.0,
          memo: "Mock Payment Status",
          status: { developer_approved: true, developer_completed: false },
          transaction: { txid: "mock_txid_12345" },
        };
      }
    }

    const response = await fetch(`https://api.minepi.com${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${PI_NETWORK_API_KEY}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Pi API error (${response.status}): ${text}`);
    }
    return await response.json();
  };

  // Check if Pi API key is configured
  app.get("/api/payments/config", (req, res) => {
    res.json({
      configured: !!PI_NETWORK_API_KEY,
    });
  });

  // Approve a payment (called by onReadyForServerApproval)
  app.post("/api/payments/approve", async (req, res) => {
    try {
      const { paymentId } = req.body;
      if (!paymentId) {
        return res.status(400).json({ error: "paymentId is required" });
      }

      console.log(`Approving payment ${paymentId}...`);
      const approvalResult = await callPiApi("POST", `/v2/payments/${paymentId}/approve`);
      console.log(`Payment ${paymentId} approved successfully:`, approvalResult);
      
      res.json({ status: "success", data: approvalResult });
    } catch (error: any) {
      console.error(`Error approving payment:`, error.message);
      res.status(500).json({ error: error.message || "Failed to approve payment" });
    }
  });

  // Complete a payment (called by onReadyForServerCompletion)
  app.post("/api/payments/complete", async (req, res) => {
    try {
      const { paymentId, txid } = req.body;
      if (!paymentId || !txid) {
        return res.status(400).json({ error: "paymentId and txid are required" });
      }

      console.log(`Completing payment ${paymentId} with txid ${txid}...`);
      const completionResult = await callPiApi("POST", `/v2/payments/${paymentId}/complete`, { txid });
      console.log(`Payment ${paymentId} completed successfully:`, completionResult);
      
      res.json({ status: "success", data: completionResult });
    } catch (error: any) {
      console.error(`Error completing payment:`, error.message);
      res.status(500).json({ error: error.message || "Failed to complete payment" });
    }
  });

  // Handle incomplete payments
  app.post("/api/payments/incomplete", async (req, res) => {
    try {
      const { paymentId, txid } = req.body;
      if (!paymentId) {
        return res.status(400).json({ error: "paymentId is required" });
      }

      console.log(`Processing incomplete payment ${paymentId}...`);
      
      // Fetch current status from Pi Network
      const paymentInfo = await callPiApi("GET", `/v2/payments/${paymentId}`);
      console.log(`Incomplete payment status retrieved:`, paymentInfo);
      
      let result = { action: "none", data: paymentInfo };
      
      // If not approved, approve it
      if (!paymentInfo.status?.developer_approved) {
        console.log(`Incomplete payment ${paymentId} is not approved. Approving...`);
        const approveData = await callPiApi("POST", `/v2/payments/${paymentId}/approve`);
        result = { action: "approved", data: approveData };
      } 
      // If approved but not completed
      else if (!paymentInfo.status?.developer_completed) {
        // We need a txid to complete. Let's find it.
        const actualTxid = txid || paymentInfo.transaction?.txid;
        if (actualTxid) {
          console.log(`Incomplete payment ${paymentId} is approved but not completed. Completing with txid ${actualTxid}...`);
          const completeData = await callPiApi("POST", `/v2/payments/${paymentId}/complete`, { txid: actualTxid });
          result = { action: "completed", data: completeData };
        } else {
          console.log(`Incomplete payment ${paymentId} is approved but lacks transaction ID. Cannot complete yet.`);
          result = { action: "pending_transaction", data: paymentInfo };
        }
      } else {
        console.log(`Incomplete payment ${paymentId} is already fully approved and completed.`);
        result = { action: "already_completed", data: paymentInfo };
      }

      res.json({ status: "success", ...result });
    } catch (error: any) {
      console.error(`Error processing incomplete payment:`, error.message);
      res.status(500).json({ error: error.message || "Failed to process incomplete payment" });
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
