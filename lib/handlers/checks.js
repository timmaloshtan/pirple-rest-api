/**
 * Checks handler
 */

// Dependencies
const validation = require('../validation');
const _data = require('../data');
const config = require('../config');
const helpers = require('../helpers');
const tokens = require('./tokens');

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
// Required data: id
// Optional data: none
_checks.get = async data => {
  const id = validation.checkId(data.queryString.id);

  if (!id) {
    return {
      statusCode: 400,
      payload: { error: 'Missing required id field' },
    };
  }

  // Lookup the check
  let checkData;
  try {
    checkData = await _data.read('checks', id);
  } catch (error) {
    return { statusCode: 404 };
  }

  // Get token from the header
  // Verify that it belongs to the user who created the check
  const token = validation.checkToken(data.headers.token);
  const tokenIsValid = await tokens.verifyToken(token, checkData.userPhone);

  if (!tokenIsValid) {
    return {
      statusCode: 403,
      payload: { error: 'Missing a required token header or token is invalid.'},
    };
  }

  return {
    statusCode: 200,
    payload: checkData,
  };
};

// Checks - put
// Required data: id
// Optional data: protocol, url, method, successCodes, timeoutSeconds (at least one)
_checks.put = async data => {
  // Verify required field
  const id = validation.checkId(data.payload.id);

  if (!id) {
    return {
      statusCode: 400,
      payload: { error: 'Missing required id field' },
    };
  }

  // Verify optional fields
  const protocol = validation.checkProtocol(data.payload.protocol);
  const url = validation.checkNonEmptyString(data.payload.url);
  const method = validation.checkMethod(data.payload.method);
  const successCodes = validation.checkSuccessCodes(data.payload.successCodes);
  const timeoutSeconds = validation.checkTimeoutSeconds(data.payload.timeoutSeconds);

  if (!protocol && !url && !method && !successCodes && !timeoutSeconds) {
    return {
      statusCode: 400,
      payload: { error: 'Nothing to update' },
    };
  }

  // Create updates object
  const updates = {
    protocol,
    url,
    method,
    successCodes,
    timeoutSeconds,
  };

  // Lookup the check
  let checkData;
  try {
    checkData = await _data.read('checks', id);
  } catch (error) {
    return {
      statusCode: 400,
      payload: { error: 'Check id does not exist' }
    };
  }

  // Get token from the header
  // Verify that it belongs to the user who created the check
  const token = validation.checkToken(data.headers.token);
  const tokenIsValid = await tokens.verifyToken(token, checkData.userPhone);

  if (!tokenIsValid) {
    return {
      statusCode: 403,
      payload: { error: 'Missing a required token header or token is invalid.'},
    };
  }

  // Update the check where necessary
  Object.keys(updates).forEach(key => {
    if (updates[key]) {
      checkData[key] = updates[key];
    }
  });

  // Store the update
  try {
    await _data.update('checks', id, checkData);

    return {
      statusCode: 200,
      payload: checkData,
    };
  } catch (error) {
    return {
      statusCode: 500,
      payload: { error: 'Could not update the check' },
    };
  }
};

// Checks - delete
// Required data: id
// Optional data: none
_checks.delete = async data => {
  // Verify required field
  const id = validation.checkId(data.queryString.id);

  if (!id) {
    return {
      statusCode: 400,
      payload: { error: 'Missing required id field' },
    };
  }

  // Lookup the check
  let checkData;
  try {
    checkData = await _data.read('checks', id);
  } catch (error) {
    return {
      statusCode: 400,
      payload: { error: 'Check id does not exist' }
    };
  }

  // Get token from the header
  // Verify that it belongs to the user who created the check
  const token = validation.checkToken(data.headers.token);
  const tokenIsValid = await tokens.verifyToken(token, checkData.userPhone);

  if (!tokenIsValid) {
    return {
      statusCode: 403,
      payload: { error: 'Missing a required token header or token is invalid.'},
    };
  }

  // Delete the check
  try {
    await _data.delete('checks', id);
  } catch (error) {
    return {
      statusCode: 500,
      payload: { error: 'Could not delete the check'},
    };
  }
  
  // Lookup the user
  let userData;
  try {
    userData = await _data.read('users', checkData.userPhone);
  } catch (error) {
    return {
      statusCode: 500,
      payload: { error: 'Could not find the user who created the check and unlink the check from user data' },
    };
  }

  // Get checks that user already has
  const userChecks = typeof userData.checks === 'object'
    && userData.checks instanceof Array
      ? userData.checks
      : [];

  // Remove deleted check from user's checks
  const checkPosition = userChecks.indexOf(id);

  if (checkPosition === -1) {
    return {
      statusCode: 500,
      payload: { error: 'Could not find the check on user data'},
    };
  }

  userData.checks = [
    ...userChecks.slice(0, checkPosition),
    ...userChecks.slice(checkPosition + 1),
  ];

  // Store updated user data
  try {
    await _data.update('users', userData.phone ,userData);

    return { statusCode: 200 };
  } catch (error) {
    return {
      statusCode: 500,
      payload: { error: 'Could not update user data'},
    };
  }
};

// Export module
module.exports = checks;