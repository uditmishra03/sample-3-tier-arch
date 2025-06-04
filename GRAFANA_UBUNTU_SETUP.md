# Grafana Installation Guide for Ubuntu 24.04

This guide provides step-by-step instructions for installing and configuring Grafana on Ubuntu 24.04.

## Prerequisites

- Ubuntu 24.04 server with root or sudo access
- Basic knowledge of Linux commands
- Open ports for Grafana web interface (default: 3000)

## Step 1: Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

## Step 2: Install Required Dependencies

```bash
sudo apt install -y apt-transport-https software-properties-common wget
```

## Step 3: Add Grafana GPG Key and Repository

```bash
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list
```

## Step 4: Install Grafana

```bash
sudo apt update
sudo apt install grafana -y
```

## Step 5: Start and Enable Grafana Service

```bash
sudo systemctl start grafana-server
sudo systemctl enable grafana-server
```

## Step 6: Check Grafana Status

```bash
sudo systemctl status grafana-server
```

## Step 7: Configure Firewall (if enabled)

```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

## Step 8: Access Grafana Web Interface

Open your web browser and navigate to:

```
http://your-server-ip:3000
```

Default login credentials:
- Username: `admin`
- Password: `admin`

You will be prompted to change the default password on first login.

## Step 9: Basic Configuration

### Update Server Settings (Optional)

```bash
sudo nano /etc/grafana/grafana.ini
```

Common settings to modify:
```ini
[server]
# Protocol (http, https)
protocol = http

# The http port to use
http_port = 3000

# The public facing domain name used to access grafana from a browser
domain = your-domain.com

# The full public facing url
root_url = %(protocol)s://%(domain)s:%(http_port)s/
```

After making changes, restart Grafana:

```bash
sudo systemctl restart grafana-server
```

## Step 10: Install Plugins (Optional)

```bash
# Example: Install Prometheus data source plugin
sudo grafana-cli plugins install grafana-prometheus-datasource

# Restart Grafana after installing plugins
sudo systemctl restart grafana-server
```

## Step 11: Configure Data Sources

1. Log in to the Grafana web interface
2. Go to Configuration > Data Sources
3. Click "Add data source"
4. Select your data source type (Prometheus, InfluxDB, etc.)
5. Configure the connection details
6. Click "Save & Test"

## Step 12: Create Dashboards

1. Click the "+" icon in the side menu
2. Select "Create Dashboard"
3. Click "Add new panel"
4. Configure your visualization
5. Save the dashboard

## Step 13: Set Up Alerting (Optional)

1. Go to Alerting > Notification channels
2. Add notification channels (email, Slack, etc.)
3. Configure alert rules in your dashboard panels

## Step 14: Enable HTTPS with Let's Encrypt (Optional)

```bash
# Install Certbot
sudo apt install certbot -y

# Obtain SSL certificate
sudo certbot certonly --standalone -d grafana.your-domain.com

# Update Grafana configuration
sudo nano /etc/grafana/grafana.ini
```

Update the following settings:
```ini
[server]
protocol = https
http_port = 3000
domain = grafana.your-domain.com
cert_file = /etc/letsencrypt/live/grafana.your-domain.com/fullchain.pem
cert_key = /etc/letsencrypt/live/grafana.your-domain.com/privkey.pem
```

Restart Grafana:
```bash
sudo systemctl restart grafana-server
```

## Troubleshooting

### Service Won't Start

Check the logs:
```bash
sudo journalctl -u grafana-server -e
```

### Permission Issues

```bash
sudo chown -R grafana:grafana /var/lib/grafana
sudo chmod -R 755 /var/lib/grafana
```

### Port Already in Use

```bash
# Find what's using port 3000
sudo netstat -tulpn | grep 3000

# Change Grafana port in grafana.ini
sudo nano /etc/grafana/grafana.ini
# Update http_port = 3001
```

### Reset Admin Password

```bash
sudo grafana-cli admin reset-admin-password newpassword
```

## Maintenance

### Backup Grafana

```bash
# Backup configuration
sudo cp -r /etc/grafana /etc/grafana.bak

# Backup data (if using SQLite)
sudo cp -r /var/lib/grafana /var/lib/grafana.bak
```

### Update Grafana

```bash
sudo apt update
sudo apt install grafana
sudo systemctl restart grafana-server
```

---

This guide provides a basic setup for Grafana on Ubuntu 24.04. For production environments, consider implementing additional security measures and performance optimizations based on your specific requirements.