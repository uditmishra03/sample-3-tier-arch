# AWS CLI Deployment Guide for Three-Tier Web Architecture

This guide provides step-by-step instructions for deploying the complete three-tier web architecture using AWS CLI commands.

## Prerequisites

1. Install and configure the AWS CLI:
   ```bash
   # Install AWS CLI (macOS example)
   brew install awscli
   
   # Configure AWS CLI with your credentials
   aws configure
   ```

2. Set environment variables for reuse in commands:
   ```bash
   # Set your preferred AWS region
   export AWS_REGION=us-east-1
   
   # Set a unique name for your S3 bucket (must be globally unique)
   export S3_BUCKET=your-unique-bucket-name-$(date +%s)
   
   # Set a name for your project
   export PROJECT_NAME=three-tier-demo
   
   # Set VPC CIDR and subnet ranges
   export VPC_CIDR=10.0.0.0/16
   export PUBLIC_SUBNET_1=10.0.1.0/24
   export PUBLIC_SUBNET_2=10.0.2.0/24
   export PRIVATE_APP_SUBNET_1=10.0.3.0/24
   export PRIVATE_APP_SUBNET_2=10.0.4.0/24
   export PRIVATE_DB_SUBNET_1=10.0.5.0/24
   export PRIVATE_DB_SUBNET_2=10.0.6.0/24
   
   # Set database credentials (use strong passwords in production)
   export DB_NAME=webappdb
   export DB_USERNAME=admin
   export DB_PASSWORD=YourStrongPassword123
   ```

## Step 1: Create S3 Bucket for Code Storage

```bash
# Create S3 bucket
aws s3api create-bucket \
  --bucket $S3_BUCKET \
  --region $AWS_REGION \
  $(if [ "$AWS_REGION" != "us-east-1" ]; then echo "--create-bucket-configuration LocationConstraint=$AWS_REGION"; fi)

# Enable versioning on the bucket
aws s3api put-bucket-versioning \
  --bucket $S3_BUCKET \
  --versioning-configuration Status=Enabled
```

## Step 2: Create IAM Role for EC2 Instances

```bash
# Create IAM role
aws iam create-role \
  --role-name ${PROJECT_NAME}-EC2Role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "ec2.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Attach policies to the role
aws iam attach-role-policy \
  --role-name ${PROJECT_NAME}-EC2Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore

aws iam attach-role-policy \
  --role-name ${PROJECT_NAME}-EC2Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# Create instance profile and add role to it
aws iam create-instance-profile \
  --instance-profile-name ${PROJECT_NAME}-EC2InstanceProfile

aws iam add-role-to-instance-profile \
  --instance-profile-name ${PROJECT_NAME}-EC2InstanceProfile \
  --role-name ${PROJECT_NAME}-EC2Role

# Wait for the instance profile to be available
echo "Waiting for instance profile to be available..."
sleep 10
```
## Step 3: Create VPC and Network Infrastructure

