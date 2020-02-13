/**
 * Tokens handler
 */

// Dependencies
const _data = require('../data');
const helpers = require('../helpers');
const validation = require('../validation');
const { performance, PerformanceObserver } = require('perf_hooks');
const util = require('util');
const debug = util.debuglog('performance');

// Create top level handler
const tokens = async data => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.includes(data.method)) {
    return await _tokens[data.method](data);
  } else {
    return { statusCode: 405 };
  }
};

tokens.verifyToken = async (id, phone) => {
  // Lookup the token
  try {
    const tokenData = await _data.read(
      'tokens',
      id,
    );
    // Check for phone match and expiration
    if (tokenData.phone === phone && tokenData.expires > Date.now()) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

// Container for all the tokens methods
_tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
_tokens.post = async data =>  {
  const performanceObserver = new PerformanceObserver(items => {
    const entries = items.getEntries();
    entries.forEach(entry => {
      debug(
        '\x1b[33m%s\x1b[0m',
        `${entry.name} ${entry.duration}`,
      );
    });
  });

  performanceObserver.observe({ entryTypes: ['measure'] });

  performance.mark('entered tokens.post handler');
  const phone = validation.checkPhone(data.payload.phone);
  const password = validation.checkNonEmptyString(data.payload.password);
  performance.mark('inputs have validated');
  if (!phone || !password) {
    return {
      statusCode: 400,
      payload: { error: 'Missing required field(s)' },
    };
  }

  // Lookup user
  let userData;
  performance.mark('beginning to read user data');
  try {
    userData = await _data.read('users', phone);
  } catch (error) {
    return {
      statusCode: 400,
      payload: { error: 'Could not find specified user' },
    };
  }
  performance.mark('user lookup completed');

  // Hash sent password and compare it to the stored password
  performance.mark('begin password hashing');
  const hashedPassword = helpers.hash(password);
  performance.mark('password hashing complete');

  if (hashedPassword !== userData.hashedPassword) {
    return {
      statusCode: 401,
      payload: { error: 'Password does not match' },
    };
  }

  //If valid, create a new token with a random name.
  // Set expiration date 1 hour in the future.
  performance.mark('creating data for the token');
  const tokenId = helpers.createRandomStrig(20);
  performance.mark('data for the token is created');

  const expires = Date.now() + 1000 * 3600;

  const tokenObject = {
    phone,
    id: tokenId,
    expires,
  };

  // Store the token
  performance.mark('beginning to store the token');
  try {
    await _data.create('tokens', tokenId, tokenObject);
    performance.mark('token storing complete');

    // Geather all measurements
    performance.measure('Beginning to end', 'entered tokens.post handler', 'token storing complete');
    performance.measure('Validating inputs', 'entered tokens.post handler', 'inputs have validated');
    performance.measure('User lookup', 'beginning to read user data', 'user lookup completed');
    performance.measure('Password hashing', 'begin password hashing', 'password hashing complete');
    performance.measure('Token data creation', 'creating data for the token', 'data for the token is created');
    performance.measure('Token storing', 'beginning to store the token', 'token storing complete');
    performance.clearMarks();

    return {
      statusCode: 200,
      payload: tokenObject,
    };
  } catch (error) {
    performance.mark('token storing failed');
    console.log('error :', error);
    return {
      statusCode: 500,
      payload: { error: 'Could not create the new token' },
    };
  }
};

// Tokens - get
// Required data: id
// Optional data: none
_tokens.get = async data => {
  // Check that the provided id is valid
  const id = validation.checkToken(data.queryString.id);

  if (!id) {
    return {
      statusCode: 400,
      payload: { error: 'Missing required id field' },
    };
  }

  try {
    const tokenData = await _data.read('tokens', id);

    return {
      statusCode: 200,
      payload: tokenData,
    };
  } catch (error) {
    return {
      statusCode: 404,
      payload: { error: 'Token does not exist' },
    };
  }
};

// Tokens - put
// Required data: id, extend
// Optional data: none
_tokens.put = async data => {
  // Check provided fields
  const id = validation.checkToken(data.payload.id);
  const extend = validation.checkBoolean(data.payload.extend);

  if (!id || !extend) {
    return {
      statusCode: 400,
      payload: { error: 'Missing a required field(s) or field(s) are invalid' },
    };
  }

  // Lookup the token
  let tokenData;

  try {
    tokenData = await _data.read('tokens', id);
  } catch (error) {
    return {
      statusCode: 400,
      payload: { error: 'Specified token does not exist' },
    };
  }

  // Check that token isn't already expired
  if (tokenData.expires < Date.now()) {
    return {
      statusCode: 400,
      payload: { error: 'The token has already expired and can not be extended' },
    };
  }

  // Set the expiration an hour from now
  tokenData.expires = Date.now() + 1000 * 3600;

  // Store the new updates
  try {
    await _data.update('tokens', id, tokenData);

    return {
      statusCode: 200,
    };
  } catch (error) {
    return {
      statusCode: 500,
      payload: { error: 'Could not update the tokens' },
    };
  }
};

// Tokens - delete
// Required data: id
// Optional data: none
_tokens.delete = async data => {
  // Check that the id is valid
  const id = validation.checkToken(data.queryString.id);

  if (!id) {
    return {
      statusCode: 400,
      payload: { error: 'Missing required field' },
    };
  }

  // Lookup token
  try {
    await _data.read('tokens', id);
  } catch (error) {
    return {
      statusCode: 404,
      payload: { error: 'Token does not exist' },
    };
  }

  // Delete token
  try {
    await _data.delete('tokens', id);

    return {
      statusCode: 200,
    };
  } catch (error) {
    return {
      statusCode: 500,
      payload: { error: 'Could not delete the token' },
    };
  }
};

// Export module
module.exports = tokens;