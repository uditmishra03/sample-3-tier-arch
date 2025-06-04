# CloudFormation Templates for AWS Three-Tier Web Architecture

This directory contains CloudFormation templates that can be used to deploy the AWS Three-Tier Web Architecture in an automated way, following Infrastructure as Code (IaC) best practices.

## Templates Overview

1. **three-tier-vpc.yaml** - Creates the VPC, subnets, route tables, NAT gateways, and security groups
2. **database.yaml** - Deploys the Aurora MySQL database cluster with Secrets Manager integration
3. **app-tier.yaml** (to be created) - Deploys the application tier with Auto Scaling Group and internal load balancer
4. **web-tier.yaml** (to be created) - Deploys the web tier with Auto Scaling Group and external load balancer

## Deployment Order

The templates should be deployed in the following order:

1. VPC and network infrastructure
2. Database tier
3. Application tier
4. Web tier

## Deployment Instructions

### Using AWS Management Console

1. Navigate to the CloudFormation service in the AWS Management Console
2. Click "Create stack" and select "With new resources (standard)"
3. Choose "Upload a template file" and upload the desired template
4. Follow the prompts to provide parameter values and create the stack

### Using AWS CLI

```bash
# Deploy VPC and network infrastructure
aws cloudformation create-stack \
  --stack-name three-tier-vpc \
  --template-body file://three-tier-vpc.yaml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=ThreeTierDemo

# Deploy database tier (after VPC stack is complete)
aws cloudformation create-stack \
  --stack-name three-tier-database \
  --template-body file://database.yaml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=ThreeTierDemo \
               ParameterKey=DBUsername,ParameterValue=admin \
               ParameterKey=DBPassword,ParameterValue=YourSecurePassword \
  --capabilities CAPABILITY_IAM
```

## Benefits of Using CloudFormation

- **Consistency**: Ensures consistent deployment across different environments
- **Version Control**: Templates can be versioned in a code repository
- **Automation**: Reduces manual steps and human error
- **Documentation**: Templates serve as documentation for the infrastructure
- **Scalability**: Makes it easy to scale the architecture up or down
- **Repeatability**: Enables easy redeployment or recreation of resources

## Best Practices

- Store sensitive parameters like database credentials in AWS Systems Manager Parameter Store or AWS Secrets Manager
- Use CloudFormation nested stacks for complex architectures
- Implement proper IAM roles with least privilege principle
- Enable AWS CloudTrail for auditing and monitoring
- Use AWS Config to ensure compliance with organizational policies

## Extensions

- Consider using AWS CDK (Cloud Development Kit) for a more programmatic approach to infrastructure definition
- Implement CI/CD pipelines for automated testing and deployment of infrastructure changes
- Add monitoring and alerting using Amazon CloudWatch
- Implement disaster recovery strategies with cross-region replication