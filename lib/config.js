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
    accountSid: 'ACCOUNT_S_ID',
    authToken: 'AUTH_TOKEN',
    fromPhone: '+12564154143',
  },
  templateGlobals: {
    appName: 'UptimeChecker',
    companyName: 'NotARealComp, Inc.',
    yearCreated: 2018,
    baseUrl: 'http://localhost:3000/',
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
    accountSid: 'ACCOUNT_S_ID',
    authToken: 'AUTH_TOKEN',
    fromPhone: '+12564154143',
  },
  templateGlobals: {
    appName: 'UptimeChecker',
    companyName: 'NotARealComp, Inc.',
    yearCreated: 2018,
    baseUrl: 'http://localhost:5000/',
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
