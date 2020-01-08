/**
 * List users responder
 */

const _data = require('../../data');
const formating = require('../formating');
const listUsers = async () => {
  try {
    const usersIds = await _data.list('users');

    formating.printVerticalSpaces();

    usersIds.forEach(async userId => {
      const user = await _data.read('users', userId);

      const nameOutput = `Name: ${user.firstName} ${user.lastName}`;
      const phoneOutput = `Phone: ${user.phone}`;
      const checksOutput = `Checks: ${Array.isArray(user.checks) ? user.checks.length : 0}`;

      console.log(`${nameOutput} ${phoneOutput} ${checksOutput}`);
    });
  } catch (error) {
    console.warn(error);
  }
};

module.exports = listUsers;