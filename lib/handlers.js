/**
 * Request handlers
 */

// Dependencies
var _data = require('./dataWithCallbacks');
var _data_new = require('./data');
var helpers = require('./helpers');
var validation = require('./validation');

// Define the handlers
var handlers = {};

// Users handler
handlers.users = function (data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
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
  var firstName = validation.checkNonEmptyString(data.payload.firstName);
  var lastName = validation.checkNonEmptyString(data.payload.lastName);
  var phone = validation.checkPhone(data.payload.phone);
  var password = validation.checkNonEmptyString(data.payload.password);
  var tosAgreement = validation.checkTosAgreement(data.payload.tosAgreement);

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
  var hashedPassword = helpers.hash(password);

  if (!hashedPassword) {
    callback(500, { error: 'Could not hash the password' });
  }

  // Create the user object
  var userObject = {
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
  } catch (error) {
    callback(500, { error: 'Could not create a new user' });
  }

  callback(200);
};

// Users - get
// Required data: phone
// Optional data: none
handlers._users.get = function (data, callback) {
  // Check that the provided phone number is valid
  var phone = typeof data.queryString.phone === 'string' && data.queryString.phone.trim().length === 10
    ? data.queryString.phone
    : false;

  if (phone) {

    // Get the token from the headers
    var token = typeof data.headers.token === 'string' && data.headers.token.trim().length === 20
      ? data.headers.token
      : false;

    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        _data.read(
          'users',
          phone,
          function (err, data) {
            if (!err && data) {
              // Remove the hashed password from the user object
              delete data.hashedPassword;
              callback(200, data);
            } else {
              callback(404, { error: 'User does not exist' })
            }
          }
        );
      } else {
        callback(403, { error: 'Missing required token in header or token is invalid' });
      }
    });
  } else {
    callback(400, { error: 'Missing required field' });
  }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = function (data, callback) {
  // Check that the provided phone number is valid
  var phone = typeof data.payload.phone === 'string' && data.payload.phone.trim().length === 10
    ? data.payload.phone
    : false;

  // Check for the optional fields
  var firstName = typeof data.payload.firstName == 'string' && data.payload.firstName.trim().length > 0
    ? data.payload.firstName.trim()
    : false;

  var lastName = typeof data.payload.lastName == 'string' && data.payload.lastName.trim().length > 0
    ? data.payload.lastName.trim()
    : false;

  var password = typeof data.payload.password == 'string' && data.payload.password.trim().length > 0
    ? data.payload.password.trim()
    : false;

  // Error if the phone is invalid in all cases
  if (phone) {
    // Error if nothing is send for update
    if (firstName || lastName || password) {
      // Get the token from the headers
      var token = typeof data.headers.token === 'string' && data.headers.token.trim().length === 20
        ? data.headers.token
        : false;

      // Verify that the given token is valid for the phone number
      handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
        if (tokenIsValid) {
          // Lookup the user
          _data.read(
            'users',
            phone,
            function (err, userData) {
              if (!err && userData) {
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
                _data.update(
                  'users',
                  phone,
                  userData,
                  function (err) {
                    if (!err) {
                      callback(200);
                    } else {
                      console.log(err);
                      callback(500, { error: 'Could not update the user' });
                    }
                  }
                )
              } else {
                callback(400, { error: 'User does not exist' });
              }
            }
          )
        } else {
          callback(403, { error: 'Missing required token in header or token is invalid' });
        }
      });
    } else {
      callback(400, { error: 'Nothing to update' });
    }
  } else {
    callback(400, { error: 'Missing a required field' });
  }
};

