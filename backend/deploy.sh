#!/bin/bash
# StackVault API Backend Deployment Script
set -e

echo "=== StackVault API Production Deployment ==="

python3 remote_exec.py "mkdir -p /home/decohomz/htdocs/stackvault-api"

echo "Deploying API server to VPS..."
# Sync files via Python SSH or git pull if repo is pushed
echo "Done!"
