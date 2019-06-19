/**
 * Helpers for various tasks
 */

// Dependencies
var crypto = require('crypto');
var config = require('./config');

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

// Export the module
module.exports = helpers;