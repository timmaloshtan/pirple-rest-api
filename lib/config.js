/*
 * Create and export configuration variables
 * 
 */

// Container for all the environments
const environments = {};

// Staging (default) environment
environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
  hashingSecret: 'thisIsASecret',
  maxChecks: 5,
  twilio: {
    accountSid: 'ACa3b0d78e6fadebc8561615c12380540d',
    authToken: '33b8272a6db5311256b489fdd930a5dc',
    fromPhone: '+12564154143',
  },
};

// Production environment
environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: 'production',
  hashingSecret: 'thisIsAlsoASecret',
  maxChecks: 5,
  twilio: {
    accountSid: 'ACa3b0d78e6fadebc8561615c12380540d',
    authToken: '33b8272a6db5311256b489fdd930a5dc',
    fromPhone: '+12564154143',
  },
};

// Determine which env was passed as a command-line argument
const currentEnvironment = typeof process.env.NODE_ENV == 'string'
  ? process.env.NODE_ENV.toLowerCase()
  : '';

// Check that current env exists in environments container or default to staging
const environmentToExport = typeof environments[currentEnvironment] == 'object'
  ? environments[currentEnvironment]
  : environments.staging;

// Export the module
module.exports = environmentToExport;