```bash
# Create VPC
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block $VPC_CIDR \
  --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=${PROJECT_NAME}-vpc}]" \
  --query 'Vpc.VpcId' \
  --output text)
echo "VPC created: $VPC_ID"

# Enable DNS hostnames for the VPC
aws ec2 modify-vpc-attribute \
  --vpc-id $VPC_ID \
  --enable-dns-hostnames "{\"Value\":true}"

# Create Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway \
  --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=${PROJECT_NAME}-igw}]" \
  --query 'InternetGateway.InternetGatewayId' \
  --output text)
echo "Internet Gateway created: $IGW_ID"

# Attach Internet Gateway to VPC
aws ec2 attach-internet-gateway \
  --internet-gateway-id $IGW_ID \
  --vpc-id $VPC_ID

# Get availability zones
AZ1=$(aws ec2 describe-availability-zones \
  --region $AWS_REGION \
  --query 'AvailabilityZones[0].ZoneName' \
  --output text)
AZ2=$(aws ec2 describe-availability-zones \
  --region $AWS_REGION \
  --query 'AvailabilityZones[1].ZoneName' \
  --output text)
echo "Using availability zones: $AZ1 and $AZ2"

# Create public subnets
PUBLIC_SUBNET_1_ID=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block $PUBLIC_SUBNET_1 \
  --availability-zone $AZ1 \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-subnet-1}]" \
  --query 'Subnet.SubnetId' \
  --output text)
echo "Public Subnet 1 created: $PUBLIC_SUBNET_1_ID"

PUBLIC_SUBNET_2_ID=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block $PUBLIC_SUBNET_2 \
  --availability-zone $AZ2 \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-subnet-2}]" \
  --query 'Subnet.SubnetId' \
  --output text)
echo "Public Subnet 2 created: $PUBLIC_SUBNET_2_ID"

# Create private app subnets
PRIVATE_APP_SUBNET_1_ID=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block $PRIVATE_APP_SUBNET_1 \
  --availability-zone $AZ1 \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-app-subnet-1}]" \
  --query 'Subnet.SubnetId' \
  --output text)
echo "Private App Subnet 1 created: $PRIVATE_APP_SUBNET_1_ID"

PRIVATE_APP_SUBNET_2_ID=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block $PRIVATE_APP_SUBNET_2 \
  --availability-zone $AZ2 \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-app-subnet-2}]" \
  --query 'Subnet.SubnetId' \
  --output text)
echo "Private App Subnet 2 created: $PRIVATE_APP_SUBNET_2_ID"

# Create private DB subnets
PRIVATE_DB_SUBNET_1_ID=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block $PRIVATE_DB_SUBNET_1 \
  --availability-zone $AZ1 \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-db-subnet-1}]" \
  --query 'Subnet.SubnetId' \
  --output text)
echo "Private DB Subnet 1 created: $PRIVATE_DB_SUBNET_1_ID"

PRIVATE_DB_SUBNET_2_ID=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block $PRIVATE_DB_SUBNET_2 \
  --availability-zone $AZ2 \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-db-subnet-2}]" \
  --query 'Subnet.SubnetId' \
  --output text)
echo "Private DB Subnet 2 created: $PRIVATE_DB_SUBNET_2_ID"

# Enable auto-assign public IP on public subnets
aws ec2 modify-subnet-attribute \
  --subnet-id $PUBLIC_SUBNET_1_ID \
  --map-public-ip-on-launch

aws ec2 modify-subnet-attribute \
  --subnet-id $PUBLIC_SUBNET_2_ID \
  --map-public-ip-on-launch

# Create route tables
PUBLIC_RT_ID=$(aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-rt}]" \
  --query 'RouteTable.RouteTableId' \
  --output text)
echo "Public Route Table created: $PUBLIC_RT_ID"

PRIVATE_RT_1_ID=$(aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-rt-1}]" \
  --query 'RouteTable.RouteTableId' \
  --output text)
echo "Private Route Table 1 created: $PRIVATE_RT_1_ID"

PRIVATE_RT_2_ID=$(aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-private-rt-2}]" \
  --query 'RouteTable.RouteTableId' \
  --output text)
echo "Private Route Table 2 created: $PRIVATE_RT_2_ID"

# Create public route to Internet Gateway
aws ec2 create-route \
  --route-table-id $PUBLIC_RT_ID \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id $IGW_ID

# Associate public subnets with public route table
aws ec2 associate-route-table \
  --route-table-id $PUBLIC_RT_ID \
  --subnet-id $PUBLIC_SUBNET_1_ID

aws ec2 associate-route-table \
  --route-table-id $PUBLIC_RT_ID \
  --subnet-id $PUBLIC_SUBNET_2_ID

# Create NAT Gateways with Elastic IPs
EIP_1_ALLOC_ID=$(aws ec2 allocate-address \
  --domain vpc \
  --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=${PROJECT_NAME}-eip-1}]" \
  --query 'AllocationId' \
  --output text)
echo "Elastic IP 1 allocated: $EIP_1_ALLOC_ID"

NAT_GW_1_ID=$(aws ec2 create-nat-gateway \
  --subnet-id $PUBLIC_SUBNET_1_ID \
  --allocation-id $EIP_1_ALLOC_ID \
  --tag-specifications "ResourceType=natgateway,Tags=[{Key=Name,Value=${PROJECT_NAME}-nat-gw-1}]" \
  --query 'NatGateway.NatGatewayId' \
  --output text)
echo "NAT Gateway 1 created: $NAT_GW_1_ID"

EIP_2_ALLOC_ID=$(aws ec2 allocate-address \
  --domain vpc \
  --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=${PROJECT_NAME}-eip-2}]" \
  --query 'AllocationId' \
  --output text)
echo "Elastic IP 2 allocated: $EIP_2_ALLOC_ID"

NAT_GW_2_ID=$(aws ec2 create-nat-gateway \
  --subnet-id $PUBLIC_SUBNET_2_ID \
  --allocation-id $EIP_2_ALLOC_ID \
  --tag-specifications "ResourceType=natgateway,Tags=[{Key=Name,Value=${PROJECT_NAME}-nat-gw-2}]" \
  --query 'NatGateway.NatGatewayId' \
  --output text)
echo "NAT Gateway 2 created: $NAT_GW_2_ID"

# Wait for NAT Gateways to be available
echo "Waiting for NAT Gateways to be available (this may take a few minutes)..."
aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_GW_1_ID
aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_GW_2_ID

# Create private routes to NAT Gateways
aws ec2 create-route \
  --route-table-id $PRIVATE_RT_1_ID \
  --destination-cidr-block 0.0.0.0/0 \
  --nat-gateway-id $NAT_GW_1_ID

aws ec2 create-route \
  --route-table-id $PRIVATE_RT_2_ID \
  --destination-cidr-block 0.0.0.0/0 \
  --nat-gateway-id $NAT_GW_2_ID

# Associate private subnets with private route tables
aws ec2 associate-route-table \
  --route-table-id $PRIVATE_RT_1_ID \
  --subnet-id $PRIVATE_APP_SUBNET_1_ID

aws ec2 associate-route-table \
  --route-table-id $PRIVATE_RT_1_ID \
  --subnet-id $PRIVATE_DB_SUBNET_1_ID

aws ec2 associate-route-table \
  --route-table-id $PRIVATE_RT_2_ID \
  --subnet-id $PRIVATE_APP_SUBNET_2_ID

aws ec2 associate-route-table \
  --route-table-id $PRIVATE_RT_2_ID \
  --subnet-id $PRIVATE_DB_SUBNET_2_ID
```

