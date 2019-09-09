/**
 * Account Create handler
 */

// Dependencies
// const _data = require('../data');
const helpers = require('../helpers');
// const validation = require('../validation');
// const tokens = require('./tokens');

// Create top level handler
const accountCreate = async data => {
  const acceptableMethods = ['get'];
  if (acceptableMethods.includes(data.method)) {
    return await _accountCreate[data.method](data);
  } else {
    return { statusCode: 405, contentType: 'html' };
  }
};

// Create a container for method handlers
const _accountCreate = {};

// Account Create - get
_accountCreate.get = async data => {
  // Prepare data for interpolation
  const templateData = {
    'head.title': 'Create an Account',
    'head.description': 'Sign up is easy and only takes a few seconds.',
    'body.class': 'accountCreate',
  };

  // Read template as a string
  try {
    const contentTemplate = await helpers.getTemplate('accountCreate', templateData);
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
module.exports = accountCreate;