// Users - delete
// Required data: phone
// Optional data: none
// @TODO Cleanup associated user data
handlers._users.delete = function (data, callback) {
  // Check that the phone number is valid
  var phone = typeof data.queryString.phone === 'string' && data.queryString.phone.trim().length === 10
    ? data.queryString.phone
    : false;

  if (phone) {
    // Get the token from the headers
    var token = typeof data.headers.token === 'string' && data.headers.token.trim().length === 20
      ? data.headers.token
      : false;

    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        _data.read(
          'users',
          phone,
          function (err, data) {
            if (!err && data) {
              _data.delete(
                'users',
                phone,
                function (err) {
                  if (!err) {
                    callback(200);
                  } else {
                    callback(500, { error: 'Could not delete the user' });
                  }
                }
              )
            } else {
              callback(404, { error: 'User does not exist' })
            }
          }
        );
      } else {
        callback(403, { error: 'Missing required token in header or token is invalid' });
      }
    });
  } else {
    callback(400, { error: 'Missing required field' });
  }
};

// Tokens handler
handlers.tokens = function (data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
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
handlers._tokens.post = function (data, callback) {
  var phone = typeof data.payload.phone == 'string' && data.payload.phone.trim().length === 10
    ? data.payload.phone.trim()
    : false;

  var password = typeof data.payload.password == 'string' && data.payload.password.trim().length > 0
    ? data.payload.password.trim()
    : false;

  if (phone && password) {
    // Lookup the matching user
    _data.read(
      'users',
      phone,
      function (err, userData) {
        if (!err && userData) {
          // Hash sent password, and compare it to the stored password
          var hashedPassword = helpers.hash(password);
          if (hashedPassword === userData.hashedPassword) {
            // If valid, create a new token with a random name.
            // Set expiration date 1 hour in the future.
            var tokenId = helpers.createRandomStrig(20);

            var expires = Date.now() + 1000 * 3600;

            var tokenObject = {
              phone,
              id: tokenId,
              expires,
            };

            // Store the token
            _data.create(
              'tokens',
              tokenId,
              tokenObject,
              function (err) {
                if (!err) {
                  callback(200, tokenObject);
                } else {
                  callback(500, { error: 'Could not create the new token' });
                }
              }
            )
          } else {
            callback(401, { error: 'Password does not match' });
          }
        } else {
          callback(400, { error: 'Could not find specified user' });
        }
      }
    )
  } else {
    callback(400, { error: 'Missing required field(s)' });
  }
};

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = function (data, callback) {
  // Check that the provided id is valid
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
          callback(200, tokenData);
        } else {
          callback(404, { error: 'User does not exist' })
        }
      }
    );
  } else {
    callback(400, { error: 'Missing required field' });
  }
};

// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function (data, callback) {
  // Check provided id
  var id = typeof data.payload.id == 'string' && data.payload.id.trim().length === 20
    ? data.payload.id.trim()
    : false;

  var extend = typeof data.payload.extend == 'boolean' || data.payload.extend;

  if (id && extend) {
    // Lookup the token
    _data.read(
      'tokens',
      id,
      function (err, tokenData) {
        if (!err && tokenData) {
          // Check that token isn't already expired
          if (tokenData.expires > Date.now()) {
            // Set the expiration an hour from now
            tokenData.expires = Date.now() + 1000 * 3600;

            // Store the new updates
            _data.update(
              'tokens',
              id,
              tokenData,
              function (err) {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { error: 'Could not update the tokens' });
                }
              }
            )
          } else {
            callback(400, { error: 'The token has already expired and can not be extended' });
          }
        } else {
          callback(400, { error: 'Specified token does not exist' });
        }
      }
    )
  } else {
    callback(400, { error: 'Missing a required field or fields are invalid' });
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
handlers._tokens.verifyToken = function (id, phone, callback) {
  // Lookup the token
  _data.read(
    'tokens',
    id,
    function (err, tokenData) {
      if (!err && tokenData) {
        // Check that the token is for the given user and has not expired
        if (tokenData.phone === phone && tokenData.expires > Date.now()) {
          callback(true);
        } else {
          callback(false);
        }
      } else {
        callback(false);
      }
    }
  )
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