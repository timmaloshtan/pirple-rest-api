/**
 * Checks handler
 */

// Dependencies
const validation = require('../validation');
const _data = require('../data');
const config = require('../config');
const helpers = require('../helpers');

// Create a top level handler
const checks = async data => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.includes(data.method)) {
    return await _checks[data.method](data);
  } else {
    return { statusCode: 405 };
  }
};

// Create a container for method handlers
const _checks = {};

// Checks - post
// Required data: protocol, url, method, successCodes, timeoutSeconds
// Optional data: none
_checks.post = async data => {
  const protocol = validation.checkProtocol(data.payload.protocol);
  const url = validation.checkNonEmptyString(data.payload.url);
  const method = validation.checkMethod(data.payload.method);
  const successCodes = validation.checkSuccessCodes(data.payload.successCodes);
  const timeoutSeconds = validation.checkTimeoutSeconds(data.payload.timeoutSeconds);

  if (!protocol || !url || !method || !successCodes || !timeoutSeconds) {
    return {
      statusCode: 400,
      payload: { error: 'Missing required inputs or inputs are invalid'},
    };
  }

  // Check that the token is valid
  const token = validation.checkToken(data.headers.token);
  // Read the token from file systen
  let tokenData;
  try {
    tokenData = await _data.read('tokens', token);
  } catch (error) {
    return { statusCode: 403 };
  }

  const { phone } = tokenData;

  // Lookup the user data
  let userData;
  try {
    userData = await _data.read('users', phone);
  } catch (error) {
    return { statusCode: 403 };
  }

  const userChecks = typeof userData.checks === 'object'
    && userData.checks instanceof Array
      ? userData.checks
      : [];

  // Verify that the user is within checks limit
  if (userChecks.length >= config.maxChecks) {
    return {
      statusCode: 400,
      payload: { error: `User already exceeded checks limit. ${config.maxChecks}`},
    };
  }

  // Create a random id for the check
  const checkId = helpers.createRandomStrig(20);

  // Create the check object and include user's phone
  const checkObject = {
    id: checkId,
    userPhone: phone,
    protocol,
    url,
    method,
    successCodes,
    timeoutSeconds,
  };

  try {
    await _data.create('checks', checkId, checkObject);
  } catch (error) {
    return {
      statusCode: 500,
      payload: { error: 'Could not create the new check' },
    };

  }

  // Add the check id to the user's object
  userChecks.push(checkId);
  userData.checks = userChecks;

  // Save the new user data
  try {
    await _data.update('users', phone, userData);
  } catch (error) {
    return {
      statusCode: 500,
      payload: { error: 'Could not update the user with the new check' }
    };
  }

  return {
    statusCode: 200,
    payload: checkObject,
  };
};

// Checks - get
_checks.get = async data => {

};

// Checks - put
_checks.put = async data => {

};

// Checks - delete
_checks.delete = async data => {

};

// Export module
module.exports = checks;