/**
 * Index handler
 */

// Dependencies
// const _data = require('../data');
const helpers = require('../helpers');
// const validation = require('../validation');
// const tokens = require('./tokens');

// Create top level handler
const index = async data => {
  const acceptableMethods = ['get'];
  if (acceptableMethods.includes(data.method)) {
    return await _index[data.method](data);
  } else {
    return { statusCode: 405, contentType: 'html' };
  }
};

// Create a container for method handlers
const _index = {};

// Index - get
_index.get = async data => {
  // Read in a template as a string
  try {
    const template = await helpers.getTemplate('index');

    return {
      statusCode: 200,
      payload: template,
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
module.exports = index;