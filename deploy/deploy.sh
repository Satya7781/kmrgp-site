#!/bin/bash
# =============================================================================
# Deploy / Update Script – Mewada Matrimonial App
# Run as deployuser after every code push:
#   bash /var/www/mewada/deploy/deploy.sh
# =============================================================================
set -e

echo "=== Deploying Mewada Matrimonial App ==="
cd /var/www/mewada

# 1 – Pull latest code
if [ -d .git ]; then
    echo "[1/5] Pulling latest code from git..."
    git pull origin main
else
    echo "[1/5] Skipped git pull (no .git directory)."
fi

# 2 – Activate virtual environment and install dependencies
echo "[2/5] Installing/updating Python dependencies..."
source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

# 3 – Ensure uploads directory exists
echo "[3/5] Ensuring uploads directory exists..."
mkdir -p /var/www/mewada/uploads

# 4 – Restart the Gunicorn service
echo "[4/5] Restarting Gunicorn service..."
sudo systemctl restart mewada

# 5 – Health check
echo "[5/5] Checking service status..."
sudo systemctl status mewada --no-pager --lines=10

echo ""
echo "=== Deploy complete! ==="
