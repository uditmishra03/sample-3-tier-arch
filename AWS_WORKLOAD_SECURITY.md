# AWS Workload Security Best Practices

This guide outlines essential security controls and recommendations to secure your workloads running in AWS, including detailed implementation steps.

## Workload Security Controls

### WKLD.01 Use IAM roles for compute environment permissions

**Implementation Steps:**
1. Create an IAM role for your compute environment:
   - Go to IAM console → "Roles" → "Create role"
   - Select the appropriate trusted entity:
     - For EC2: Choose "AWS service" → "EC2"
     - For Lambda: Choose "AWS service" → "Lambda"
     - For ECS: Choose "AWS service" → "Elastic Container Service"
   - Attach policies based on least privilege principle
   - Name the role appropriately (e.g., "ec2-app-role", "lambda-api-role")

2. Assign the role to your compute resource:
   - For EC2:
     ```bash
     # When launching a new instance
     aws ec2 run-instances --image-id ami-12345678 --instance-type t2.micro --iam-instance-profile Name=ec2-app-role

     # For existing instance
     aws ec2 associate-iam-instance-profile --instance-id i-1234567890abcdef0 --iam-instance-profile Name=ec2-app-role
     ```
   - For Lambda:
     - During function creation, specify the execution role
     - Or update an existing function:
     ```bash
     aws lambda update-function-configuration --function-name my-function --role arn:aws:iam::123456789012:role/lambda-api-role
     ```
   - For ECS:
     - In task definition, specify the task execution role and task role

3. Verify role assignment:
   ```bash
   # For EC2
   aws ec2 describe-instances --instance-ids i-1234567890abcdef0 --query 'Reservations[*].Instances[*].IamInstanceProfile'
   
   # For Lambda
   aws lambda get-function --function-name my-function --query 'Configuration.Role'
   ```

### WKLD.02 Restrict credential usage scope with resource-based policies permissions

**Implementation Steps:**
1. Create a resource-based policy for S3 bucket:
   - Go to S3 console → Select bucket → "Permissions" tab
   - Under "Bucket policy", click "Edit"
   - Add a policy like:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::123456789012:role/specific-app-role"
         },
         "Action": [
           "s3:GetObject",
           "s3:PutObject"
         ],
         "Resource": "arn:aws:s3:::my-bucket/app-prefix/*",
         "Condition": {
           "IpAddress": {
             "aws:SourceIp": "192.0.2.0/24"
           },
           "StringEquals": {
             "aws:SourceVpc": "vpc-1234567890abcdef0"
           }
         }
       }
     ]
   }
   ```

2. Create a resource-based policy for Lambda:
   ```bash
   aws lambda add-permission \
     --function-name my-function \
     --statement-id sid-12345 \
     --action lambda:InvokeFunction \
     --principal s3.amazonaws.com \
     --source-arn arn:aws:s3:::my-bucket \
     --source-account 123456789012
   ```

3. Create a resource-based policy for SQS:
   - Go to SQS console → Select queue → "Access policy" tab
   - Add a policy like:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Service": "lambda.amazonaws.com"
         },
         "Action": "sqs:SendMessage",
         "Resource": "arn:aws:sqs:us-east-1:123456789012:my-queue",
         "Condition": {
           "ArnEquals": {
             "aws:SourceArn": "arn:aws:lambda:us-east-1:123456789012:function:my-function"
           }
         }
       }
     ]
   }
   ```

### WKLD.03 Use ephemeral secrets or a secrets-management service

**Implementation Steps:**
1. Set up AWS Secrets Manager:
   - Go to Secrets Manager console → "Store a new secret"
   - Select secret type (e.g., "Credentials for RDS database")
   - Enter the secret values
   - Configure automatic rotation if applicable
   - Set up encryption key (default or custom KMS key)
   - Add tags for organization

2. Configure secret rotation:
   - In the secret details page, click "Edit rotation"
   - Enable automatic rotation
   - Set rotation schedule (e.g., every 30 days)
   - Select or create a Lambda rotation function

