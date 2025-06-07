## While Launching the ec2 instance, Pre-install aws cli in the instance.
```
#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting setup..."

# Update package lists
sudo apt update -y

# Install unzip and curl (curl is needed for downloading AWS CLI)
sudo apt install -y unzip curl

# Download AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"

# Unzip and install
unzip /tmp/awscliv2.zip -d /tmp
sudo /tmp/aws/install

# Verify installation
aws --version

echo "Setup complete!"
```
