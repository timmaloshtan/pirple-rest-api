/**
 * Users handler
 */

// Dependencies
const _data = require('../data');
const helpers = require('../helpers');
const validation = require('../validation');
const tokens = require('./tokens');

// Create top level handler
const users = async data => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.includes(data.method)) {
    return await _users[data.method](data);
  } else {
    return { statusCode: 405 };
  }
};

// Create a container for method handlers
const _users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
_users.post = async data => {
  // Validate all required fields
  const firstName = validation.checkNonEmptyString(data.payload.firstName);
  const lastName = validation.checkNonEmptyString(data.payload.lastName);
  const phone = validation.checkPhone(data.payload.phone);
  const password = validation.checkNonEmptyString(data.payload.password);
  const tosAgreement = validation.checkBoolean(data.payload.tosAgreement);

  // Return 400 if missing any of the required fields
  if (!firstName || !lastName || !phone || !password || !tosAgreement) {
    return {
      statusCode: 400,
      payload: { error: 'Missing required fields' },
    }
  }

  // Check if user with this number already exists
  try {
    await _data.read(
      'users',
      phone,
    );
    
    return {
      statusCode: 400,
      payload: { error: 'User with this number already exists' },
    };
  } catch (error) {
    console.log(error);
  }

  // Hash the password
  const hashedPassword = helpers.hash(password);

  if (!hashedPassword) {
    return {
      statusCode: 500,
      payload: { error: 'Could not hash the password' },
    };
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

    return {
      statusCode: 200,
    };
  
  } catch (error) {
    return {
      statusCode: 500,
      payload: { error: 'Could not create a new user' },
    };
  }
};

// Users - get
// Required data: phone
// Optional data: none
_users.get = async data => {
  // Check that the provided phone number is valid
  const phone = validation.checkPhone(data.queryString.phone);

  if (!phone) {
    return {
      statusCode: 400,
      payload: { error: 'Missing required field' },
    };
  }
  // Check that the token is valid
  const token = validation.checkToken(data.headers.token);
  // Verify that the given token is valid for the phone number
  const tokenIsValid = await tokens.verifyToken(token, phone);

  if (!tokenIsValid) {
    return {
      statusCode: 403,
      payload: { error: 'Missing required token in header or token is invalid' },
    };
  }

  try {
    const userData = await _data.read(
      'users',
      phone,
    );

    // Remove the hashed password from the user object
    delete userData.hashedPassword;

    return {
      statusCode: 200,
      payload: userData,
    };
  } catch (error) {
    return {
      statusCode: 404,
      payload: { error: 'User does not exist' },
    };
  }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
_users.put = async data => {
  // Check that the provided fields are valid
  const phone = validation.checkPhone(data.payload.phone);
  const firstName = validation.checkNonEmptyString(data.payload.firstName);
  const lastName = validation.checkNonEmptyString(data.payload.lastName);
  const password = validation.checkNonEmptyString(data.payload.password);

  // Error if the phone is invalid in all cases
  if (!phone) {
    return {
      statusCode: 400,
      payload: { error: 'Missing a required phone field' },
    };
  }

  // Error if nothing's been sent for update
  if (!firstName && !lastName && !password) {
    return {
      statusCode: 400,
      payload: { error: 'Nothing to update' },
    };
  }

  // Check that the token is valid
  const token = validation.checkToken(data.headers.token);

  // Verify that the given token is valid for the phone number
  const tokenIsValid = await tokens.verifyToken(token, phone);

  if (!tokenIsValid) {
    return {
      statusCode: 403,
      payload: { error: 'Missing required token in header or token is invalid' },
    };
  }

  // Lookup the user
  let userData;

  try {
    userData = await _data.read('users', phone);
  } catch (error) {
    return {
      statusCode: 400,
      payload: { error: 'User does not exist' },
    };
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

    return {
      statusCode: 200,
    };
  } catch (error) {
    return {
      statusCode: 500,
      payload: { error: 'Could not update the user' },
    };
  }
};

// Users - delete
// Required data: phone
// Optional data: none
// @TODO Cleanup associated user data
_users.delete = async data => {
  // Check that the phone number is valid
  const phone = validation.checkPhone(data.queryString.phone);

  if (!phone) {
    return {
      statusCode: 400,
      payload: { error: 'Missing required phone field' },
    };
  }

  // Check that the token is valid
  const token = validation.checkToken(data.headers.token);

  // Verify that the given token is valid for the phone number
  const tokenIsValid = await tokens.verifyToken(token, phone);

  if (!tokenIsValid) {
    return {
      statusCode: 403,
      payload: { error: 'Missing required token in header or token is invalid' },
    };
  }

  try {
    await _data.read('users', phone);
  } catch (error) {
    return {
      statusCode: 404,
      payload: { error: 'User does not exist' },
    };
  }

  try {
    await _data.delete('users', phone);

    return {
      statusCode: 200,
    };
  } catch (error) {
    return {
      statusCode: 500,
      payload: { error: 'Could not delete the user' },
    };
  }
};


// Export the module
module.exports = users;