3. Access secrets in your application:
   - For Lambda functions:
   ```python
   import boto3
   import json
   
   def get_secret():
       client = boto3.client('secretsmanager')
       response = client.get_secret_value(SecretId='my-secret-name')
       return json.loads(response['SecretString'])
   
   def lambda_handler(event, context):
       secret = get_secret()
       # Use secret values
       db_username = secret['username']
       db_password = secret['password']
   ```

   - For EC2 instances (using the AWS SDK):
   ```python
   import boto3
   import json
   
   def get_secret():
       client = boto3.client('secretsmanager')
       response = client.get_secret_value(SecretId='my-secret-name')
       return json.loads(response['SecretString'])
   ```

### WKLD.04 Prevent application secrets from being exposed

**Implementation Steps:**
1. Set up git-secrets to prevent committing secrets:
   ```bash
   # Install git-secrets
   git clone https://github.com/awslabs/git-secrets.git
   cd git-secrets
   make install
   
   # Configure git-secrets for your repository
   cd /path/to/your/repo
   git secrets --install
   git secrets --register-aws
   
   # Add custom patterns
   git secrets --add 'password\s*=\s*.+'
   git secrets --add 'secret\s*=\s*.+'
   git secrets --add 'key\s*=\s*.+'
   ```

2. Configure environment variables for sensitive information:
   - For EC2:
     - Add to /etc/environment or application startup script
   - For Lambda:
     - Add in the Lambda console under "Environment variables"
   - For ECS:
     - Add in task definition under "Environment variables"

3. Use AWS Systems Manager Parameter Store for configuration:
   ```bash
   # Store a parameter
   aws ssm put-parameter \
     --name "/app/production/database/password" \
     --value "mypassword" \
     --type "SecureString"
   
   # Retrieve a parameter in your application
   password=$(aws ssm get-parameter \
     --name "/app/production/database/password" \
     --with-decryption \
     --query "Parameter.Value" \
     --output text)
   ```

### WKLD.05 Detect and remediate exposed secrets

**Implementation Steps:**
1. Set up Amazon CodeGuru Reviewer:
   - Go to CodeGuru console
   - Click "Associate repository"
   - Connect your code repository (GitHub, Bitbucket, etc.)
   - Enable automated code reviews

2. Implement git-secrets pre-commit hooks:
   ```bash
   # Add pre-commit hook
   cat > .git/hooks/pre-commit << 'EOF'
   #!/bin/bash
   git secrets --pre_commit_hook -- "$@"
   EOF
   
   chmod +x .git/hooks/pre-commit
   ```

3. Create an incident response plan for exposed secrets:
   ```
   Secret Exposure Response Plan:
   
   1. Immediate Actions:
      - Revoke the exposed secret immediately
      - Generate new credentials
      - Update all systems using the credential
      - Remove secret from code repository history
   
   2. Investigation:
      - Determine exposure timeframe
      - Identify potential unauthorized access
      - Review access logs for suspicious activity
   
   3. Documentation:
      - Document the incident details
      - Record remediation steps taken
      - Update security practices as needed
   ```

### WKLD.06 Use Systems Manager instead of SSH or RDP

**Implementation Steps:**
1. Install SSM Agent on EC2 instances:
   - Most Amazon Machine Images (AMIs) have it pre-installed
   - For custom AMIs:
   ```bash
   # Amazon Linux 2
   sudo yum install -y amazon-ssm-agent
   sudo systemctl enable amazon-ssm-agent
   sudo systemctl start amazon-ssm-agent
   
   # Ubuntu
   sudo snap install amazon-ssm-agent --classic
   sudo systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service
   sudo systemctl start snap.amazon-ssm-agent.amazon-ssm-agent.service
   ```

2. Configure IAM permissions:
   - Attach the `AmazonSSMManagedInstanceCore` policy to your EC2 instance role

3. Start a session:
   - Using AWS Console:
     - Go to Systems Manager console → "Session Manager"
     - Click "Start session"
     - Select your instance
     - Click "Start session"
   
   - Using AWS CLI:
   ```bash
   aws ssm start-session --target i-1234567890abcdef0
   ```

4. Configure session logging:
   - Go to Systems Manager console → "Session Manager" → "Preferences"
   - Enable "CloudWatch logs" and/or "S3 logging"
   - Specify log group or S3 bucket
   - Enable "CloudTrail logging"

### WKLD.07 Log data events for S3 buckets with sensitive data

