/**
 * Users handler
 */

// Dependencies
const _data = require('../data');
const helpers = require('../helpers');
const validation = require('../validation');
const tokens = require('./tokens');

// Create top level handler
const users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.includes(data.method)) {
    _users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Create a container for method handlers
const _users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
_users.post = async (data, callback) => {
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
    await _data.read(
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
    await _data.create(
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
_users.get = async (data, callback) => {
  // Check that the provided phone number is valid
  const phone = validation.checkPhone(data.queryString.phone);

  if (!phone) {
    return callback(400, { error: 'Missing required field' });
  }
  // Check that the token is valid
  const token = validation.checkToken(data.headers.token);
  // Verify that the given token is valid for the phone number
  const tokenIsValid = await tokens.verifyToken(token, phone);

  if (!tokenIsValid) {
    return callback(403, { error: 'Missing required token in header or token is invalid' });
  }

  try {
    const userData = await _data.read(
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
_users.put = async (data, callback) => {
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
  const tokenIsValid = await tokens.verifyToken(token, phone);

  if (!tokenIsValid) {
    return callback(403, { error: 'Missing required token in header or token is invalid' });
  }

  // Lookup the user
  let userData;

  try {
    userData = await _data.read('users', phone);
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
    await _data.update('users', phone, userData);

    return callback(200);
  } catch (error) {
    return callback(500, { error: 'Could not update the user' });
  }
};

// Users - delete
// Required data: phone
// Optional data: none
// @TODO Cleanup associated user data
_users.delete = async (data, callback) => {
  // Check that the phone number is valid
  const phone = validation.checkPhone(data.queryString.phone);

  if (!phone) {
    return callback(400, { error: 'Missing required phone field' });
  }

  // Check that the token is valid
  const token = validation.checkToken(data.headers.token);

  // Verify that the given token is valid for the phone number
  const tokenIsValid = await tokens.verifyToken(token, phone);

  if (!tokenIsValid) {
    return callback(403, { error: 'Missing required token in header or token is invalid' });
  }

  try {
    await _data.read('users', phone);
  } catch (error) {
    return callback(404, { error: 'User does not exist' });
  }

  try {
    await _data.delete('users', phone);

    return callback(200);
  } catch (error) {
    return callback(500, { error: 'Could not delete the user' });
  }
};


// Export the module
module.exports = users;