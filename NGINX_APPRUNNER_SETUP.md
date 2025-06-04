# Deploying Nginx on AWS App Runner

This guide provides step-by-step instructions for deploying a sample application using the public Nginx image on AWS App Runner.

## Prerequisites

- AWS account with appropriate permissions
- AWS CLI installed and configured (optional for CLI deployment)
- Basic understanding of Docker and AWS services

## Step 1: Create a Simple Web Application

Create a directory for your project:

```bash
mkdir nginx-app-runner
cd nginx-app-runner
```

Create a simple HTML file (`index.html`):

```bash
mkdir -p public
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>AWS App Runner with Nginx</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
        }
        h1 {
            color: #232f3e;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello from AWS App Runner!</h1>
        <p>This is a sample application running on Nginx deployed via AWS App Runner.</p>
        <p>Current time: <span id="current-time"></span></p>
    </div>
    <script>
        document.getElementById('current-time').textContent = new Date().toLocaleString();
    </script>
</body>
</html>
EOF
```

## Step 2: Create a Dockerfile

Create a `Dockerfile` that uses the official Nginx image and copies your HTML file:

```bash
cat > Dockerfile << 'EOF'
FROM nginx:alpine

# Copy custom configuration file if needed
# COPY nginx.conf /etc/nginx/nginx.conf

# Copy website files
COPY public /usr/share/nginx/html

# Expose port 8080 (App Runner expects this port)
EXPOSE 8080

# Update nginx configuration to listen on port 8080
RUN sed -i 's/listen\s*80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
EOF
```

## Step 3: Create an apprunner.yaml Configuration File (Optional)

Create an `apprunner.yaml` file for more control over the App Runner service:

```bash
cat > apprunner.yaml << 'EOF'
version: 1.0
runtime: nginx
build:
  commands:
    build:
      - echo "Build phase completed"
run:
  command: nginx -g "daemon off;"
  network:
    port: 8080
    env: PORT
  env:
    - name: NGINX_ENVSUBST_OUTPUT_DIR
      value: /usr/share/nginx/html
EOF
```

## Step 4: Deploy to AWS App Runner

### Option 1: Using AWS Console

1. Log in to the AWS Management Console
2. Navigate to AWS App Runner service
3. Click "Create service"
4. Choose "Container registry" as your source
5. Select "Amazon ECR Public" as the provider
6. Enter the image URI: `public.ecr.aws/nginx/nginx:alpine`
7. Configure service settings:
   - Service name: `nginx-sample-app`
   - Port: `8080`
8. Configure CPU/Memory as needed (e.g., 1 vCPU, 2 GB)
9. Click "Create & deploy"

### Option 2: Using AWS CLI

If you prefer using the AWS CLI, you can deploy with these commands:

```bash
# Create an App Runner service
aws apprunner create-service \
  --service-name nginx-sample-app \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "public.ecr.aws/nginx/nginx:alpine",
      "ImageConfiguration": {
        "Port": "8080"
      },
      "ImageRepositoryType": "ECR_PUBLIC"
    }
  }' \
  --instance-configuration '{
    "Cpu": "1 vCPU",
    "Memory": "2 GB"
  }'
```

### Option 3: Using Docker and AWS App Runner (Custom Image)

If you want to use your custom Nginx configuration and HTML files:

1. Build your Docker image locally:
   ```bash
   docker build -t nginx-app-runner .
   ```

2. Create an ECR repository:
   ```bash
   aws ecr create-repository --repository-name nginx-app-runner
   ```

3. Tag and push your image:
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com
   
   docker tag nginx-app-runner:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/nginx-app-runner:latest
   
   docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/nginx-app-runner:latest
   ```

4. Create an App Runner service using your ECR image:
   ```bash
   aws apprunner create-service \
     --service-name nginx-custom-app \
     --source-configuration '{
       "ImageRepository": {
         "ImageIdentifier": "'$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/nginx-app-runner:latest'",
         "ImageConfiguration": {
           "Port": "8080"
         },
         "ImageRepositoryType": "ECR"
       }
     }' \
     --instance-configuration '{
       "Cpu": "1 vCPU",
       "Memory": "2 GB"
     }'
   ```

## Step 5: Access Your Application

Once deployment is complete (usually takes 2-5 minutes), you can access your application using the domain provided by App Runner:

```
https://[service-id].awsapprunner.com
```

## Step 6: Configure Auto Scaling (Optional)

You can configure auto scaling for your App Runner service:

1. In the AWS Console, go to your App Runner service
2. Click on "Configure"
3. Under "Auto scaling", set:
   - Minimum instances: 1
   - Maximum instances: 5
   - Concurrency: 100 (requests per instance)
4. Click "Save changes"

## Step 7: Set Up Custom Domain (Optional)

To use a custom domain with your App Runner service:

1. In the AWS Console, go to your App Runner service
2. Click on "Custom domains"
3. Click "Add domain"
4. Enter your domain name
5. Follow the instructions to validate domain ownership
6. Update your DNS settings with the provided CNAME records

## Troubleshooting

### Service Fails to Start

Check the logs in the AWS App Runner console:
1. Go to your App Runner service
2. Click on "Logs"
3. Check for any error messages

Common issues:
- Incorrect port configuration (App Runner expects the container to listen on port 8080)
- Memory/CPU limits too low
- Permissions issues with ECR

### Cannot Access the Application

- Ensure the service is in "Running" state
- Check if the Nginx configuration is correctly set to listen on port 8080
- Verify network settings in your App Runner configuration

## Cleanup

To avoid incurring charges, delete your App Runner service when no longer needed:

```bash
aws apprunner delete-service --service-arn [your-service-arn]
```

Or through the AWS Console:
1. Go to the App Runner service
2. Select your service
3. Click "Actions" > "Delete"
4. Confirm deletion

---

This guide provides a basic setup for deploying Nginx on AWS App Runner. For production environments, consider implementing additional security measures and performance optimizations based on your specific requirements.