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

// Export the module
module.exports = helpers;