## Step 4: Create Security Groups

```bash
# Create security group for external ALB
EXTERNAL_ALB_SG_ID=$(aws ec2 create-security-group \
  --group-name ${PROJECT_NAME}-external-alb-sg \
  --description "Security group for external ALB" \
  --vpc-id $VPC_ID \
  --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-external-alb-sg}]" \
  --query 'GroupId' \
  --output text)
echo "External ALB Security Group created: $EXTERNAL_ALB_SG_ID"

# Allow HTTP and HTTPS from anywhere to external ALB
aws ec2 authorize-security-group-ingress \
  --group-id $EXTERNAL_ALB_SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $EXTERNAL_ALB_SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Create security group for web tier
WEB_TIER_SG_ID=$(aws ec2 create-security-group \
  --group-name ${PROJECT_NAME}-web-tier-sg \
  --description "Security group for web tier instances" \
  --vpc-id $VPC_ID \
  --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-web-tier-sg}]" \
  --query 'GroupId' \
  --output text)
echo "Web Tier Security Group created: $WEB_TIER_SG_ID"

# Allow HTTP from external ALB to web tier
aws ec2 authorize-security-group-ingress \
  --group-id $WEB_TIER_SG_ID \
  --protocol tcp \
  --port 80 \
  --source-group $EXTERNAL_ALB_SG_ID

# Create security group for internal ALB
INTERNAL_ALB_SG_ID=$(aws ec2 create-security-group \
  --group-name ${PROJECT_NAME}-internal-alb-sg \
  --description "Security group for internal ALB" \
  --vpc-id $VPC_ID \
  --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-internal-alb-sg}]" \
  --query 'GroupId' \
  --output text)
echo "Internal ALB Security Group created: $INTERNAL_ALB_SG_ID"

# Allow HTTP from web tier to internal ALB
aws ec2 authorize-security-group-ingress \
  --group-id $INTERNAL_ALB_SG_ID \
  --protocol tcp \
  --port 80 \
  --source-group $WEB_TIER_SG_ID

# Create security group for app tier
APP_TIER_SG_ID=$(aws ec2 create-security-group \
  --group-name ${PROJECT_NAME}-app-tier-sg \
  --description "Security group for app tier instances" \
  --vpc-id $VPC_ID \
  --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-app-tier-sg}]" \
  --query 'GroupId' \
  --output text)
echo "App Tier Security Group created: $APP_TIER_SG_ID"

# Allow traffic on port 4000 from internal ALB to app tier
aws ec2 authorize-security-group-ingress \
  --group-id $APP_TIER_SG_ID \
  --protocol tcp \
  --port 4000 \
  --source-group $INTERNAL_ALB_SG_ID

# Create security group for database tier
DB_TIER_SG_ID=$(aws ec2 create-security-group \
  --group-name ${PROJECT_NAME}-db-tier-sg \
  --description "Security group for database tier" \
  --vpc-id $VPC_ID \
  --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-db-tier-sg}]" \
  --query 'GroupId' \
  --output text)
echo "DB Tier Security Group created: $DB_TIER_SG_ID"

# Allow MySQL traffic from app tier to database tier
aws ec2 authorize-security-group-ingress \
  --group-id $DB_TIER_SG_ID \
  --protocol tcp \
  --port 3306 \
  --source-group $APP_TIER_SG_ID
```
## Step 5: Create Database Tier

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name ${PROJECT_NAME}-db-subnet-group \
  --db-subnet-group-description "Subnet group for Aurora database" \
  --subnet-ids $PRIVATE_DB_SUBNET_1_ID $PRIVATE_DB_SUBNET_2_ID \
  --tags Key=Name,Value=${PROJECT_NAME}-db-subnet-group

# Create Aurora MySQL cluster
aws rds create-db-cluster \
  --db-cluster-identifier ${PROJECT_NAME}-aurora-cluster \
  --engine aurora-mysql \
  --engine-version 8.0.mysql_aurora.3.04.0 \
  --master-username $DB_USERNAME \
  --master-user-password $DB_PASSWORD \
  --database-name $DB_NAME \
  --db-subnet-group-name ${PROJECT_NAME}-db-subnet-group \
  --vpc-security-group-ids $DB_TIER_SG_ID \
  --backup-retention-period 7 \
  --storage-encrypted \
  --tags Key=Name,Value=${PROJECT_NAME}-aurora-cluster

