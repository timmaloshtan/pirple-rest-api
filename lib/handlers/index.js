/**
 * Request handlers
 */

// Dependencies
const _data = require('../data');
const helpers = require('../helpers');
const validation = require('../validation');
const users = require('./users');
const tokens = require('./tokens');

// Define the handlers
const handlers = {};

// Users handler
handlers.users = users;

// Tokens handler
handlers.tokens = tokens;

// Ping handler
handlers.ping = data => ({
  statusCode: 200,
});

// Not found handler
handlers.notFound = data => ({
  statusCode: 404,
});

// Export the module
module.exports = handlers;