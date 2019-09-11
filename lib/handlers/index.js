/**
 * Request handlers
 */

// Dependencies
const _data = require('../data');
const helpers = require('../helpers');
const validation = require('../validation');
const users = require('./users');
const tokens = require('./tokens');
const checks = require('./checks');
const index = require('./home');
const favicon = require('./favicon');
const public = require('./public');
const accountCreate = require('./accountCreate');
const sessionCreate = require('./sessionCreate');
const sessionDeleted = require('./sessionDeleted');

// Define the handlers
const handlers = {};

/**
 * HTML Handlers
 */

// Index handler
handlers.index = index;

// Create Account handler
handlers.accountCreate = accountCreate;

// Session Create handler
handlers.sessionCreate = sessionCreate;

// Session Deleted handler
handlers.sessionDeleted = sessionDeleted;

// Favicon handler
handlers.favicon = favicon;

// Public handler
handlers.public = public;

/**
 * JSON API handlers
 */

// Users handler
handlers.users = users;

// Tokens handler
handlers.tokens = tokens;

// Checks handler
handlers.checks = checks;

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