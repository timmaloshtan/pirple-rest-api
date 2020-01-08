/**
 * More log info responder
 */

const _logs = require('../../logs');
const formating = require('../formating');
const validation = require('../../validation');
const helpers = require('../../helpers');

const moreLogInfo = async (userInput) => {
  // Get the ID from the user input
  const inputs = userInput.split('--');
  const logFileName = validation.checkNonEmptyString(inputs[1]);

  if (!logFileName) {
    return console.log('This command requires a valid log name')
  }

  try {
    const log = await _logs.decompress(logFileName);

    // Print the JSON with highlights
    formating.printVerticalSpaces();
    
    const lines = log.split('\n');
    lines.forEach(jsonLine => {
      const logObject = helpers.parseJsonToObject(jsonLine);

      if (JSON.stringify(logObject) === '{}') {
        return;
      }
      console.dir(logObject, { colors: true });
    })
  } catch (error) {
    console.warn(error);
  }
};

module.exports = moreLogInfo;