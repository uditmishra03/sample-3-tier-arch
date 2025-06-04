# Three-Tier Architecture Demo Landing Page

This is a simple landing page for the AWS Three-Tier Architecture Demo project. It's designed to be hosted on AWS Amplify with CloudFront integration.

## Deployment Instructions

### Option 1: AWS Amplify Console (Recommended)

1. Log in to the AWS Management Console and navigate to AWS Amplify
2. Click "New app" > "Host web app"
3. Choose GitHub as your repository provider and connect your GitHub account
4. Select the repository `elngovind/sample-3-tier-arch`
5. Select the branch you want to deploy (e.g., `main`)
6. Configure build settings:
   - For the build settings, Amplify should automatically detect the `amplify.yml` file
   - Set the base directory to `/landing-page`
7. Review and click "Save and deploy"

AWS Amplify will automatically:
- Build and deploy your site
- Create a CloudFront distribution
- Set up HTTPS with a free SSL/TLS certificate
- Provide a domain like `https://main.abc123.amplifyapp.com`

### Option 2: Manual S3 + CloudFront Setup

1. Create an S3 bucket:
   ```bash
   aws s3 mb s3://three-tier-demo-landing-page --region us-east-1
   ```

2. Enable static website hosting on the bucket:
   ```bash
   aws s3 website s3://three-tier-demo-landing-page --index-document index.html
   ```

3. Upload the landing page files:
   ```bash
   aws s3 sync landing-page/ s3://three-tier-demo-landing-page --acl public-read
   ```

4. Create a CloudFront distribution:
   - Origin: Your S3 bucket website endpoint
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Default Root Object: index.html
   - Cache Policy: CachingOptimized

5. Wait for the CloudFront distribution to deploy (can take up to 15 minutes)

## Customization

- Update the links in `index.html` to point to your specific resources
- Replace `architecture.png` with your own architecture diagram if needed
- Modify the CSS in `styles.css` to match your preferred color scheme

## Features

- Responsive design that works on mobile, tablet, and desktop
- AWS-themed color scheme
- Lightweight and fast-loading
- SEO-friendly structure