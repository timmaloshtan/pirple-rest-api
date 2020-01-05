/**
 * CLI-related tasks
 */

// Dependencies
const readline = require('readline');
const util = require('util');
const events = require('events');
const validation = require('../validation');
const formating = require('./formating');

const debug = util.debuglog('cli');

class Events extends events {}

const e = new Events();

// Create a CLI module object
const cli = {};

// Responders object
cli.responders = {};

// Help / Man responder
cli.responders.help = () => {
  const commands = {
    'exit': 'Kill the CLI (and the rest of the app)',
    'man': 'Show this help page',
    'help': 'Alias of the "man" command',
    'stats': 'Get statistics on the underlying operating system and resource utilization',
    'list users': 'Show a list of all the registered users in the system',
    'more user info --{userId}': 'Show details of a specific user',
    'list checks --up --down': 'Show a list of all the active checks in the system, including their state',
    'more check info --{checkId}': 'Show details of a specified check',
    'list logs': 'Show a list of all the logfiles available to be read',
    'more log info --{fileName}': 'Show details of a specified log file',
  };

  // Show the header for the help page that is as wide as the screen
  formating.drawHorizontalLine();
  formating.printCenteredString('CLI MANUAL');
  formating.drawHorizontalLine();
  formating.printVerticalSpaces(2);

  // Show each command, followed by its explanation
  Object.keys(commands).forEach(command => {
    const description = commands[command];
    const key = `\x1b[33m${command}\x1b[0m`;

    const line = formating.padWithTrailingSpaces(40 - key.length, key) + description;

    console.log(line);
    formating.printVerticalSpaces();
  });

  // End manual
  formating.drawHorizontalLine();
};

// Exit responder
cli.responders.exit = () => {
  process.exit(0);
};

// Stats responder
cli.responders.stats = () => {
  console.log('You asked for stats');
};

// List users responder
cli.responders.listUsers = () => {
  console.log('You asked to list users');
};

// More user info responder
cli.responders.moreUserInfo = (userInput) => {
  console.log('You asked for more user info', userInput);
};

// List checks responder
cli.responders.listChecks = (userInput) => {
  console.log('You asked to list checks', userInput);
};

// More check info responder
cli.responders.moreCheckInfo = (userInput) => {
  console.log('You asked for more check info', userInput);
};

// List logs responder
cli.responders.listLogs = (userInput) => {
  console.log('You asked to list logs', userInput);
};

// More log info responder
cli.responders.moreLogInfo = (userInput) => {
  console.log('You asked for more log info', userInput);
};

// Input handlers
e.on('man', cli.responders.help);

e.on('help', cli.responders.help);

e.on('exit', cli.responders.exit);

e.on('stats', cli.responders.stats);

e.on('list users', cli.responders.listUsers);

e.on('more user info', cli.responders.moreUserInfo);

e.on('list checks', cli.responders.listChecks);

e.on('more check info', cli.responders.moreCheckInfo);

e.on('list logs', cli.responders.listLogs);

e.on('more log info', cli.responders.moreLogInfo);

// Input processor
cli.processInput = userInput => {
  userInput = validation.checkNonEmptyString(userInput);

  if (!userInput) {
    return;
  }

  // Define unique strings that identify commands user can execute via CLI
  const uniqueCommands = [
    'man',
    'help',
    'exit',
    'stats',
    'list users',
    'more user info',
    'list checks',
    'more check info',
    'list logs',
    'more log info',
  ];

  // Go through the possible inputs, emit an event when a match is found
  let isMatching = false;
  let couner = 0;

  uniqueCommands.some(command => {
    if(userInput.toLowerCase().indexOf(command) > -1) {
      isMatching = true;
      // Emit an event matching the unique input, and include the full string given by a user
      e.emit(command, userInput);
      return true;
    }
  });

  // If no match is found, tell the user to try again
  if (!isMatching) {
    console.log('Sorry! Try again...');
  }
};

// Init script
cli.init = function() {
  // Send the start message to the console in dark blue
  console.log(
    '\x1b[34m%s\x1b[0m',
    `The CLI is up and running`,
  );

  // Start the interface
  const interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '>>>',
  });

  // Create an initial prompt
  interface.prompt();

  // Handle each line of input separately
  interface.on('line', (userInput) => {
    // Send to the input processor
    cli.processInput(userInput);

    // Re-initialize the prompt afterwards
    interface.prompt();
  });

  // If the user stops the CLI, kill associated process
  interface.on('close', () => {
    process.exit(0);
  });
}

// Export the module
module.exports = cli;