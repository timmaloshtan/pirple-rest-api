/**
 * Help responder
 */

const formating = require('../formating');

const help = () => {
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

module.exports = help;