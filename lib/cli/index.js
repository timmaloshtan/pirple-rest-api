/**
 * CLI-related tasks
 */

// Dependencies
const {
  help,
  exit,
  stats,
  listUsers,
  moreUserInfo,
  listChecks,
  moreCheckInfo,
  listLogs,
  moreLogInfo,
} = require('./responders');
const Cli = require('./Cli');

const respondersLookup = {
  man: help,
  help: help,
  exit,
  stats,
  'list users': listUsers,
  'more user info': moreUserInfo,
  'list checks': listChecks,
  'more check info': moreCheckInfo,
  'list logs': listLogs,
  'more log info': moreLogInfo,
};



// Export the module
module.exports = new Cli(respondersLookup);