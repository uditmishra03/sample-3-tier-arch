// DbConfig.js - Updated with AWS Secrets Manager support
const AWS = require('aws-sdk');

// Default values (will be overridden if using Secrets Manager)
let config = {
    DB_HOST: '',
    DB_USER: '',
    DB_PWD: '',
    DB_DATABASE: ''
};

// Function to load secrets from AWS Secrets Manager
async function loadSecrets() {
    try {
        // Create a Secrets Manager client
        const client = new AWS.SecretsManager({
            region: process.env.AWS_REGION || 'us-east-1'
        });
        
        const secretName = process.env.DB_SECRET_NAME;
        
        // Only attempt to load from Secrets Manager if a secret name is provided
        if (secretName) {
            const data = await client.getSecretValue({ SecretId: secretName }).promise();
            let secretString;
            
            // Decode binary secret if needed
            if ('SecretString' in data) {
                secretString = data.SecretString;
            } else {
                const buff = Buffer.from(data.SecretBinary, 'base64');
                secretString = buff.toString('ascii');
            }
            
            const secretData = JSON.parse(secretString);
            
            // Update config with values from Secrets Manager
            config = {
                DB_HOST: secretData.host || config.DB_HOST,
                DB_USER: secretData.username || config.DB_USER,
                DB_PWD: secretData.password || config.DB_PWD,
                DB_DATABASE: secretData.dbname || config.DB_DATABASE
            };
            
            console.log('Database configuration loaded from Secrets Manager');
        } else {
            console.log('No DB_SECRET_NAME provided, using environment variables or defaults');
            
            // If not using Secrets Manager, try environment variables
            config = {
                DB_HOST: process.env.DB_HOST || config.DB_HOST,
                DB_USER: process.env.DB_USER || config.DB_USER,
                DB_PWD: process.env.DB_PWD || config.DB_PWD,
                DB_DATABASE: process.env.DB_DATABASE || config.DB_DATABASE
            };
        }
    } catch (err) {
        console.error('Error loading database configuration from Secrets Manager:', err);
        // Fall back to environment variables
        config = {
            DB_HOST: process.env.DB_HOST || config.DB_HOST,
            DB_USER: process.env.DB_USER || config.DB_USER,
            DB_PWD: process.env.DB_PWD || config.DB_PWD,
            DB_DATABASE: process.env.DB_DATABASE || config.DB_DATABASE
        };
    }
}

// Initialize config (for backwards compatibility with existing code)
// This allows the module to be used synchronously while secrets load asynchronously
loadSecrets().catch(err => console.error('Failed to load secrets:', err));

module.exports = Object.freeze(config);