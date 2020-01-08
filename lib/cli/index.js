/**
 * CLI-related tasks
 */

// Dependencies
const readline = require('readline');
const util = require('util');
const events = require('events');
const os = require('os');
const v8 = require('v8');
const validation = require('../validation');
const formating = require('./formating');
const _data = require('../data');
const _logs = require('../logs');
const helpers = require('../helpers');

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
  // Create a stats object
  const stats = {
    'Load average': os.loadavg().join(' '),
    'CPU count': os.cpus().length,
    'Free memory': os.freemem(),
    'Current Mallocked memory': v8.getHeapStatistics().malloced_memory,
    'Peak Mallocked memory': v8.getHeapStatistics().peak_malloced_memory,
    'Allockated heap used (%)': Math.round(v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size * 100),
    'Available heap allockated (%)': Math.round(v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit * 100),
    'Uptime': os.uptime() + ' sec',
  };

  formating.drawHorizontalLine();
  formating.printCenteredString('SYSTEM STATISTICS');
  formating.drawHorizontalLine();
  formating.printVerticalSpaces(2);

  Object.keys(stats).forEach(stat => {
    const description = stats[stat];
    const key = `\x1b[33m${stat}\x1b[0m`;

    const line = formating.padWithTrailingSpaces(60 - key.length, key) + description;

    console.log(line);
    formating.printVerticalSpaces();
  });

  formating.drawHorizontalLine();
};

// List users responder
cli.responders.listUsers = async () => {
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

// More user info responder
cli.responders.moreUserInfo = async (userInput) => {
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

// List checks responder
cli.responders.listChecks = async (userInput) => {
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

// More check info responder
cli.responders.moreCheckInfo = async (userInput) => {
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

// List logs responder
cli.responders.listLogs = async (userInput) => {
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

// More log info responder
cli.responders.moreLogInfo = async (userInput) => {
  // Get the ID from the user input
  const inputs = userInput.split('--');
  const logFileName = validation.checkNonEmptyString(inputs[1]);

  if (!logFileName) {
    return console.log('This command requires a valid log name')
  }

  try {
    const log = await _logs.decompress(logFileName);

    // Print the JSON with highlights
    formating.printVerticalSpaces();
    
    const lines = log.split('\n');
    lines.forEach(jsonLine => {
      const logObject = helpers.parseJsonToObject(jsonLine);

      if (JSON.stringify(logObject) === '{}') {
        return;
      }
      console.dir(logObject, { colors: true });
    })
  } catch (error) {
    console.warn(error);
  }
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