/**
 * Session Create handler
 */

// Dependencies
// const _data = require('../data');
const helpers = require('../helpers');
// const validation = require('../validation');
// const tokens = require('./tokens');

// Create top level handler
const sessionCreate = async data => {
  const acceptableMethods = ['get'];
  if (acceptableMethods.includes(data.method)) {
    return await _sessionCreate[data.method](data);
  } else {
    return { statusCode: 405, contentType: 'html' };
  }
};

// Create a container for method handlers
const _sessionCreate = {};

// Session Create - get
_sessionCreate.get = async data => {
  // Prepare data for interpolation
  const templateData = {
    'head.title': 'Login to your Account',
    'head.description': 'Please enter your phone number and password to access account.',
    'body.class': 'sessionCreate',
  };

  // Read template as a string
  try {
    const contentTemplate = await helpers.getTemplate('sessionCreate', templateData);
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
module.exports = sessionCreate;