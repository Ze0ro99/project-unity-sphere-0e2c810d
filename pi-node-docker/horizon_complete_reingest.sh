#!/bin/bash
set -e

history_elder_ledger=$(curl -s http://localhost:8000 | jq -r '.history_elder_ledger')

if [[ -z "$history_elder_ledger" || "$history_elder_ledger" == "null" ]]; then
    echo "Error: Failed to get valid history_elder_ledger"
    exit 1
fi

echo "Running horizon reingest range 2 $history_elder_ledger"

stellar-horizon db reingest range 2 "$history_elder_ledger" --history-archive-urls=http://localhost:1570

echo "Horizon reingest range 2 $history_elder_ledger Done"
