# AWS Amplify Deployment Guide

AWS Amplify Hosting is a fully managed service for hosting static sites that handles various aspects of deploying a website. It gives you benefits such as custom domain configuration with SSL, redirects, custom headers, and deployment on a globally available CDN powered by Amazon CloudFront.

## Benefits of AWS Amplify Hosting

- Custom domain configuration with SSL
- Redirects and custom headers
- Global CDN powered by Amazon CloudFront
- Remembers connection between S3 bucket and deployed website
- Streamlined and faster deployment without extensive setup

## Deployment Process from S3 Console

### 1. Navigate to your S3 bucket

![S3 Bucket Contents](/demos/02-S3.png)

### 2. Find Static website hosting and select Create Amplify app

![Create Amplify App](/demos/03-S3.png)

### 3. Configure App name and Branch name, then Save and deploy

![Amplify Configuration](/demos/04-Amplify-deployment.png)

### 4. Deployment Process

![Amplify Deployment](/demos/01Amplify.gif)

### 5. Access Your Deployed Site

Once deployment is complete, you can visit the site by selecting "Visit deployed URL".

![Amplify Dashboard](/demos/07-Amplify.png)

## Updating Your Website

If you make any subsequent changes in your S3 bucket for your static website, redeploy your application in the Amplify console by selecting the "Deploy updates" button.

![Amplify Updates](/demos/06.Amplify)

## CLI Deployment Option

You can also use the AWS Command Line Interface (AWS CLI) for programmatic deployment:

```bash
aws amplify start-deployment --appId APP_ID --branchName BRANCH_NAME --sourceUrlType=BUCKET_PREFIX --sourceUrl s3://S3_BUCKET/S3_PREFIX
```

Get the values for required parameters (APP_ID and BRANCH_NAME) from your AWS Amplify dashboard.

## Custom Domain Configuration

1. Navigate to your apps in AWS Amplify
2. Select "Custom domains" in the navigation pane
3. Select "Add domain" to configure a custom domain

![Custom Domain](/demos/08.Amplify)

Amplify also issues an SSL/TLS certificate for your domain so that all traffic is secured through HTTPS.

## Why Use AWS Amplify Hosting?

Using AWS Amplify Hosting is the recommended approach for static website hosting because it offers more streamlined and faster deployment without extensive setup. When deploying a static website, Amplify remembers the connection between your S3 bucket and deployed website, so you can easily update your website with a single click when you make changes to website content in your S3 bucket.