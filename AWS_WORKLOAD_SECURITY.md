# AWS Workload Security Best Practices

This guide outlines essential security controls and recommendations to secure your workloads running in AWS.

## Workload Security Controls

### WKLD.01 Use IAM roles for compute environment permissions
- Assign IAM roles to EC2 instances, Lambda functions, and containers
- Avoid storing access keys in application code or configuration files
- Regularly rotate credentials when IAM roles cannot be used
- Use instance profiles for EC2 instances

### WKLD.02 Restrict credential usage scope with resource-based policies permissions
- Implement least privilege access for all resources
- Use resource-based policies to limit what actions can be performed
- Restrict access by source IP, VPC, or service
- Regularly audit and review resource policies

### WKLD.03 Use ephemeral secrets or a secrets-management service
- Implement AWS Secrets Manager or AWS Systems Manager Parameter Store
- Automate secret rotation
- Use temporary credentials whenever possible
- Implement a centralized secrets management strategy

### WKLD.04 Prevent application secrets from being exposed
- Never commit secrets to code repositories
- Use environment variables for sensitive configuration
- Implement pre-commit hooks to detect secrets in code
- Use infrastructure as code to manage secrets securely

### WKLD.05 Detect and remediate exposed secrets
- Implement automated scanning for exposed secrets
- Use tools like git-secrets or Amazon CodeGuru
- Create incident response plans for secret exposure
- Implement automated remediation where possible

### WKLD.06 Use Systems Manager instead of SSH or RDP
- Implement AWS Systems Manager Session Manager for server access
- Disable direct SSH/RDP access from the internet
- Log and audit all session activity
- Implement just-in-time access for administrative sessions

### WKLD.07 Log data events for S3 buckets with sensitive data
- Enable CloudTrail data events for sensitive S3 buckets
- Configure alerts for unauthorized access attempts
- Implement automated analysis of access patterns
- Retain logs according to compliance requirements

### WKLD.08 Encrypt Amazon EBS volumes
- Enable encryption by default for all EBS volumes
- Use AWS KMS customer managed keys for sensitive data
- Implement procedures to verify encryption status
- Create AMIs with encrypted snapshots

### WKLD.09 Encrypt Amazon RDS databases
- Enable encryption for all RDS instances at creation
- Use AWS KMS for managing encryption keys
- Enable SSL/TLS for data in transit
- Implement encryption for RDS snapshots

### WKLD.10 Deploy private resources into private subnets
- Use a layered network architecture with public and private subnets
- Place databases and application servers in private subnets
- Only place load balancers and bastion hosts in public subnets
- Implement network ACLs for subnet-level security

### WKLD.11 Restrict network access by using security groups
- Implement least-privilege security group rules
- Avoid using 0.0.0.0/0 in security group rules
- Use security group references instead of CIDR blocks where possible
- Regularly audit security group rules

### WKLD.12 Use VPC endpoints to access supported services
- Implement VPC endpoints for AWS services
- Use Gateway endpoints for S3 and DynamoDB
- Use Interface endpoints (powered by AWS PrivateLink) for other services
- Configure endpoint policies to restrict access

### WKLD.13 Require HTTPS for all public web endpoints
- Enforce HTTPS for all web traffic
- Implement HTTP to HTTPS redirection
- Use TLS 1.2 or later
- Regularly rotate and update certificates

### WKLD.14 Use edge-protection services for public endpoints
- Implement AWS WAF for web application protection
- Use AWS Shield for DDoS protection
- Configure Amazon CloudFront with appropriate security headers
- Implement rate limiting for API endpoints

### WKLD.15 Define security controls in templates and deploy them by using CI/CD practices
- Use infrastructure as code (CloudFormation, CDK, Terraform)
- Implement security scanning in CI/CD pipelines
- Automate compliance validation
- Implement immutable infrastructure patterns

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