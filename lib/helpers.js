/**
 * Helpers for various tasks
 */

// Dependencies
const crypto = require('crypto');
const querystring = require('querystring');
const https = require('https');
const config = require('./config');
const _data = require('./data');
const validation = require('./validation');
const path = require('path');
const fs = require('fs');
const util = require('util');

// Promisify required functions
const promisifiedReadFile = util.promisify(fs.readFile);

// Container for all the helpers
const helpers = {};

// SHA256 hash
helpers.hash = function(str) {
  if( typeof str === 'string' && str.length > 0) {
    const hash = crypto.createHmac('sha256', config.hashingSecret)
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
    const obj = JSON.parse(str);
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
    let possibleCharacters = '';
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
    let str = '';

    for (i = 0; i < len; i++) {
      // Get a random character from the possible characters
      const randomCharacter = possibleCharacters.charAt(
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

helpers.promisifiedHttpsRequest = (params, data) => new Promise((resolve, reject) => {
  const req = https.request(params, res => {
    // Reject on a bad status
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return reject(new Error(`statusCode=${res.statusCode}`));
    }

    // Accumulate data
    let body = [];

    res.on('data', chunk => body.push(chunk));

    res.on('end', () => {
      try {
        body = JSON.parse(Buffer.concat(body).toString());
      } catch (error) {
        reject(error);
      }
      resolve(body);
    });
  });

  // Reject the promise if request throws
  req.on('error', err => reject(err));

  // Write data if provided
  if (data) {
    req.write(data);
  }

  // IMPORTANT
  req.end();
});

// Send an SMS via Twilio
helpers.sendTwilioSms = async (phone, msg) => {
  // Validate the parameters
  const phoneNumber = validation.checkPhone(phone);
  const sms = validation.checkSms(msg);

  if (!phoneNumber || !sms) {
    return 'Required arguments are missing or invalid';
  }

  // Configure the request payload
  const payload = {
    'From': config.twilio.fromPhone,
    'To': `+38${phoneNumber}`,
    'Body': sms,
  };

  // Stringify the payload
  const stringPayload = querystring.stringify(payload);

  // Configure the request details
  const requestDetails = {
    protocol: 'https:',
    hostname: 'api.twilio.com',
    method: 'POST',
    path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
    auth: `${config.twilio.accountSid}:${config.twilio.authToken}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(stringPayload),
    }
  };

  // Send the request
  try {
    return helpers.promisifiedHttpsRequest(requestDetails, stringPayload);
  } catch (err) {
    const error = new Error('Twilio request failed');
    error.details = err;
    throw error;
  }
}

// Get the string content of a template
helpers.getTemplate = async (templateName, data) => {
  templateName = validation.checkNonEmptyString(templateName);
  data = validation.checkObject(data);

  if (!templateName) {
    throw new Error('Template name was not specified');
  }

  const templatesDir = path.join(__dirname, '/../templates/');

  try {
    const templateString = await promisifiedReadFile(
      `${templatesDir}${templateName}.html`,
      'utf8',
    );

    return helpers.interpolate(templateString, data);
  } catch (error) {
    throw error;
  }
};

// Add the universal header and footer to a string
// and pass the provided data object to header and footer
// for interpolation
helpers.addUniversalTemplates = async (str, data) => {
  str = validation.checkNonEmptyString(str);
  data = validation.checkObject(data);

  try {
    const headerString = await helpers.getTemplate('_header', data);
    const footerString = await helpers.getTemplate('_footer', data);

    return headerString + str + footerString;
  } catch (error) {
    throw error;
  }
}

// Take a given string and a data object and find/replace all the keys within in
helpers.interpolate = (str, data) => {
  str = validation.checkNonEmptyString(str);
  data = validation.checkObject(data);

  // Add the templateGlovals to the data object, prepending their key name with "global"
  Object.keys(config.templateGlobals).forEach(key => data[`global.${key}`] = config.templateGlobals[key])

  // For each key in the data object, insert its value into the string
  // at the corresponding placeholder
  const interpolatedStr = Object.keys(data).reduce(
    (accString, key) => accString.replace(`{${key}}`, data[key]),
    str,
  );

  return interpolatedStr;
}

// Export the module
module.exports = helpers;