# Wait for DB cluster to be available
echo "Waiting for Aurora DB cluster to be available (this may take several minutes)..."
aws rds wait db-cluster-available --db-cluster-identifier ${PROJECT_NAME}-aurora-cluster

# Create primary DB instance
aws rds create-db-instance \
  --db-instance-identifier ${PROJECT_NAME}-aurora-primary \
  --db-cluster-identifier ${PROJECT_NAME}-aurora-cluster \
  --engine aurora-mysql \
  --db-instance-class db.t3.small \
  --tags Key=Name,Value=${PROJECT_NAME}-aurora-primary

# Create replica DB instance
aws rds create-db-instance \
  --db-instance-identifier ${PROJECT_NAME}-aurora-replica \
  --db-cluster-identifier ${PROJECT_NAME}-aurora-cluster \
  --engine aurora-mysql \
  --db-instance-class db.t3.small \
  --tags Key=Name,Value=${PROJECT_NAME}-aurora-replica

# Wait for DB instances to be available
echo "Waiting for Aurora DB instances to be available (this may take several minutes)..."
aws rds wait db-instance-available --db-instance-identifier ${PROJECT_NAME}-aurora-primary
aws rds wait db-instance-available --db-instance-identifier ${PROJECT_NAME}-aurora-replica

# Get the DB cluster endpoint
DB_ENDPOINT=$(aws rds describe-db-clusters \
  --db-cluster-identifier ${PROJECT_NAME}-aurora-cluster \
  --query 'DBClusters[0].Endpoint' \
  --output text)
echo "Aurora DB Cluster Endpoint: $DB_ENDPOINT"

# Create a secret for database credentials in AWS Secrets Manager
SECRET_ARN=$(aws secretsmanager create-secret \
  --name ${PROJECT_NAME}-db-credentials \
  --description "Aurora MySQL credentials for ${PROJECT_NAME}" \
  --secret-string "{\"username\":\"$DB_USERNAME\",\"password\":\"$DB_PASSWORD\",\"host\":\"$DB_ENDPOINT\",\"port\":\"3306\",\"dbname\":\"$DB_NAME\"}" \
  --query 'ARN' \
  --output text)
echo "Database credentials stored in Secrets Manager: $SECRET_ARN"
```
## Step 6: Upload Application Code to S3

```bash
# Clone the repository if you haven't already
git clone https://github.com/iamtejasmane/aws-three-tier-web-app.git
cd aws-three-tier-web-app

# Update DbConfig.js with database credentials
cat > application-code/app-tier/DbConfig.js << EOF
// DbConfig.js - Updated with AWS Secrets Manager support
const AWS = require('aws-sdk');

// Default values (will be overridden if using Secrets Manager)
let config = {
    DB_HOST: '$DB_ENDPOINT',
    DB_USER: '$DB_USERNAME',
    DB_PWD: '$DB_PASSWORD',
    DB_DATABASE: '$DB_NAME'
};

// Function to load secrets from AWS Secrets Manager
async function loadSecrets() {
    try {
        // Create a Secrets Manager client
        const client = new AWS.SecretsManager({
            region: process.env.AWS_REGION || '$AWS_REGION'
        });
        
        const secretName = process.env.DB_SECRET_NAME || '${PROJECT_NAME}-db-credentials';
        
        // Only attempt to load from Secrets Manager if a secret name is provided
        if (secretName) {
            const data = await client.getSecretValue({ SecretId: secretName }).promise();
            let secretString;
            
            // Decode binary secret if needed
            if ('SecretString' in data) {
                secretString = data.SecretString;
            } else {
                const buff = Buffer.from(data.SecretBinary, 'base64');
                secretString = buff.toString('ascii');
            }
            
            const secretData = JSON.parse(secretString);
            
            // Update config with values from Secrets Manager
            config = {
                DB_HOST: secretData.host || config.DB_HOST,
                DB_USER: secretData.username || config.DB_USER,
                DB_PWD: secretData.password || config.DB_PWD,
                DB_DATABASE: secretData.dbname || config.DB_DATABASE
            };
            
            console.log('Database configuration loaded from Secrets Manager');
        } else {
            console.log('No DB_SECRET_NAME provided, using environment variables or defaults');
        }
    } catch (err) {
        console.error('Error loading database configuration from Secrets Manager:', err);
    }
}

// Initialize config (for backwards compatibility with existing code)
// This allows the module to be used synchronously while secrets load asynchronously
loadSecrets().catch(err => console.error('Failed to load secrets:', err));

module.exports = Object.freeze(config);
EOF

