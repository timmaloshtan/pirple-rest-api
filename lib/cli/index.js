/**
 * CLI-related tasks
 */

// Dependencies
const readline = require('readline');
const events = require('events');
const validation = require('../validation');
const responders = require('./responders');
const helpers = require('../helpers');

// Extend events library
function EventEmitter() {}
EventEmitter.__proto__ = events;
EventEmitter.prototype.__proto__ = events.prototype;

function Cli() {
  this.interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '>',
  });

  this.interface.on('line', this.processUserInput.bind(this));
  this.interface.on('close', () => {
    process.exit(0);
  })

  this.eventEmitter = new EventEmitter();
}

Cli.prototype.init = function() {
  // Send the start message to the console in dark blue
  console.log(
    '\x1b[34m%s\x1b[0m',
    `The CLI is up and running`,
  );

  this.setEventHandlers();

  this.interface.prompt();
};

Cli.prototype.setEventHandlers = function() {
  // Set event handlers
  this.setEventHandler('man', responders.help);
  this.setEventHandler('help', responders.help);
  this.setEventHandler('exit', responders.exit);
  this.setEventHandler('stats', responders.stats);
  this.setEventHandler('list users', responders.listUsers);
  this.setEventHandler('more user info', responders.moreUserInfo);
  this.setEventHandler('list checks', responders.listChecks);
  this.setEventHandler('more check info', responders.moreCheckInfo);
  this.setEventHandler('list logs', responders.listLogs);
  this.setEventHandler('more log info', responders.moreLogInfo);
};

Cli.prototype.setEventHandler = function(eventName, handler) {
  this.eventEmitter.on(
    eventName,
    this.wrapHandler(handler),
  );
};

Cli.prototype.wrapHandler = function(handler) {
  return async (...args) => {
    const asyncHandler = helpers.ensureAsync(handler);
    await asyncHandler.apply(this, args);
    console.log('******** after handler');
    this.interface.prompt();
  };
};

Cli.prototype.processUserInput = function(userInput) {
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

  const eventName = uniqueCommands.find(command => userInput.toLowerCase().includes(command));

  if (!eventName) {
    console.log('Sorry! Try again...');
    this.interface.prompt();
  }

  this.eventEmitter.emit(eventName, userInput);
};

// Export the module
module.exports = new Cli();