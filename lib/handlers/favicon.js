/**
 * Favicon handler
 */

// Dependencies
// const _data = require('../data');
const helpers = require('../helpers');
// const validation = require('../validation');
// const tokens = require('./tokens');

// Create top level handler
const favicon = async data => {
  const acceptableMethods = ['get'];
  if (acceptableMethods.includes(data.method)) {
    return await _favicon[data.method](data);
  } else {
    return { statusCode: 405 };
  }
};

// Create a container for method handlers
const _favicon = {};

// Favicon - get
_favicon.get = async data => {
  // Read in the favicon's data
  try {
    const data = await helpers.getStaticAsset('favicon.ico');

    return {
      statusCode: 200,
      payload: data,
      contentType: 'favicon',
    };
  } catch (error) {
    return {
      statusCode: 500,
    };
  }
};

// Export module
module.exports = favicon;