# Migration 001: Update Validator3 Configuration

**Related Commit:** `fda543d2f27af6a3eb4473355f693b99eaa11908`
**Automated Script:** `/migrations/001_update_validator3.sh`

---

## What This Migration Does

This migration updates your Stellar node to use the new **validator3** server.
If you started your node from 19.6.0 image, you can skip this migration.

> ⚠️ **Note:** Steps 2-4 (stellar-core config changes) apply **only to mainnet** nodes.
> Step 5 (Horizon database migration) applies to **all networks** (mainnet, testnet, etc.).

Here's what changes:
1. **Replaces the placeholder validator** - Changes "doesnotexistyet" to the real "validator3" with correct keys and address *(mainnet only)*
2. **Adds validator3 to your trusted peers** - So your node knows to connect to it *(mainnet only)*
3. **Switches to CDN for history** - Updates validator1 and validator2 to use faster HTTPS CDN URLs *(mainnet only)*
4. **Updates Horizon database** - Runs any pending database migrations *(all networks)*
5. **Restarts services** - Applies all changes *(mainnet only, if config changed)*

---

## Before You Start

✅ **You need:**
- Access to the Docker container (as root or stellar user)
- Container must be running
- About 5-10 minutes

⚠️ **Important:**
- This will require to restart stellar-core and horizon services
- Make sure you have a backup (we'll create one in Step 1)

---

## Step-by-Step Instructions

### Step 1: Create a Backup

First, let's save the current configuration in case we need to roll back.

```bash
# Create a timestamped backup folder
mkdir -p /opt/stellar/migration_backups/$(date +%Y%m%d_%H%M%S)

# Backup the stellar-core configuration
cp /opt/stellar/core/etc/stellar-core.cfg \
   /opt/stellar/migration_backups/$(date +%Y%m%d_%H%M%S)/stellar-core.cfg

# Confirm backup was created
ls -lh /opt/stellar/migration_backups/
```

✅ **You should see** your backup folder with the current timestamp.

---

### Step 2: Update the Validator3 Section

We need to replace the placeholder validator with the real validator3 configuration.

**Open the file:**
```bash
vi /opt/stellar/core/etc/stellar-core.cfg
```

**Find this section** (search for "doesnotexistyet"):
```toml
[[VALIDATORS]]
NAME="doesnotexistyet"
HOME_DOMAIN="pi-core-team"
PUBLIC_KEY="GDKG2ZYQHSALQCXYQXAWVTT5IRFCDU2R5Q2TSH4GIJC6W2XZ5L3IG2OV"
ADDRESS="127.0.0.1:31502"
HISTORY="curl -sf http://127.0.0.1:31503/{0} -o {1}"
```

**Replace it with:**
```toml
[[VALIDATORS]]
NAME="validator3"
HOME_DOMAIN="pi-core-team"
PUBLIC_KEY="GC2WFHQRXLCCYRGVH3IUB5GN5W7RX73Z3E7DIKNI5XSF2M5DCLLT3GYQ"
ADDRESS="34.64.104.0:31402"
HISTORY="curl -sf https://history.mainnet.minepi.com/{0} -o {1}"
```

**Check your work:**
```bash
grep -A5 'NAME="validator3"' /opt/stellar/core/etc/stellar-core.cfg
```

✅ **You should see** the validator3 section with the new public key starting with "GC2W..."

---

### Step 3: Add Validator3 to Trusted Peers

Now we need to tell your node to trust and connect to validator3.

**In the same file** (`/opt/stellar/core/etc/stellar-core.cfg`), find:
```toml
PREFERRED_PEER_KEYS = [
    "$validator1",
    "$validator2",
]
```

**Add validator3 to the list:**
```toml
PREFERRED_PEER_KEYS = [
    "$validator1",
    "$validator2",
    "$validator3"
]
```

💡 **Tip:** Make sure to add a comma after `"$validator2"` and keep the formatting consistent.

**Check your work:**
```bash
grep -A5 'PREFERRED_PEER_KEYS' /opt/stellar/core/etc/stellar-core.cfg
```

✅ **You should see** all three validators listed.

---

### Step 4: Switch to CDN for History Downloads

This makes history downloads faster and more reliable by using HTTPS and a CDN.

**For validator1**, find this line:
```toml
HISTORY="curl -sf http://34.95.11.164:31403/{0} -o {1}"
```

**Change it to:**
```toml
HISTORY="curl -sf https://history.mainnet.minepi.com/{0} -o {1}"
```

**For validator2**, find this line:
```toml
HISTORY="curl -sf http://34.88.93.19:31403/{0} -o {1}"
```

**Change it to:**
```toml
HISTORY="curl -sf https://history.mainnet.minepi.com/{0} -o {1}"
```

✅ **You should see** all HISTORY URLs using `https://history.mainnet.minepi.com`

---

### Step 5: Run Horizon Database Migration

This ensures the Horizon database schema is up to date.

```bash
/opt/stellar/horizon/bin/horizon db migrate up
```

✅ **Expected output:**
- `No migrations applied.` (if already up to date)
- OR `Successfully applied X migrations.` (if updates were needed)

❌ **If you see an error** about database connection, make sure Horizon is configured correctly.

---

### Step 6: Restart Services

Now we need to restart the services to apply all changes.

```bash
supervisorctl restart stellar-core
supervisorctl restart horizon
```

**Check that services are running:**
```bash
supervisorctl status
```

✅ **You should see:**
```
stellar-core    RUNNING
horizon         RUNNING
postgresql      RUNNING
```
---

### Step 7: Verify Everything Worked

Let's make sure all changes were applied correctly.
Inside the container:

for stellar-core try:
```bash
curl http://localhost:11626/info
```

for horizon try:
```bash
curl http://localhost:8000
```

Ingestion and reingestion of horizon may take a long time. During reingestion, recently ingested blocks will not be
updated in the API. Check the progress in the logs.
Log file includes a random string in the filename, so look for files that are matched by the pattern:
```
/var/log/supervisor/horizon-stderr---supervisor-*.log
```

Look for lines like:
```bash
tail -n 500 -f /var/log/supervisor/horizon-stderr---supervisor-*.log | grep "progress="
```


✅ **All commands should return results** showing the changes are in place.

---

## If Something Goes Wrong

Don't panic! You can easily roll back to your backup.

```bash
# Stop the services
supervisorctl stop stellar-core horizon

# Find your backup (use the timestamp from Step 1)
ls /opt/stellar/migration_backups/

# Restore the backup (replace YYYYMMDD_HHMMSS with your timestamp)
cp /opt/stellar/migration_backups/YYYYMMDD_HHMMSS/stellar-core.cfg \
   /opt/stellar/core/etc/stellar-core.cfg

# Restart services
supervisorctl restart stellar-core horizon
```

---

## Using the Automated Script

Instead of doing this manually, you can run the automated migration script:

```bash
/migrations/001_update_validator3.sh
```

The script does everything above automatically and is **idempotent** (safe to run multiple times).

---

## Questions?

- **Can I run this multiple times?** Yes! The migration checks if changes are already applied.
- **Will this cause downtime?** Brief downtime during service restart (a few seconds/minutes).
- **What if stellar-core won't start?** Check logs: `tail -f /opt/stellar/core/stellar-core.log`
- **Can I skip the Horizon migration?** Only if you're not using Horizon.

---

**Migration completed successfully!** 🎉