**Implementation Steps:**
1. Create a new CloudTrail trail or use existing one:
   - Go to CloudTrail console → "Trails" → "Create trail"
   - Name the trail
   - Configure storage location (S3 bucket)
   - Enable log file validation
   - Enable encryption

2. Configure data events for S3:
   - In the trail configuration, under "Events", select "Data events"
   - Choose "S3" as the data source
   - Select "All current and future S3 buckets" or specific buckets
   - Select the event types (Read, Write, or both)
   - Save the trail configuration

3. Set up alerts for unauthorized access:
   - Go to CloudWatch console → "Rules" → "Create rule"
   - Select "Event Pattern"
   - Choose "Custom pattern" and use:
   ```json
   {
     "source": ["aws.s3"],
     "detail-type": ["AWS API Call via CloudTrail"],
     "detail": {
       "eventSource": ["s3.amazonaws.com"],
       "eventName": ["GetObject", "PutObject", "DeleteObject"],
       "requestParameters": {
         "bucketName": ["sensitive-data-bucket"]
       },
       "errorCode": ["AccessDenied"]
     }
   }
   ```
   - Set target as SNS topic to send notifications

### WKLD.08 Encrypt Amazon EBS volumes

**Implementation Steps:**
1. Enable EBS encryption by default:
   - Go to EC2 console → "EC2 Dashboard" → "Account attributes"
   - Select "EBS encryption"
   - Click "Manage"
   - Check "Enable" and select a KMS key
   - Click "Update EBS encryption"

2. Create encrypted volumes for existing instances:
   ```bash
   # Create a snapshot of the existing volume
   aws ec2 create-snapshot --volume-id vol-1234567890abcdef0 --description "Snapshot for encryption"
   
   # Create an encrypted copy of the snapshot
   aws ec2 copy-snapshot --source-snapshot-id snap-1234567890abcdef0 --source-region us-east-1 --destination-region us-east-1 --encrypted --kms-key-id alias/my-key
   
   # Create a new volume from the encrypted snapshot
   aws ec2 create-volume --snapshot-id snap-0987654321fedcba0 --availability-zone us-east-1a --encrypted --kms-key-id alias/my-key
   ```

3. Attach the encrypted volume:
   ```bash
   aws ec2 detach-volume --volume-id vol-1234567890abcdef0
   aws ec2 attach-volume --volume-id vol-0987654321fedcba0 --instance-id i-1234567890abcdef0 --device /dev/sda1
   ```

### WKLD.09 Encrypt Amazon RDS databases

**Implementation Steps:**
1. Enable encryption for new RDS instances:
   - Go to RDS console → "Create database"
   - Configure database settings
   - Under "Encryption", select "Enable encryption"
   - Choose a KMS key
   - Complete the database creation process

2. Encrypt an existing unencrypted RDS instance:
   - Create an encrypted snapshot of the unencrypted DB instance:
     - Go to RDS console → Select DB instance → "Actions" → "Take snapshot"
     - Create the snapshot
   - Copy the snapshot with encryption enabled:
     - Select the snapshot → "Actions" → "Copy snapshot"
     - Enable encryption and select KMS key
   - Restore a new DB instance from the encrypted snapshot:
     - Select the encrypted snapshot → "Actions" → "Restore snapshot"
     - Configure the new DB instance
   - Update your application to use the new encrypted DB instance
   - Delete the old unencrypted DB instance when ready

3. Configure SSL/TLS for data in transit:
   - Download the Amazon RDS root certificate:
     ```bash
     wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
     ```
   - Configure your application to use SSL:
     - For MySQL:
     ```
     jdbc:mysql://mydbinstance.123456789012.us-east-1.rds.amazonaws.com:3306/mydb?useSSL=true&requireSSL=true&verifyServerCertificate=true&trustCertificateKeyStoreUrl=file:///path/to/global-bundle.pem
     ```
     - For PostgreSQL:
     ```
     jdbc:postgresql://mydbinstance.123456789012.us-east-1.rds.amazonaws.com:5432/mydb?ssl=true&sslrootcert=/path/to/global-bundle.pem
     ```

### WKLD.10 Deploy private resources into private subnets

**Implementation Steps:**
1. Create a VPC with public and private subnets:
   - Go to VPC console → "Create VPC"
   - Select "VPC and more"
   - Configure CIDR blocks (e.g., 10.0.0.0/16)
   - Select at least 2 Availability Zones
   - Configure public and private subnets
   - Enable NAT gateway for private subnet internet access
   - Click "Create VPC"