# Update package.json to include AWS SDK
cat > application-code/app-tier/package.json << EOF
{
  "name": "aws-3tier-app-layer",
  "version": "1.0.0",
  "description": "App tier for AWS Three-Tier Web Architecture Demo",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/awsshivs/ab3-web-app-backend.git"
  },
  "keywords": ["aws", "three-tier", "demo"],
  "author": "AWS Demo Team",
  "license": "MIT-0",
  "bugs": {
    "url": "https://github.com/awsshivs/ab3-web-app-backend/issues"
  },
  "homepage": "https://github.com/awsshivs/ab3-web-app-backend#readme",
  "dependencies": {
    "aws-sdk": "^2.1473.0",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "mysql": "^2.18.1",
    "node-fetch": "^2.7.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
EOF

# Upload application code to S3
aws s3 cp application-code/app-tier/ s3://$S3_BUCKET/app-tier/ --recursive
aws s3 cp application-code/web-tier/ s3://$S3_BUCKET/web-tier/ --recursive
aws s3 cp application-code/nginx.conf s3://$S3_BUCKET/nginx.conf
```
## Step 7: Create Target Groups and Load Balancers

```bash
# Create target group for app tier
APP_TG_ARN=$(aws elbv2 create-target-group \
  --name ${PROJECT_NAME}-app-tg \
  --protocol HTTP \
  --port 4000 \
  --vpc-id $VPC_ID \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 2 \
  --target-type instance \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)
echo "App Tier Target Group created: $APP_TG_ARN"

# Create target group for web tier
WEB_TG_ARN=$(aws elbv2 create-target-group \
  --name ${PROJECT_NAME}-web-tg \
  --protocol HTTP \
  --port 80 \
  --vpc-id $VPC_ID \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 2 \
  --target-type instance \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)
echo "Web Tier Target Group created: $WEB_TG_ARN"

# Create internal ALB for app tier
INTERNAL_ALB_ARN=$(aws elbv2 create-load-balancer \
  --name ${PROJECT_NAME}-internal-alb \
  --subnets $PRIVATE_APP_SUBNET_1_ID $PRIVATE_APP_SUBNET_2_ID \
  --security-groups $INTERNAL_ALB_SG_ID \
  --scheme internal \
  --tags Key=Name,Value=${PROJECT_NAME}-internal-alb \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)
echo "Internal ALB created: $INTERNAL_ALB_ARN"

# Create external ALB for web tier
EXTERNAL_ALB_ARN=$(aws elbv2 create-load-balancer \
  --name ${PROJECT_NAME}-external-alb \
  --subnets $PUBLIC_SUBNET_1_ID $PUBLIC_SUBNET_2_ID \
  --security-groups $EXTERNAL_ALB_SG_ID \
  --scheme internet-facing \
  --tags Key=Name,Value=${PROJECT_NAME}-external-alb \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)
echo "External ALB created: $EXTERNAL_ALB_ARN"

# Wait for load balancers to be active
echo "Waiting for load balancers to be active..."
aws elbv2 wait load-balancer-available --load-balancer-arns $INTERNAL_ALB_ARN
aws elbv2 wait load-balancer-available --load-balancer-arns $EXTERNAL_ALB_ARN

# Get internal ALB DNS name
INTERNAL_ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $INTERNAL_ALB_ARN \
  --query 'LoadBalancers[0].DNSName' \
  --output text)
echo "Internal ALB DNS: $INTERNAL_ALB_DNS"

# Get external ALB DNS name
EXTERNAL_ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $EXTERNAL_ALB_ARN \
  --query 'LoadBalancers[0].DNSName' \
  --output text)
echo "External ALB DNS: $EXTERNAL_ALB_DNS"

# Create listener for internal ALB
INTERNAL_LISTENER_ARN=$(aws elbv2 create-listener \
  --load-balancer-arn $INTERNAL_ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$APP_TG_ARN \
  --query 'Listeners[0].ListenerArn' \
  --output text)
echo "Internal ALB Listener created: $INTERNAL_LISTENER_ARN"

# Create listener for external ALB
EXTERNAL_LISTENER_ARN=$(aws elbv2 create-listener \
  --load-balancer-arn $EXTERNAL_ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$WEB_TG_ARN \
  --query 'Listeners[0].ListenerArn' \
  --output text)
echo "External ALB Listener created: $EXTERNAL_LISTENER_ARN"

# Update nginx.conf with internal ALB DNS
cat > nginx.conf << EOF
# For more information on configuration, see:
#   * Official English Documentation: http://nginx.org/en/docs/
#   * Official Russian Documentation: http://nginx.org/ru/docs/

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

# Load dynamic modules. See /usr/share/doc/nginx/README.dynamic.
include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
}

