#!/bin/bash
# =============================================================================
# Server Setup Script – Mewada Matrimonial App
# Run once as root on a fresh Ubuntu 22.04 VPS:
#   sudo bash deploy/setup.sh
# =============================================================================
set -e

echo "=== Mewada Matrimonial App – Server Setup ==="

# 1 – Update system
echo "[1/8] Updating system packages..."
apt update && apt upgrade -y

# 2 – Install dependencies
echo "[2/8] Installing required packages..."
apt install -y python3-pip python3-venv nginx postgresql postgresql-contrib \
               certbot python3-certbot-nginx git curl fail2ban ufw

# 3 – Create deploy user (idempotent)
echo "[3/8] Creating deploy user..."
if ! id -u deployuser > /dev/null 2>&1; then
    adduser --disabled-password --gecos "" deployuser
    usermod -aG sudo deployuser
    echo "deployuser ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deployuser
    chmod 0440 /etc/sudoers.d/deployuser
fi

# 4 – Set up PostgreSQL
echo "[4/8] Setting up PostgreSQL..."
sudo -u postgres psql -c \
    "CREATE USER mewada_user WITH PASSWORD 'CHANGE_THIS_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c \
    "CREATE DATABASE mewada_db OWNER mewada_user;" 2>/dev/null || true
sudo -u postgres psql -c \
    "GRANT ALL PRIVILEGES ON DATABASE mewada_db TO mewada_user;"

# 5 – Create project directory structure
echo "[5/8] Creating project directories..."
mkdir -p /var/www/mewada/uploads
mkdir -p /var/log/mewada
chown -R deployuser:deployuser /var/www/mewada
chown -R deployuser:deployuser /var/log/mewada

# 6 – Configure firewall
echo "[6/8] Configuring UFW firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable

# 7 – Install Gunicorn systemd service
echo "[7/8] Installing Gunicorn service..."
if [ -f /var/www/mewada/deploy/gunicorn.service ]; then
    cp /var/www/mewada/deploy/gunicorn.service /etc/systemd/system/mewada.service
    systemctl daemon-reload
    systemctl enable mewada
else
    echo "  WARNING: deploy/gunicorn.service not found – upload your code first."
fi

# 8 – Configure Nginx
echo "[8/8] Installing Nginx config..."
if [ -f /var/www/mewada/deploy/nginx.conf ]; then
    cp /var/www/mewada/deploy/nginx.conf /etc/nginx/sites-available/mewada
    ln -sf /etc/nginx/sites-available/mewada /etc/nginx/sites-enabled/mewada
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
else
    echo "  WARNING: deploy/nginx.conf not found – upload your code first."
fi

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "  1. Upload your code:  git clone <repo> /var/www/mewada (or scp)"
echo "  2. Create .env:       cp /var/www/mewada/.env.example /var/www/mewada/.env && nano /var/www/mewada/.env"
echo "  3. Python env:        cd /var/www/mewada && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
echo "  4. Init DB:           python -c 'from app import create_app, db; app=create_app(); app.app_context().push(); db.create_all()'"
echo "  5. Edit Nginx:        nano /etc/nginx/sites-available/mewada  # replace YOUR_DOMAIN_HERE"
echo "  6. Start app:         sudo systemctl start mewada && sudo systemctl restart nginx"
echo "  7. Get SSL cert:      sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