2. Deploy resources to appropriate subnets:
   - Public-facing resources (load balancers):
     ```bash
     aws elbv2 create-load-balancer \
       --name my-public-alb \
       --subnets subnet-public1 subnet-public2 \
       --security-groups sg-12345678
     ```
   
   - Private resources (application servers):
     ```bash
     aws ec2 run-instances \
       --image-id ami-12345678 \
       --instance-type t3.micro \
       --subnet-id subnet-private1 \
       --security-group-ids sg-87654321
     ```
   
   - Database resources:
     ```bash
     aws rds create-db-instance \
       --db-instance-identifier mydbinstance \
       --db-instance-class db.t3.micro \
       --engine mysql \
       --master-username admin \
       --master-user-password password \
       --allocated-storage 20 \
       --db-subnet-group-name my-private-db-subnet-group
     ```

3. Configure network ACLs for subnet-level security:
   - Go to VPC console → "Network ACLs" → "Create network ACL"
   - Associate with appropriate subnets
   - Add inbound and outbound rules based on security requirements

### WKLD.11 Restrict network access by using security groups

**Implementation Steps:**
1. Create security groups with least privilege:
   ```bash
   # Create web tier security group
   aws ec2 create-security-group \
     --group-name web-tier-sg \
     --description "Security group for web tier" \
     --vpc-id vpc-1234567890abcdef0
   
   # Add rules to allow HTTP/HTTPS only from load balancer
   aws ec2 authorize-security-group-ingress \
     --group-id sg-web-tier \
     --protocol tcp \
     --port 80 \
     --source-group sg-load-balancer
   
   aws ec2 authorize-security-group-ingress \
     --group-id sg-web-tier \
     --protocol tcp \
     --port 443 \
     --source-group sg-load-balancer
   ```

2. Use security group references instead of CIDR blocks:
   ```bash
   # Allow app tier to access database tier
   aws ec2 authorize-security-group-ingress \
     --group-id sg-database-tier \
     --protocol tcp \
     --port 3306 \
     --source-group sg-app-tier
   ```

3. Set up regular security group auditing:
   ```bash
   # List all security groups with wide-open rules
   aws ec2 describe-security-groups \
     --filters "Name=ip-permission.cidr,Values=0.0.0.0/0" \
     --query "SecurityGroups[*].[GroupId, GroupName, IpPermissions]"
   ```

### WKLD.12 Use VPC endpoints to access supported services

**Implementation Steps:**
1. Create a Gateway endpoint for S3:
   - Go to VPC console → "Endpoints" → "Create endpoint"
   - Select service: "com.amazonaws.region.s3"
   - Select your VPC
   - Select route tables for your private subnets
   - Configure policy (default or custom)
   - Click "Create endpoint"

2. Create an Interface endpoint for other AWS services:
   ```bash
   aws ec2 create-vpc-endpoint \
     --vpc-id vpc-1234567890abcdef0 \
     --service-name com.amazonaws.us-east-1.secretsmanager \
     --vpc-endpoint-type Interface \
     --subnet-ids subnet-private1 subnet-private2 \
     --security-group-ids sg-endpoint \
     --private-dns-enabled
   ```

