# App Tier for AWS Three-Tier Web Architecture

This is the application tier component of the AWS Three-Tier Web Architecture demo. It provides a RESTful API for managing transactions in a MySQL/Aurora database.

## Features

- RESTful API endpoints for transaction management
- Connection pooling for improved performance
- Parameterized queries to prevent SQL injection
- AWS Secrets Manager integration for secure credential management
- Enhanced health check endpoint with database connectivity verification

## Environment Variables

The application can be configured using the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Port on which the application runs | 4000 |
| DB_HOST | Database hostname/endpoint | - |
| DB_USER | Database username | - |
| DB_PWD | Database password | - |
| DB_DATABASE | Database name | - |
| DB_SECRET_NAME | AWS Secrets Manager secret name (optional) | - |
| AWS_REGION | AWS region for Secrets Manager | us-east-1 |

## AWS Secrets Manager

For enhanced security, you can store database credentials in AWS Secrets Manager instead of environment variables. Create a secret with the following structure:

```json
{
  "host": "your-db-endpoint.region.rds.amazonaws.com",
  "username": "your-username",
  "password": "your-password",
  "dbname": "webappdb"
}
```

Then set the `DB_SECRET_NAME` environment variable to the name of your secret.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /health | GET | Health check endpoint |
| /transaction | GET | Get all transactions |
| /transaction | POST | Add a new transaction |
| /transaction | DELETE | Delete all transactions |
| /transaction/id | GET | Get transaction by ID |
| /transaction/id | DELETE | Delete transaction by ID |

## Running Locally

1. Install dependencies:
   ```
   npm install
   ```

2. Set environment variables or create a `.env` file

3. Start the application:
   ```
   npm start
   ```

## Security Best Practices

- Use AWS Secrets Manager for credential management
- Implement proper input validation
- Use parameterized queries to prevent SQL injection
- Configure proper IAM roles with least privilege
- Enable AWS CloudTrail for API call logging
- Consider using AWS WAF for additional protection

## License

This project is licensed under the MIT-0 License.