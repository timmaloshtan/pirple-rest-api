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
const util = require('util');
const _data = require('./data');
const _logs = require('./logs');
const helpers = require('./helpers');
const validation = require('./validation');
const debug = util.debuglog('workers');

// Instantiate the worker object
const workers = {};

const logToFile = (
  checkData,
  checkOutcome,
  state,
  isAlertWarranted,
  lastChecked,
) => {
  // Form the log data
  const logData = {
    check: checkData,
    outcome: checkOutcome,
    state,
    alert: isAlertWarranted,
    time: lastChecked,
  };

  // Convert data to a string
  const logString = JSON.stringify(logData);

  // Determine the name of the log file
  const logFileName = checkData.id;

  // Append the log string to the file
  try {
    _logs.append(logFileName, logString);
    debug('Logging to file succeeded');
  } catch (error) {
    debug('Logging to file failed');
  }
}

// Alert the user as to a change in their check status
const alertUserToStatusChange = async checkData => {
  const message = `Alert: Your check for ${checkData.method.toUpperCase()} ${checkData.protocol}://${checkData.url} is currently ${checkData.state}`;

  try {
    await helpers.sendTwilioSms(checkData.userPhone, message);

    debug('Success. User was alerted to the status change in their check via SMS');
  } catch (error) {
    debug('Could not send an alert to user who had a status change in their check');
    
    debug(error);
  }
}

// Process the check outcome and update the check data
// And trigger an alert to the user if needed
// Don't alert on first time checks
const processCheckOutcome = async (checkData, checkOutcome) => {
  // Decide if the check if the check is considered up or down
  const state = !checkOutcome.error
    && checkOutcome.responseCode
    && checkData.successCodes.includes(checkOutcome.responseCode)
      ? 'up'
      : 'down';

  // Decide if an alert is warranted
  const isAlertWarranted = checkData.lastChecked && checkData.state !== state;
  const lastChecked = Date.now();

  // Update the check data
  const newCheckSata = {
    ...checkData,
    state,
    lastChecked,
  };

  // Log the outcome
  logToFile(
    checkData,
    checkOutcome,
    state,
    isAlertWarranted,
    lastChecked,
  );

  // Save the updates to disk
  try {
    await _data.update('checks', newCheckSata.id, newCheckSata);
  } catch (error) {
    return debug(error);
  }

  if (!isAlertWarranted) {
    return debug('Check outcome has not changed, no alert needed');
  }

  alertUserToStatusChange(newCheckSata);
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
    debug('Check data is invalid.');
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
    debug('The check is not properly formatted. Skipping.');
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
    debug(error);
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
      debug('Trouble reading one of the check\'s data: ', checkData);
      return null;
    }

    validateCheckData(checkData);
  })
}

// Timer to execute the worker process once per minute
const loop = () => {
  setInterval(gatherAllChecks, 1000 * 60);
}

// Rotate (compress) the log files
const rotateLogs = async () => {
  // List all non compressed log files
  let logNames;
  try {
    logNames = await _logs.list(false);
  } catch (error) {
    const err = new Error('Could not find any logs to rotate');
    err.details = error;
    return debug(error);
  }

  if (logNames.length === 0) {
    return debug('Could not find any logs to rotate');
  }


  // Compress the data to a different file
  logNames.forEach(async logName => {
    const logId = logName.replace('.log', '');
    const newFileId = `${logId}-${Date.now()}`;

    try {
      // Compress
      await _logs.compress(logId, newFileId);

      // Truncate
      await _logs.truncate(logId);

      debug('Successfully compressed and trunkcated the log');
    } catch (error) {
      const err = new Error('Error compressing or truncating the log');
      err.details = error;
      debug(err);
    }
  })
}

// Rotate logs once every 24 hours
const logRotationLoop = () => {
  setInterval(rotateLogs, 1000 * 3600 * 24);
}

// Init method
workers.init = () => {
  // Send to console in yellow
  console.log('\x1b[33m%s\x1b[0m', 'Background workers are running.');

  // Execure all the checks immediatelly
  gatherAllChecks();

  // Call the loop so the checks continue to execute
  loop();

  // Compress all the logs immediatelly
  rotateLogs();

  // Call the compression loop so logs will be compressed later on
  logRotationLoop();
}

// Export the module
module.exports = workers;