#!/bin/bash
# ================================================
# PiRC → project-unity-sphere v4.2 - Full Auto Sync
# With GitHub Actions Support
# ================================================

set -euo pipefail

echo "🚀 Starting Professional PiRC → Unity Sphere Sync v4.2..."

WORKSPACE="$HOME/PiRC_Ecosystem"
UNITY_DIR="$HOME/project-unity-sphere"
UNITY_REPO="https://github.com/Ze0ro99/project-unity-sphere.git"

# Clone / Update Unity Sphere
if [ ! -d "$UNITY_DIR" ]; then
    echo "Cloning project-unity-sphere..."
    git clone "$UNITY_REPO" "$UNITY_DIR"
else
    echo "Updating project-unity-sphere..."
    cd "$UNITY_DIR" && git pull origin main || true
fi

cd "$UNITY_DIR"

# Make Public
gh repo edit Ze0ro99/project-unity-sphere --visibility public 2>/dev/null || echo "→ Make it Public manually in GitHub"

# Create folders
mkdir -p src/config packages docs

# Smart Sync
echo "Syncing latest from PiRC..."
rsync -av --delete --exclude='.git' --exclude='target/' --exclude='node_modules/' "$WORKSPACE/apps/frontend/" ./
rsync -av --delete --exclude='.git' "$WORKSPACE/packages/" ./packages/ 2>/dev/null || true
rsync -av --delete --exclude='.git' "$WORKSPACE/docs/" ./docs/ 2>/dev/null || true

# API Config
cat > src/config/api.ts << 'EOF'
export const API_CONFIG = {
  PI_TESTNET_RPC: "https://rpc.testnet.minepi.com",
  PI_MAINNET_RPC: "https://rpc.mainnet.minepi.com",
  SOROBAN_RPC: "https://soroban-rpc.testnet.stellar.org",
  PIDEX_TESTNET: "https://pidex.testnet.minepi.com",
  BASE_URL: "https://project-unity-sphere.lovable.app",
  VERSION: "3.2.0",
  SYNC_MODE: "bidirectional",
  LAST_SYNC: "$(date '+%Y-%m-%d %H:%M:%S UTC')"
};
export default API_CONFIG;
EOF

# Commit & Push
git add .
git commit -m "chore: auto-sync from PiRC Core - $(date '+%Y-%m-%d %H:%M:%S UTC')" || echo "No changes"
git push origin main --force-with-lease

echo "✅ Sync completed successfully!"chmod +x sync-to-unity-sphere.sh
