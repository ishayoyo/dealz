const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Add error handling for missing API key
if (!process.env.BREVO_API_KEY) {
  console.error('BREVO_API_KEY is not set in environment variables');
  throw new Error('BREVO_API_KEY is required');
}

const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Remove the getAccount test since it's not available
// Instead, we'll test the configuration when actually sending emails

module.exports = apiInstance;
