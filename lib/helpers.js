/**
 * Helpers for various tasks
 */

// Dependencies
var crypto = require('crypto');
var config = require('./config');
var _data = require('./data');

// Container for all the helpers
var helpers = {};

// SHA256 hash
helpers.hash = function(str) {
  if( typeof str === 'string' && str.length > 0) {
    var hash = crypto.createHmac('sha256', config.hashingSecret)
      .update(str)
      .digest('hex');

    return hash;
  } else {
    return false;
  }
};

// Parse JSON string into an object without throwing
helpers.parseJsonToObject = function(str) {
  try {
    var obj = JSON.parse(str);
    return obj;
  } catch (error) {
    return {};
  }
};

// Create a string of random alphanumeric characters of a given length
helpers.createRandomStrig = function(len) {
  len = typeof len === 'number' && len > 0
    ? len
    : false;

  if (len) {
    // Define all possible characters
    var possibleCharacters = '';
    for (i = 48; i <= 57; i++) {
      possibleCharacters = possibleCharacters.concat(String.fromCharCode(i));
    }
    for (i = 65; i <= 90; i++) {
      possibleCharacters = possibleCharacters.concat(String.fromCharCode(i));
    }
    for (i = 97; i <= 122; i++) {
      possibleCharacters = possibleCharacters.concat(String.fromCharCode(i));
    }

    // Start the final string
    var str = '';

    for (i = 0; i < len; i++) {
      // Get a random character from the possible characters
      var randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      )
      // Append this character to the final string
      str += randomCharacter;
    }

    // Return a final string
    return str;
  } else {
    return false;
  }
};

// Export the module
module.exports = helpers;