/**
 * List logs responder
 */

const _logs = require('../../logs');
const formating = require('../formating');
const childProcess = require('child_process');

const listLogs = async (userInput) => {
    const ls = childProcess.spawn('ls', ['./.logs/']);
    ls.stdout.on('data', data => {
      const dataString = data.toString();
      const logs = dataString.split('\n');

      formating.printVerticalSpaces();
      logs.forEach(log => {
        if (log.includes('-')) {
          console.log(log);
        }
      });
      formating.printVerticalSpaces();
    });
};

module.exports = listLogs;