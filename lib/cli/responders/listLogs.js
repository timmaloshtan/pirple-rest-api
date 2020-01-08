/**
 * List logs responder
 */

const _logs = require('../../logs');
const formating = require('../formating');

const listLogs = async (userInput) => {
  try {
    const logs = await _logs.list(true);
    
    formating.printVerticalSpaces();
    logs.forEach(log => {
      if (log.includes('-')) {
        console.log(log);
      }
    });
    formating.printVerticalSpaces();
  } catch (error) {
    console.warn(error);
  }
};

module.exports = listLogs;