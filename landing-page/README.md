# AWS Amplify S3, CloudFront based Website hosting
When deploying a static website, Amplify remembers the connection between your S3 bucket and deployed website, so you can easily update your website with a single click when you make changes to website content in your S3 bucket. Using AWS Amplify Hosting is the recommended approach for static website hosting because it offers more streamlined and faster deployment without extensive setup.

Here’s how the integration works starting from the Amazon S3 console:

## Deployment Instructions
![Amplify Deployment](/demos/01Amplify.gif)

Deploying a static website using the Amazon S3 console
Let’s use this new integration to host a personal website directly from my S3 bucket.

To get started, I navigate to my bucket in the Amazon S3 console . Here’s the list of all the content in that S3 bucket:

![Amplify Deployment](/demos/02-S3.png)

To use the new integration with AWS Amplify Hosting, I navigate to the Properties section, then I scroll down until I find Static website hosting and select Create Amplify app.
![Amplify Deployment](/demos/03-S3.png)

Then, it redirects me to the Amplify page and populates the details from my S3 bucket. Here, I configure my App name and the Branch name. Then, I select Save and deploy.

![SaveDeploy](/demos/04-Amplify-deployment.png)

Within seconds, AWS Amplify has deployed my static website, and I can visit the site by selecting Visit deployed URL. If I make any subsequent changes in my S3 bucket for my static website, I need to redeploy my application in the Amplify console by selecting the Deploy updates button.

![SaveDeployAmplify](/demos/06.Amplify.png)

I can also use the AWS Command Line Interface (AWS CLI) for programmatic deployment. To do that, I need to get the values for required parameters, such as APP_ID and BRANCH_NAME from my AWS Amplify dashboard. Here’s the command I use for deployment:

aws amplify start-deployment --appId APP_ID --branchName BRANCH_NAME --sourceUrlType=BUCKET_PREFIX --sourceUrl s3://S3_BUCKET/S3_PREFIX
Bash
After Amplify Hosting generates a URL for my website, I can optionally configure a custom domain for my static website. To do that, I navigate to my apps in AWS Amplify and select Custom domains in the navigation pane. Then, I select Add domain to start configuring a custom domain for my static website. Learn more about setting up custom domains in the Amplify Hosting User Guide.

![SaveDeployAmplify](/demos/07-Amplify.png)

In the following screenshot, I have my static website configured with my custom domain. Amplify also issues an SSL/TLS certificate for my domain so that all traffic is secured through HTTPS
![SaveDeployAmplify](/demos/08.Amplify.png)
