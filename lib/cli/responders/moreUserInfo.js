/**
 * More user info responder
 */

const validation = require('../../validation');
const _data = require('../../data');
const formating = require('../formating');

const moreUserInfo = async (userInput) => {
  // Get the ID from the user input
  const inputs = userInput.split('--');
  const userId = validation.checkPhone(inputs[1]);

  if (!userId) {
    return console.log('This command requires a valid user ID')
  }

  try {
    const userData = await _data.read('users', userId);

    delete userData.hashedPassword;

    // Print the JSON with highlights
    formating.printVerticalSpaces();
    console.dir(userData, { colors: true });
    formating.printVerticalSpaces();
  } catch (error) {
    console.warn(error);
  }
};

module.exports = moreUserInfo;