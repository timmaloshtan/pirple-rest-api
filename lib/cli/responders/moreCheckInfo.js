/**
 * More check info responder
 */

const validation = require('../../validation');
const _data = require('../../data');
const formating = require('../formating');

const moreCheckInfo = async (userInput) => {
  // Get the ID from the user input
  const inputs = userInput.split('--');
  const checkId = validation.checkId(inputs[1]);

  if (!checkId) {
    return console.log('This command requires a valid check ID')
  }

  try {
    const checkData = await _data.read('checks', checkId);

    // Print the JSON with highlights
    formating.printVerticalSpaces();
    console.dir(checkData, { colors: true });
    formating.printVerticalSpaces();
  } catch (error) {
    console.warn(error);
  }
};

module.exports = moreCheckInfo;