http {
    log_format  main  '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                      '\$status \$body_bytes_sent "\$http_referer" '
                      '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 4096;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    # Load modular configuration files from the /etc/nginx/conf.d directory.
    # See http://nginx.org/en/docs/ngx_core_module.html#include
    # for more information.
    include /etc/nginx/conf.d/*.conf;

    server {
        listen       80;
        listen       [::]:80;
        server_name  _;

        #health check
        location /health {
        default_type text/html;
        return 200 "<!DOCTYPE html><p>Web Tier Health Check</p>\\n";
        }

        #react app and front end files
        location / {
        root    /home/ec2-user/web-tier/build;
        index index.html index.htm
        try_files \$uri /index.html;
        }

        #proxy for internal lb
        location /api/{
                proxy_pass http://$INTERNAL_ALB_DNS:80/;
                proxy_http_version 1.1;
                proxy_set_header Upgrade \$http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host \$host;
                proxy_set_header X-Real-IP \$remote_addr;
                proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto \$scheme;
                proxy_cache_bypass \$http_upgrade;
        }
    }
}
EOF

# Upload updated nginx.conf to S3
aws s3 cp nginx.conf s3://$S3_BUCKET/nginx.conf
```
## Step 8: Create Launch Templates and Auto Scaling Groups

```bash
# Get the latest Amazon Linux 2 AMI ID
AMI_ID=$(aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=amzn2-ami-hvm-2.0.*-x86_64-gp2" "Name=state,Values=available" \
  --query "sort_by(Images, &CreationDate)[-1].ImageId" \
  --output text)
echo "Using Amazon Linux 2 AMI: $AMI_ID"

# Create user data script for app tier
cat > app-tier-user-data.sh << 'EOF'
#!/bin/bash
# Update system packages
yum update -y

# Install NVM and Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 16
nvm use 16

# Install PM2 globally
npm install -g pm2

# Install AWS CLI if not already installed
yum install -y aws

# Set environment variables
export AWS_REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
export S3_BUCKET=BUCKET_NAME_PLACEHOLDER

# Download app code from S3
mkdir -p ~/app-tier
aws s3 cp s3://$S3_BUCKET/app-tier/ ~/app-tier/ --recursive

# Install dependencies and start application
cd ~/app-tier
npm install
pm2 start index.js

# Configure PM2 to start on boot
pm2 startup
pm2 save

# Set proper permissions
chmod -R 755 /home/ec2-user
EOF

# Replace placeholder with actual S3 bucket name
sed -i "s/BUCKET_NAME_PLACEHOLDER/$S3_BUCKET/g" app-tier-user-data.sh

# Create user data script for web tier
cat > web-tier-user-data.sh << 'EOF'
#!/bin/bash
# Update system packages
yum update -y

# Install NVM and Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 16
nvm use 16

# Install NGINX
amazon-linux-extras install nginx1 -y

# Install AWS CLI if not already installed
yum install -y aws

# Set environment variables
export AWS_REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
export S3_BUCKET=BUCKET_NAME_PLACEHOLDER

# Download web code from S3
mkdir -p ~/web-tier
aws s3 cp s3://$S3_BUCKET/web-tier/ ~/web-tier/ --recursive

# Build React app
cd ~/web-tier
npm install
npm run build

# Configure NGINX
aws s3 cp s3://$S3_BUCKET/nginx.conf /etc/nginx/nginx.conf

# Start NGINX and enable on boot
systemctl start nginx
systemctl enable nginx

# Set proper permissions
chmod -R 755 /home/ec2-user
EOF

# Replace placeholder with actual S3 bucket name
sed -i "s/BUCKET_NAME_PLACEHOLDER/$S3_BUCKET/g" web-tier-user-data.sh

# Create launch template for app tier
APP_LT_ID=$(aws ec2 create-launch-template \
  --launch-template-name ${PROJECT_NAME}-app-lt \
  --version-description "Initial version" \
  --launch-template-data "{
    \"ImageId\": \"$AMI_ID\",
    \"InstanceType\": \"t2.micro\",
    \"IamInstanceProfile\": {
      \"Name\": \"${PROJECT_NAME}-EC2InstanceProfile\"
    },
    \"SecurityGroupIds\": [\"$APP_TIER_SG_ID\"],
    \"UserData\": \"$(base64 app-tier-user-data.sh)\"
  }" \
  --tag-specifications "ResourceType=launch-template,Tags=[{Key=Name,Value=${PROJECT_NAME}-app-lt}]" \
  --query 'LaunchTemplate.LaunchTemplateId' \
  --output text)
echo "App Tier Launch Template created: $APP_LT_ID"

# Create launch template for web tier
WEB_LT_ID=$(aws ec2 create-launch-template \
  --launch-template-name ${PROJECT_NAME}-web-lt \
  --version-description "Initial version" \
  --launch-template-data "{
    \"ImageId\": \"$AMI_ID\",
    \"InstanceType\": \"t2.micro\",
    \"IamInstanceProfile\": {
      \"Name\": \"${PROJECT_NAME}-EC2InstanceProfile\"
    },
    \"SecurityGroupIds\": [\"$WEB_TIER_SG_ID\"],
    \"UserData\": \"$(base64 web-tier-user-data.sh)\"
  }" \
  --tag-specifications "ResourceType=launch-template,Tags=[{Key=Name,Value=${PROJECT_NAME}-web-lt}]" \
  --query 'LaunchTemplate.LaunchTemplateId' \
  --output text)
echo "Web Tier Launch Template created: $WEB_LT_ID"

# Create Auto Scaling Group for app tier
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name ${PROJECT_NAME}-app-asg \
  --launch-template LaunchTemplateId=$APP_LT_ID,Version='$Latest' \
  --min-size 2 \
  --max-size 4 \
  --desired-capacity 2 \
  --vpc-zone-identifier "$PRIVATE_APP_SUBNET_1_ID,$PRIVATE_APP_SUBNET_2_ID" \
  --target-group-arns $APP_TG_ARN \
  --health-check-type ELB \
  --health-check-grace-period 300 \
  --tags "Key=Name,Value=${PROJECT_NAME}-app-instance,PropagateAtLaunch=true"

# Create Auto Scaling Group for web tier
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name ${PROJECT_NAME}-web-asg \
  --launch-template LaunchTemplateId=$WEB_LT_ID,Version='$Latest' \
  --min-size 2 \
  --max-size 4 \
  --desired-capacity 2 \
  --vpc-zone-identifier "$PUBLIC_SUBNET_1_ID,$PUBLIC_SUBNET_2_ID" \
  --target-group-arns $WEB_TG_ARN \
  --health-check-type ELB \
  --health-check-grace-period 300 \
  --tags "Key=Name,Value=${PROJECT_NAME}-web-instance,PropagateAtLaunch=true"

echo "Auto Scaling Groups created. Waiting for instances to launch and pass health checks..."
sleep 60
```
## Step 9: Initialize Database Schema

```bash
# Create a temporary EC2 instance in the private app subnet to access the database
TEMP_INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type t2.micro \
  --subnet-id $PRIVATE_APP_SUBNET_1_ID \
  --security-group-ids $APP_TIER_SG_ID \
  --iam-instance-profile Name=${PROJECT_NAME}-EC2InstanceProfile \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${PROJECT_NAME}-temp-db-init}]" \
  --query 'Instances[0].InstanceId' \
  --output text)
echo "Temporary instance created: $TEMP_INSTANCE_ID"

# Wait for instance to be running
echo "Waiting for temporary instance to be running..."
aws ec2 wait instance-running --instance-ids $TEMP_INSTANCE_ID

# Wait a bit more for SSM agent to start
echo "Waiting for SSM agent to start..."
sleep 30

# Create database initialization script
cat > init-db.sh << EOF
#!/bin/bash
# Install MySQL client
sudo yum install mysql -y

# Create database schema
mysql -h $DB_ENDPOINT -u $DB_USERNAME -p$DB_PASSWORD << 'EOSQL'
USE $DB_NAME;
CREATE TABLE IF NOT EXISTS transactions(
  id INT NOT NULL AUTO_INCREMENT, 
  amount DECIMAL(10,2), 
  description VARCHAR(100), 
  PRIMARY KEY(id)
);
INSERT INTO transactions (amount, description) VALUES ('400', 'groceries');
INSERT INTO transactions (amount, description) VALUES ('100', 'class');
INSERT INTO transactions (amount, description) VALUES ('200', 'other groceries');
INSERT INTO transactions (amount, description) VALUES ('10', 'brownies');
SELECT * FROM transactions;
EOSQL
EOF

# Run the database initialization script on the temporary instance
aws ssm send-command \
  --instance-ids $TEMP_INSTANCE_ID \
  --document-name "AWS-RunShellScript" \
  --parameters "commands=[\"$(cat init-db.sh | sed 's/"/\\"/g')\"]" \
  --output text

# Wait for the command to complete
echo "Waiting for database initialization to complete..."
sleep 30

# Terminate the temporary instance
aws ec2 terminate-instances --instance-ids $TEMP_INSTANCE_ID
echo "Temporary instance terminated"
```
## Step 10: Verify Deployment

```bash
# Check if instances are registered with target groups
echo "Checking app tier target group..."
aws elbv2 describe-target-health \
  --target-group-arn $APP_TG_ARN

echo "Checking web tier target group..."
aws elbv2 describe-target-health \
  --target-group-arn $WEB_TG_ARN

# Get the external ALB DNS name
EXTERNAL_ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $EXTERNAL_ALB_ARN \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

echo "============================================================"
echo "Deployment complete! Access your application at:"
echo "http://$EXTERNAL_ALB_DNS"
echo "============================================================"
echo "Note: It may take a few minutes for the instances to initialize and pass health checks."
echo "If the application is not immediately available, wait a few minutes and try again."
```

## Clean Up Resources

When you're done with the demo, you can clean up all resources to avoid incurring charges:

```bash
# Delete Auto Scaling Groups
aws autoscaling delete-auto-scaling-group \
  --auto-scaling-group-name ${PROJECT_NAME}-web-asg \
  --force-delete

aws autoscaling delete-auto-scaling-group \
  --auto-scaling-group-name ${PROJECT_NAME}-app-asg \
  --force-delete

echo "Waiting for Auto Scaling Groups to be deleted..."
sleep 60

# Delete Launch Templates
aws ec2 delete-launch-template \
  --launch-template-id $WEB_LT_ID

aws ec2 delete-launch-template \
  --launch-template-id $APP_LT_ID

# Delete Load Balancers
aws elbv2 delete-load-balancer \
  --load-balancer-arn $EXTERNAL_ALB_ARN

aws elbv2 delete-load-balancer \
  --load-balancer-arn $INTERNAL_ALB_ARN

echo "Waiting for Load Balancers to be deleted..."
sleep 60

# Delete Target Groups
aws elbv2 delete-target-group \
  --target-group-arn $WEB_TG_ARN

aws elbv2 delete-target-group \
  --target-group-arn $APP_TG_ARN

# Delete DB Instances and Cluster
aws rds delete-db-instance \
  --db-instance-identifier ${PROJECT_NAME}-aurora-replica \
  --skip-final-snapshot

aws rds delete-db-instance \
  --db-instance-identifier ${PROJECT_NAME}-aurora-primary \
  --skip-final-snapshot

echo "Waiting for DB instances to be deleted..."
aws rds wait db-instance-deleted --db-instance-identifier ${PROJECT_NAME}-aurora-replica
aws rds wait db-instance-deleted --db-instance-identifier ${PROJECT_NAME}-aurora-primary

aws rds delete-db-cluster \
  --db-cluster-identifier ${PROJECT_NAME}-aurora-cluster \
  --skip-final-snapshot

# Delete DB Subnet Group
aws rds delete-db-subnet-group \
  --db-subnet-group-name ${PROJECT_NAME}-db-subnet-group

# Delete Secret
aws secretsmanager delete-secret \
  --secret-id ${PROJECT_NAME}-db-credentials \
  --force-delete-without-recovery

# Delete NAT Gateways
aws ec2 delete-nat-gateway \
  --nat-gateway-id $NAT_GW_1_ID

aws ec2 delete-nat-gateway \
  --nat-gateway-id $NAT_GW_2_ID

echo "Waiting for NAT Gateways to be deleted..."
sleep 60

# Release Elastic IPs
aws ec2 release-address \
  --allocation-id $EIP_1_ALLOC_ID

aws ec2 release-address \
  --allocation-id $EIP_2_ALLOC_ID

# Delete Security Groups
aws ec2 delete-security-group \
  --group-id $DB_TIER_SG_ID

aws ec2 delete-security-group \
  --group-id $APP_TIER_SG_ID

aws ec2 delete-security-group \
  --group-id $INTERNAL_ALB_SG_ID

aws ec2 delete-security-group \
  --group-id $WEB_TIER_SG_ID

aws ec2 delete-security-group \
  --group-id $EXTERNAL_ALB_SG_ID

# Delete Subnets
aws ec2 delete-subnet \
  --subnet-id $PUBLIC_SUBNET_1_ID

aws ec2 delete-subnet \
  --subnet-id $PUBLIC_SUBNET_2_ID

aws ec2 delete-subnet \
  --subnet-id $PRIVATE_APP_SUBNET_1_ID

aws ec2 delete-subnet \
  --subnet-id $PRIVATE_APP_SUBNET_2_ID

aws ec2 delete-subnet \
  --subnet-id $PRIVATE_DB_SUBNET_1_ID

aws ec2 delete-subnet \
  --subnet-id $PRIVATE_DB_SUBNET_2_ID

# Delete Route Tables
aws ec2 delete-route-table \
  --route-table-id $PUBLIC_RT_ID

aws ec2 delete-route-table \
  --route-table-id $PRIVATE_RT_1_ID

aws ec2 delete-route-table \
  --route-table-id $PRIVATE_RT_2_ID

# Detach and Delete Internet Gateway
aws ec2 detach-internet-gateway \
  --internet-gateway-id $IGW_ID \
  --vpc-id $VPC_ID

aws ec2 delete-internet-gateway \
  --internet-gateway-id $IGW_ID

# Delete VPC
aws ec2 delete-vpc \
  --vpc-id $VPC_ID

# Delete IAM Instance Profile and Role
aws iam remove-role-from-instance-profile \
  --instance-profile-name ${PROJECT_NAME}-EC2InstanceProfile \
  --role-name ${PROJECT_NAME}-EC2Role

aws iam delete-instance-profile \
  --instance-profile-name ${PROJECT_NAME}-EC2InstanceProfile

aws iam detach-role-policy \
  --role-name ${PROJECT_NAME}-EC2Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore

aws iam detach-role-policy \
  --role-name ${PROJECT_NAME}-EC2Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

aws iam delete-role \
  --role-name ${PROJECT_NAME}-EC2Role

# Empty and Delete S3 Bucket
aws s3 rm s3://$S3_BUCKET --recursive
aws s3api delete-bucket --bucket $S3_BUCKET

echo "All resources have been cleaned up."
```