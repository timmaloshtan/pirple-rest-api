/**
 * Worker-related tasks
 * 
 */

// Dependencies
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');
const _data = require('./data');
const helpers = require('./helpers');
const validation = require('./validation');

// Instantiate the worker object
const workers = {};

// Process the check outcome and update the check data
// And trigger an alert to the user if needed
// Don't alert on first time checks
const processCheckOutcome = async () => {

};

// Perform the check, send the original check data and the outcome to the next step
const performCheck = async checkData => {
  // Prepare the initial check outcome
  const checkOutcome = {
    error: false,
    responseCode: false,
  };

  // Mark that the outsome has not been sent yet
  const outcomeSent = false;

  // Parse the host name and the path out of the original check data
  const parsedUrl = url.parse(`${checkData.protocol}://${checkData.url}`, true);

  const requestDetails = {
    protocol: `${checkData.protocol}:`,
    hostname: parsedUrl.hostname,
    method: checkData.method.toUpperCase(),
    path: parsedUrl.path,
    timeout: checkData.timeoutSeconds * 1000,
  };

  // Instantiate request object (http or https)
  const protocolDictionary = { http, https };

  try {
    // Promisify the request
    checkOutcome.responseCode = await new Promise((resolve, reject) => {
      const req = protocolDictionary[checkData.protocol].request(requestDetails, res => {
        // Resolve once we have the response status code
        resolve(res.statusCode);
      });

      // Reject the promise if request throws
      req.on('error', err => reject(err));

      // Reject the promise if request timesout
      req.on('timeout', () => reject('timeout'));

      // Send the request
      req.end();
    });
  } catch (error) {
    checkOutcome.error = {
      error: true,
      details: error,
    };
  }

  // Pass outcomes further
  processCheckOutcome(checkData, checkOutcome);
};

// Sanity checking the check data
const validateCheckData = (checkData = {}) => {
  if (typeof checkData !== 'object') {
    console.error('Check data is invalid.');
  }

  checkData.id = validation.checkId(checkData.id);
  checkData.userPhone = validation.checkPhone(checkData.userPhone);
  checkData.protocol = validation.checkProtocol(checkData.protocol);
  checkData.url = validation.checkNonEmptyString(checkData.url);
  checkData.method = validation.checkMethod(checkData.method);
  checkData.successCodes = validation.checkSuccessCodes(checkData.successCodes);
  checkData.timeoutSeconds = validation.checkTimeoutSeconds(checkData.timeoutSeconds);

  // Make sure that all the checks pass
  if (!Object.keys(checkData).every(property => property)) {
    console.error('The check is not properly formatted. Skipping.');
  }

  // Set the new keys if workers see this check for the first time
  checkData.state = validation.checkState(checkData.state);
  checkData.lastChecked = validation.checkLastChecked(checkData.lastChecked);

  performCheck(checkData);
};

// Lookup all the checks, get their data, send to validator
const gatherAllChecks = async () => {
  // Get all the checks
  let checkNames;
  try {
    checkNames = await _data.list('checks');
  } catch (error) {
    const err = new Error('Could not find any checks to process');
    err.details = error;
    console.error(error);
    return null;
  }

  // Read checks data in parallel
  const checksData = await Promise.all(
    checkNames.map(
      (checkName, i) => _data.read('checks', checkName)
        .catch(err => err),
    )
  );

  // Pass checks to validator
  checksData.forEach(checkData => {
    if (checkData instanceof Error) {
      console.error('Trouble reading one of the check\'s data: ', checkData);
      return null;
    }

    validateCheckData(checkData);
  })
}

// Timer to execute the worker process once per minute
const loop = () => {
  setInterval(gatherAllChecks, 1000 * 60)
}

// Init method
workers.init = () => {
  // Execure all the checks immediatelly
  gatherAllChecks();

  // Call the loop so the checks continue to execute
  // loop();
}

// Export the module
module.exports = workers;