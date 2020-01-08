/**
 * List users responder
 */

const _data = require('../../data');
const formating = require('../formating');
const listUsers = async () => {
  try {
    const usersIds = await _data.list('users');

    formating.printVerticalSpaces();

    const usersData = await Promise.all(
      usersIds.map(id => _data.read('users', id))
    );

    usersData.forEach(user => {
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