/**
 * Request handlers
 */

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');

// Define the handlers
var handlers = {};

// Users handler
handlers.users = function(data, callback) {
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
handlers._users.post = function(data, callback) {
  // Check that all required fields are filled out
  console.log('data.payload :', data.payload);
  var firstName = typeof data.payload.firstName == 'string' && data.payload.firstName.trim().length > 0
    ? data.payload.firstName.trim()
    : false;

  var lastName = typeof data.payload.lastName == 'string' && data.payload.lastName.trim().length > 0
    ? data.payload.lastName.trim()
    : false;
  
  var phone = typeof data.payload.phone == 'string' && data.payload.phone.trim().length === 10
    ? data.payload.phone.trim()
    : false;

  var password = typeof data.payload.password == 'string' && data.payload.password.trim().length > 0
    ? data.payload.password.trim()
    : false;

  var tosAgreement = typeof data.payload.tosAgreement == 'boolean' || data.payload.tosAgreement;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure that the user doesn't already exist
    _data.read(
      'users',
      phone,
      function(err, data) {
        if (err) {
          // Hash the password
          var hashedPassword = helpers.hash(password);

          if (hashedPassword) {
            // Create the user object
            var userObject = {
              firstName,
              lastName,
              phone,
              hashedPassword,
              tosAgreement,
            };
  
            // Store the user
            _data.create(
              'users',
              phone,
              userObject,
              function(err) {
                if (!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, { error: 'Could not create a new user' });
                }
              }
            )
          } else {
            callback(500, { error: 'Could not hash the password' });
          }



        } else {
          // User with that phone number already esists
          callback(400, { error: 'User with this number already exists' });
        }
      }
    )
  } else {
    callback(400, { error: 'Missing required fields' });
  }
};

// Users - get
// Required data: phone
// Optional data: none
// @TODO Only let an authenticated user to access their object, not anyone else's
handlers._users.get = function(data, callback) {
  // Chech that the provided phone number is valid
  var phone = typeof data.queryString.phone === 'string' && data.queryString.phone.trim().length === 10
    ? data.queryString.phone
    : false;

  if (phone) {
    // Lookup the user
    _data.read(
      'users',
      phone,
      function(err, data) {
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
    callback(400, { error: 'Missing required field' });
  }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
// @TODO Only let authenticated users update their own object, not anyone else's
handlers._users.put = function(data, callback) {
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
      // Lookup the user
      _data.read(
        'users',
        phone,
        function(err, userData) {
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
              function(err) {
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
      callback(400, { error: 'Nothing to update' });
    }
  } else {
    callback(400, { error: 'Missing a required field' });
  }
};

// Users - delete
// Required data: phone
// Optional data: none
// @TODO Only let authenticated users delete their own object
// @TODO Cleanup associated user data
handlers._users.delete = function(data, callback) {
  // Check that the phone number is valid
  var phone = typeof data.queryString.phone === 'string' && data.queryString.phone.trim().length === 10
    ? data.queryString.phone
    : false;

  if (phone) {
    // Lookup the user
    _data.read(
      'users',
      phone,
      function(err, data) {
        if (!err && data) {
          _data.delete(
            'users',
            phone,
            function(err) {
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
    callback(400, { error: 'Missing required field' });
  }
};

// Ping handler
handlers.ping = function(data, callback) {
  callback(200);
};

// Not found handler
handlers.notFound = function(data, callback) {
  callback(404);
};

// Export the module
module.exports = handlers;