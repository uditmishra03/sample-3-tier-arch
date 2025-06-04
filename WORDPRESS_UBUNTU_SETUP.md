# WordPress Setup Guide for Ubuntu 24.04

This guide provides step-by-step instructions for setting up a WordPress application on Ubuntu 24.04.

## Prerequisites

- Ubuntu 24.04 server with root or sudo access
- Domain name (optional but recommended)
- Basic knowledge of Linux commands

## Step 1: Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

## Step 2: Install LAMP Stack

### Install Apache Web Server

```bash
sudo apt install apache2 -y
sudo systemctl enable apache2
sudo systemctl start apache2
```

### Install MySQL Database Server

```bash
sudo apt install mysql-server -y
sudo systemctl enable mysql
sudo systemctl start mysql
```

### Secure MySQL Installation

```bash
sudo mysql_secure_installation
```

**Note:** Ubuntu 24.04 uses `auth_socket` authentication by default, which means you won't be able to set a password during the secure installation process. To set a password for the root user, run:

```bash
# Log in to MySQL as root
sudo mysql

# Once in the MySQL prompt, run:
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_strong_password';
FLUSH PRIVILEGES;
EXIT;
```

Then follow the prompts in `mysql_secure_installation` to:
- Remove anonymous users
- Disallow root login remotely
- Remove test database
- Reload privilege tables

### Install PHP and Required Extensions

```bash
sudo apt install php libapache2-mod-php php-mysql php-curl php-gd php-mbstring php-xml php-xmlrpc php-soap php-intl php-zip -y
```

## Step 3: Create MySQL Database and User for WordPress

```bash
sudo mysql -u root -p
```

Once logged in to MySQL, run:

```sql
CREATE DATABASE wordpress_db;
CREATE USER 'wordpress_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON wordpress_db.* TO 'wordpress_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 4: Install WordPress

### Download and Extract WordPress

```bash
cd /tmp
wget https://wordpress.org/latest.tar.gz
tar -xzvf latest.tar.gz
sudo mv wordpress /var/www/html/
```

### Set Proper Permissions

```bash
sudo chown -R www-data:www-data /var/www/html/wordpress/
sudo chmod -R 755 /var/www/html/wordpress/
```

### Create WordPress Configuration File

```bash
cd /var/www/html/wordpress
sudo cp wp-config-sample.php wp-config.php
sudo nano wp-config.php
```

Update the database settings:

```php
define('DB_NAME', 'wordpress_db');
define('DB_USER', 'wordpress_user');
define('DB_PASSWORD', 'your_strong_password');
define('DB_HOST', 'localhost');
```

Generate and add security keys by visiting: https://api.wordpress.org/secret-key/1.1/salt/

## Step 5: Configure Apache for WordPress

### Create a Virtual Host Configuration

```bash
sudo nano /etc/apache2/sites-available/wordpress.conf
```

Add the following configuration:

```apache
<VirtualHost *:80>
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html/wordpress
    ServerName your-domain.com
    ServerAlias www.your-domain.com

    <Directory /var/www/html/wordpress/>
        Options FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/wordpress_error.log
    CustomLog ${APACHE_LOG_DIR}/wordpress_access.log combined
</VirtualHost>
```

### Enable the WordPress Site and Rewrite Module

```bash
sudo a2ensite wordpress.conf
sudo a2enmod rewrite
sudo systemctl restart apache2
```

## Step 6: Complete WordPress Installation

Open your web browser and navigate to your server's IP address or domain name:

```
http://your-server-ip/wordpress
```

or

```
http://your-domain.com
```

Follow the on-screen instructions to complete the WordPress installation:
1. Select your language
2. Enter the site information
3. Create an admin user
4. Complete the installation

## Step 7: Secure Your WordPress Installation

### Install and Configure UFW Firewall

```bash
sudo apt install ufw -y
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### Install SSL Certificate with Certbot (Optional but Recommended)

```bash
sudo apt install certbot python3-certbot-apache -y
sudo certbot --apache -d your-domain.com -d www.your-domain.com
```

### Enable Automatic Updates (Optional)

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Step 8: Optimize WordPress Performance

### Install and Configure Cache Plugin

Log in to your WordPress admin dashboard and install a caching plugin like W3 Total Cache or WP Super Cache.

### Configure PHP Settings for Better Performance

```bash
sudo nano /etc/php/8.3/apache2/php.ini
```

Update the following values:

```ini
memory_limit = 256M
upload_max_filesize = 64M
post_max_size = 64M
max_execution_time = 300
```

Restart Apache:

```bash
sudo systemctl restart apache2
```

## Maintenance Tips

- Regularly backup your WordPress database and files
- Keep WordPress core, themes, and plugins updated
- Monitor server logs for suspicious activity
- Use strong passwords and consider implementing two-factor authentication

## Troubleshooting

### Permissions Issues

If you encounter permission issues:

```bash
sudo chown -R www-data:www-data /var/www/html/wordpress/
sudo find /var/www/html/wordpress/ -type d -exec chmod 755 {} \;
sudo find /var/www/html/wordpress/ -type f -exec chmod 644 {} \;
```

### PHP or MySQL Errors

Check the Apache error logs:

```bash
sudo tail -f /var/log/apache2/error.log
```

---

This guide provides a basic setup for WordPress on Ubuntu 24.04. For production environments, consider implementing additional security measures and performance optimizations based on your specific requirements.