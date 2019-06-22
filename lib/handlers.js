/**
 * Request handlers
 */

// Dependencies
const _data = require('./dataWithCallbacks');
const _data_new = require('./data');
const helpers = require('./helpers');
const validation = require('./validation');

// Define the handlers
const handlers = {};

// Users handler
handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.includes(data.method)) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the users submethods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = async (data, callback) => {
  // Validate all required fields
  const firstName = validation.checkNonEmptyString(data.payload.firstName);
  const lastName = validation.checkNonEmptyString(data.payload.lastName);
  const phone = validation.checkPhone(data.payload.phone);
  const password = validation.checkNonEmptyString(data.payload.password);
  const tosAgreement = validation.checkBoolean(data.payload.tosAgreement);

  // Return 400 if missing any of the required fields
  if (!firstName || !lastName || !phone || !password || !tosAgreement) {
    return callback(400, { error: 'Missing required fields' });
  }

  // Check if user with this number already exists
  try {
    await _data_new.read(
      'users',
      phone,
    );

    return callback(400, { error: 'User with this number already exists' });
  } catch (error) {
    console.log(error);
  }

  // Hash the password
  const hashedPassword = helpers.hash(password);

  if (!hashedPassword) {
    return callback(500, { error: 'Could not hash the password' });
  }

  // Create the user object
  const userObject = {
    firstName,
    lastName,
    phone,
    hashedPassword,
    tosAgreement,
  };

  // Store the user
  try {
    await _data_new.create(
      'users',
      phone,
      userObject,
    );
  
    callback(200);
  } catch (error) {
    return callback(500, { error: 'Could not create a new user' });
  }
};

