/**
 * List checks responder
 */

const validation = require('../../validation');
const _data = require('../../data');
const formating = require('../formating');

const listChecks = async (userInput) => {
  const inputs = userInput.split('--');
  const stateFlag = validation.checkNonEmptyString(inputs[1]);
  
  if (stateFlag && stateFlag !== 'up' && stateFlag !== 'down') {
    return console.log('Unknown flag. Please use --up or --down with this command');
  }
  try {
    const checkIds = await _data.list('checks');

    formating.printVerticalSpaces();
    
    const checks = await Promise.all(
      checkIds.map(checkId => _data.read('checks', checkId))
    )

    checks.filter(check => (
      stateFlag === 'up' && check.state === 'up'
        || stateFlag === 'down' && check.state !== 'up'
        || !stateFlag
    )).forEach(check => console.log({
      ...check,
      state: check.state || 'unknown',
    }));
  } catch (error) {
    console.warn(error);
  }
};

module.exports = listChecks;