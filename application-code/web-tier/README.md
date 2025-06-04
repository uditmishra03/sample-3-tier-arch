# Web Tier for AWS Three-Tier Web Architecture

This is the web tier component of the AWS Three-Tier Web Architecture demo. It provides a React.js frontend that communicates with the application tier API.

## Features

- React.js frontend with responsive design
- NGINX web server configuration for serving static content
- API proxy configuration to route requests to the application tier
- Health check endpoint for load balancer integration

## Environment Setup

The web tier requires the following environment setup:

1. Node.js (version 16 or later) for building the React application
2. NGINX for serving the static content and proxying API requests

## Configuration

The NGINX configuration file (`nginx.conf`) needs to be updated with your internal load balancer DNS name:

```
location /api/{
    proxy_pass http://[REPLACE-WITH-INTERNAL-LB-DNS]:80/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

## Building the Application

To build the React application:

```bash
npm install
npm run build
```

This will create a `build` directory with the compiled application.

## Deployment

The web tier is designed to be deployed on EC2 instances with the following setup:

1. Install Node.js and NGINX
2. Copy the web tier code to the instance
3. Build the React application
4. Configure NGINX to serve the built application
5. Start NGINX and ensure it starts on boot

## Security Considerations

- Always use HTTPS in production environments
- Implement proper Content Security Policy headers
- Keep dependencies updated to avoid security vulnerabilities
- Use AWS WAF to protect against common web exploits

## Monitoring and Logging

- Configure NGINX access and error logs
- Set up CloudWatch Logs for centralized logging
- Implement custom metrics for application performance monitoring

## License

This project is licensed under the MIT-0 License.