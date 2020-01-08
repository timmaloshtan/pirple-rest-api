const help = require('./help');
const stats = require('./stats');
const listUsers = require('./listUsers');
const moreUserInfo = require('./moreUserInfo');
const listChecks = require('./listChecks');
const moreCheckInfo = require('./moreCheckInfo');
const listLogs = require('./listLogs');
const moreLogInfo = require('./moreLogInfo');
const exit = require('./exit');

const responders = {
  help,
  stats,
  listUsers,
  moreUserInfo,
  listChecks,
  moreCheckInfo,
  listLogs,
  moreLogInfo,
  exit,
};

module.exports = responders;