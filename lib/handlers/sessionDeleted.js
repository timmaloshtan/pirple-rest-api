/**
 * Session Deleted handler
 */

// Dependencies
// const _data = require('../data');
const helpers = require('../helpers');
// const validation = require('../validation');
// const tokens = require('./tokens');

// Create top level handler
const sessionDeleted = async data => {
  const acceptableMethods = ['get'];
  if (acceptableMethods.includes(data.method)) {
    return await _sessionDeleted[data.method](data);
  } else {
    return { statusCode: 405, contentType: 'html' };
  }
};

// Create a container for method handlers
const _sessionDeleted = {};

// Session Deleted - get
_sessionDeleted.get = async data => {
  // Prepare data for interpolation
  const templateData = {
    'head.title': 'Logged out',
    'head.description': 'You have been logged out of your account',
    'body.class': 'sessionDeleted',
  };

  // Read template as a string
  try {
    const contentTemplate = await helpers.getTemplate('sessionDeleted', templateData);
    const finalTemplate = await helpers.addUniversalTemplates(contentTemplate, templateData);
    
    return {
      statusCode: 200,
      payload: finalTemplate,
      contentType: 'html',
    };
  } catch (error) {
    return {
      statusCode: 500,
      contentType: 'html',
    };
  }
};

// Export module
module.exports = sessionDeleted;