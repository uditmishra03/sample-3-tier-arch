# AWS Account Security Best Practices

This guide outlines essential security controls and recommendations to keep your AWS account secure.

## Account Security Controls

### ACCT.01 Set account-level contacts to valid email distribution lists
- Configure alternate contacts for billing, operations, and security
- Use distribution lists rather than individual email addresses
- Ensure notifications reach the right teams even when staff changes

### ACCT.02 Restrict use of the root user
- Create IAM admin users for day-to-day operations
- Enable MFA for the root user
- Store root user credentials securely
- Only use root for tasks that explicitly require root access

### ACCT.03 Configure console access for each user
- Create individual IAM users for all team members
- Do not share credentials between users
- Implement a process for onboarding and offboarding users

### ACCT.04 Assign permissions
- Follow the principle of least privilege
- Use IAM groups to manage permissions for multiple users
- Use IAM roles for applications and services
- Regularly review and audit permissions

### ACCT.05 Require multi-factor authentication to log in
- Enable MFA for all IAM users, especially those with elevated privileges
- Consider hardware MFA devices for highly privileged accounts
- Implement an MFA enforcement policy

### ACCT.06 Enforce a password policy
- Set minimum password length (at least 12 characters)
- Require a mix of character types
- Enforce password rotation
- Prevent password reuse

### ACCT.07 Deliver CloudTrail logs to a protected S3 bucket
- Enable CloudTrail in all regions
- Configure log file validation
- Enable S3 object versioning for CloudTrail buckets
- Encrypt CloudTrail logs
- Restrict access to CloudTrail buckets

### ACCT.08 Prevent public access to private S3 buckets
- Enable S3 Block Public Access at the account level
- Regularly audit bucket policies and ACLs
- Use IAM policies to control access to S3 resources
- Implement S3 inventory to track objects and their metadata

### ACCT.09 Delete unused VPCs, subnets, and security groups
- Regularly audit and remove unused network resources
- Document the purpose of each VPC and subnet
- Tag resources appropriately
- Use AWS Config to track resource changes

### ACCT.10 Configure AWS Budgets to monitor your spending
- Set up budget alerts for overall account spending
- Create service-specific budgets for high-cost services
- Configure notifications at different thresholds (e.g., 50%, 80%, 90%)
- Review spending patterns regularly

### ACCT.11 Enable and respond to GuardDuty notifications
- Enable GuardDuty in all regions
- Configure automated notifications for findings
- Establish response procedures for different finding types
- Regularly review and triage GuardDuty findings

### ACCT.12 Monitor for and resolve high-risk issues by using Trusted Advisor
- Review Trusted Advisor recommendations regularly
- Prioritize security and service limit warnings
- Implement a process to address identified issues
- Consider Business or Enterprise Support for full Trusted Advisor features

## Implementation Checklist

- [ ] Configure account alternate contacts
- [ ] Secure root account with MFA
- [ ] Create IAM users with appropriate permissions
- [ ] Enable MFA for all IAM users
- [ ] Configure strong password policy
- [ ] Set up CloudTrail logging to secure S3 bucket
- [ ] Enable S3 Block Public Access at account level
- [ ] Clean up unused network resources
- [ ] Configure AWS Budgets
- [ ] Enable GuardDuty
- [ ] Review Trusted Advisor recommendations

## Additional Security Recommendations

- Implement AWS Organizations for multi-account management
- Use Service Control Policies (SCPs) to enforce security guardrails
- Consider AWS Control Tower for account governance
- Implement infrastructure as code for consistent deployments
- Regularly perform security assessments and penetration testing