// Users - get
// Required data: phone
// Optional data: none
handlers._users.get = async (data, callback) => {
  // Check that the provided phone number is valid
  const phone = validation.checkPhone(data.queryString.phone);

  if (!phone) {
    return callback(400, { error: 'Missing required field' });
  }

  // Check that the token is valid
  const token = validation.checkToken(data.headers.token);

  // Verify that the given token is valid for the phone number
  const tokenIsValid = await handlers._tokens.verifyToken(token, phone);

  if (!tokenIsValid) {
    return callback(403, { error: 'Missing required token in header or token is invalid' });
  }

  try {
    const userData = await _data_new.read(
      'users',
      phone,
    );

    // Remove the hashed password from the user object
    delete userData.hashedPassword;
    callback(200, userData);
  } catch (error) {
    return callback(404, { error: 'User does not exist' });
  }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = async (data, callback) => {
  // Check that the provided fields are valid
  const phone = validation.checkPhone(data.payload.phone);
  const firstName = validation.checkNonEmptyString(data.payload.firstName);
  const lastName = validation.checkNonEmptyString(data.payload.lastName);
  const password = validation.checkNonEmptyString(data.payload.password);

  // Error if the phone is invalid in all cases
  if (!phone) {
    return callback(400, { error: 'Missing a required phone field' });
  }

  // Error if nothing's been sent for update
  if (!firstName && !lastName && !password) {
    return callback(400, { error: 'Nothing to update' });
  }

  // Check that the token is valid
  const token = validation.checkToken(data.headers.token);

  // Verify that the given token is valid for the phone number
  const tokenIsValid = await handlers._tokens.verifyToken(token, phone);

  if (!tokenIsValid) {
    return callback(403, { error: 'Missing required token in header or token is invalid' });
  }

  // Lookup the user
  let userData;

  try {
    userData = await _data_new.read('users', phone);
  } catch (error) {
    return callback(400, { error: 'User does not exist' });
  }

  // Update necessary fields
  if (firstName) {
    userData.firstName = firstName;
  }
  if (lastName) {
    userData.lastName = lastName;
  }
  if (password) {
    userData.hashedPassword = helpers.hash(password);
  }

  // Store the new updates
  try {
    await _data_new.update('users', phone, userData);

    return callback(200);
  } catch (error) {
    return callback(500, { error: 'Could not update the user' });
  }
};

// Users - delete
// Required data: phone
// Optional data: none
// @TODO Cleanup associated user data
handlers._users.delete = async (data, callback) => {
  // Check that the phone number is valid
  const phone = validation.checkPhone(data.queryString.phone);

  if (!phone) {
    return callback(400, { error: 'Missing required phone field' });
  }

  // Check that the token is valid
  const token = validation.checkToken(data.headers.token);

  // Verify that the given token is valid for the phone number
  const tokenIsValid = await handlers._tokens.verifyToken(token, phone);

  if (!tokenIsValid) {
    return callback(403, { error: 'Missing required token in header or token is invalid' });
  }

  try {
    await _data_new.read('users', phone);
  } catch (error) {
    return callback(404, { error: 'User does not exist' });
  }

  try {
    await _data_new.delete('users', phone);

    return callback(200);
  } catch (error) {
    return callback(500, { error: 'Could not delete the user' });
  }
};

// Tokens handler
handlers.tokens = function (data, callback) {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.includes(data.method)) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens methods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = async (data, callback) =>  {
  const phone = validation.checkPhone(data.payload.phone);
  const password = validation.checkNonEmptyString(data.payload.password);

  if (!phone || !password) {
    return callback(400, { error: 'Missing required field(s)' });
  }

  // Lookup user
  let userData;

  try {
    userData = await _data_new.read('users', phone);
  } catch (error) {
    return callback(400, { error: 'Could not find specified user' });
  }

  // Hash sent password and compare it to the stored password
  const hashedPassword = helpers.hash(password);

  if (hashedPassword !== userData.hashedPassword) {
    return callback(401, { error: 'Password does not match' });
  }

  //If valid, create a new token with a random name.
  // Set expiration date 1 hour in the future.
  const tokenId = helpers.createRandomStrig(20);

  const expires = Date.now() + 1000 * 3600;

  const tokenObject = {
    phone,
    id: tokenId,
    expires,
  };

  // Store the token
  try {
    await _data_new.create('tokens', tokenId, tokenObject);

    return callback(200, tokenObject);
  } catch (error) {
    return callback(500, { error: 'Could not create the new token' });
  }
};

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = async (data, callback) => {
  // Check that the provided id is valid
  var id = validation.checkToken(data.queryString.id);

  if (!id) {
    return callback(400, { error: 'Missing required id field' });
  }

  try {
    const tokenData = await _data_new.read('tokens', id);

    return callback(200, tokenData);
  } catch (error) {
    return callback(404, { error: 'Token does not exist' });
  }
};

// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = async (data, callback) => {
  // Check provided fields
  const id = validation.checkToken(data.payload.id);
  const extend = validation.checkBoolean(data.payload.extend);

  if (!id || !extend) {
    return callback(400, { error: 'Missing a required field(s) or field(s) are invalid' });
  }

  // Lookup the token
  let tokenData;

  try {
    tokenData = await _data_new.read('tokens', id);
  } catch (error) {
    return callback(400, { error: 'Specified token does not exist' });
  }

  // Check that token isn't already expired
  if (tokenData.expires < Date.now()) {
    return callback(400, { error: 'The token has already expired and can not be extended' });
  }

  // Set the expiration an hour from now
  tokenData.expires = Date.now() + 1000 * 3600;

  // Store the new updates
  try {
    await _data_new.update('tokens', id, tokenData);

    return callback(200);
  } catch (error) {
    return callback(500, { error: 'Could not update the tokens' });
  }
};

// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function (data, callback) {
  // Check that the id is valid
  var id = typeof data.queryString.id === 'string' && data.queryString.id.trim().length === 20
    ? data.queryString.id
    : false;

  if (id) {
    // Lookup the token
    _data.read(
      'tokens',
      id,
      function (err, tokenData) {
        if (!err && tokenData) {
          _data.delete(
            'tokens',
            id,
            function (err) {
              if (!err) {
                callback(200);
              } else {
                callback(500, { error: 'Could not delete the token' });
              }
            }
          )
        } else {
          callback(404, { error: 'Token does not exist' })
        }
      }
    );
  } else {
    callback(400, { error: 'Missing required field' });
  }
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = async (id, phone) => {
  // Lookup the token
  try {
    const tokenData = await _data_new.read(
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

// Ping handler
handlers.ping = function (data, callback) {
  callback(200);
};

// Not found handler
handlers.notFound = function (data, callback) {
  callback(404);
};

// Export the module
module.exports = handlers;