3. Configure endpoint policies:
   - Go to VPC console → "Endpoints" → Select endpoint → "Policy" tab
   - Click "Edit policy"
   - Add a policy like:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": "*",
         "Action": [
           "s3:GetObject",
           "s3:PutObject"
         ],
         "Resource": [
           "arn:aws:s3:::my-bucket/*"
         ]
       }
     ]
   }
   ```

### WKLD.13 Require HTTPS for all public web endpoints

**Implementation Steps:**
1. Configure HTTPS on Application Load Balancer:
   - Go to EC2 console → "Load Balancers" → Select your ALB
   - Click "Listeners" tab → "Add listener"
   - Protocol: HTTPS
   - Port: 443
   - Select or import SSL certificate
   - Configure security policy (ELBSecurityPolicy-TLS-1-2-2017-01 or newer)

2. Implement HTTP to HTTPS redirection:
   - Edit the HTTP:80 listener
   - Remove existing actions
   - Add action: "Redirect to HTTPS"
   - Set port to 443
   - Set status code to 301 (Permanent)

3. Configure security headers in CloudFront:
   - Go to CloudFront console → Select distribution → "Behaviors" tab
   - Edit behavior → "Response headers policy"
   - Create or select a policy with:
     - Strict-Transport-Security (HSTS)
     - X-Content-Type-Options
     - X-Frame-Options
     - Content-Security-Policy

### WKLD.14 Use edge-protection services for public endpoints

**Implementation Steps:**
1. Set up AWS WAF:
   - Go to WAF & Shield console → "Web ACLs" → "Create web ACL"
   - Name the web ACL and select region
   - Select resource type (CloudFront, ALB, API Gateway, etc.)
   - Add managed rule groups:
     - AWS Core rule set
     - Amazon IP reputation list
     - Known bad inputs
   - Add custom rules as needed
   - Set default action (Allow or Block)
   - Associate with your resources

2. Enable AWS Shield Standard (free) or upgrade to Advanced:
   - Shield Standard is automatically enabled
   - For Shield Advanced:
     - Go to WAF & Shield console → "Shield" → "Shield Advanced"
     - Click "Subscribe to Shield Advanced"
     - Select resources to protect
     - Configure notifications

3. Configure CloudFront security settings:
   - Go to CloudFront console → Select distribution → "Security" tab
   - Enable "Custom SSL certificate"
   - Set Security Policy to TLSv1.2_2021 or newer
   - Enable "HTTP/3"
   - Associate with WAF web ACL

4. Implement rate limiting for API Gateway:
   - Go to API Gateway console → Select API → "Usage Plans"
   - Create a usage plan with:
     - Rate: e.g., 10 requests per second
     - Burst: e.g., 20 requests
     - Quota: e.g., 10000 requests per day

### WKLD.15 Define security controls in templates and deploy them by using CI/CD practices

**Implementation Steps:**
1. Create CloudFormation templates with security controls:
   ```yaml
   Resources:
     MyS3Bucket:
       Type: AWS::S3::Bucket
       Properties:
         BucketName: my-secure-bucket
         BucketEncryption:
           ServerSideEncryptionConfiguration:
             - ServerSideEncryptionByDefault:
                 SSEAlgorithm: AES256
         PublicAccessBlockConfiguration:
           BlockPublicAcls: true
           BlockPublicPolicy: true
           IgnorePublicAcls: true
           RestrictPublicBuckets: true
         VersioningConfiguration:
           Status: Enabled
   ```

2. Set up AWS CodePipeline with security scanning:
   - Go to CodePipeline console → "Create pipeline"
   - Configure source stage (CodeCommit, GitHub, etc.)
   - Add build stage with security scanning:
     - Use AWS CodeBuild
     - Add cfn-nag or cfn-lint to buildspec.yml:
     ```yaml
     version: 0.2
     phases:
       install:
         runtime-versions:
           ruby: 2.6
         commands:
           - gem install cfn-nag
       build:
         commands:
           - cfn-nag-scan --input-path templates/
     ```
   - Add deploy stage using CloudFormation

3. Implement automated compliance validation:
   - Add AWS Config rules to your templates:
   ```yaml
   ComplianceRule:
     Type: AWS::Config::ConfigRule
     Properties:
       ConfigRuleName: encrypted-volumes
       Description: Checks if EBS volumes are encrypted
       Source:
         Owner: AWS
         SourceIdentifier: ENCRYPTED_VOLUMES
   ```

## Implementation Checklist

- [ ] Configure IAM roles for all compute environments
- [ ] Implement resource-based policies for critical resources
- [ ] Set up a secrets management solution
- [ ] Implement code scanning for secrets detection
- [ ] Configure Systems Manager for server access
- [ ] Enable logging for sensitive data access
- [ ] Encrypt all storage and database resources
- [ ] Review and implement network segmentation
- [ ] Configure security groups with least privilege
- [ ] Implement VPC endpoints for AWS services
- [ ] Enforce HTTPS for all web traffic
- [ ] Deploy edge protection services
- [ ] Implement security controls in IaC templates

## Additional Security Recommendations

- Implement automated vulnerability scanning
- Use AWS Security Hub for centralized security management
- Implement container security best practices
- Consider implementing AWS Config rules for continuous compliance
- Regularly perform penetration testing with AWS approval