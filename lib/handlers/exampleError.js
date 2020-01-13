/**
 * Example error handler
 */

// Dependencies
const _data = require('../data');
const validation = require('../validation');
const tokens = require('./tokens');

// Create top level handler
const exampleError = async data => {
  const error = new Error('This is an example error');

  throw(error);

  return { statusCode: 200 };
};

// Export module
module.exports = exampleError;