const readline = require('readline');
const validation = require('../validation');
const helpers = require('../helpers');
const EventEmitter = require('./EventEmitter');

function Cli(respondersLookup) {
  this.respondersLookup = respondersLookup;
  this.eventEmitter = new EventEmitter();
}

Cli.prototype.init = function () {
  // Send the start message to the console in dark blue
  console.log(
    '\x1b[34m%s\x1b[0m',
    `The CLI is up and running`,
  );

  this.setEventHandlers();

  this.interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '>',
  });

  this.interface.on('line', this.processUserInput.bind(this));
  this.interface.on('close', () => {
    process.exit(0);
  });

  this.interface.prompt();
};

Cli.prototype.setEventHandlers = function() {
  // Set event handlers
  Object.keys(this.respondersLookup).forEach(eventName => {
    this.setEventHandler(eventName, this.respondersLookup[eventName]);
  })
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
    this.interface.prompt();
  };
};

Cli.prototype.processUserInput = function(userInput) {
  userInput = validation.checkNonEmptyString(userInput);

  if (!userInput) {
    return;
  }

  // Define unique strings that identify commands user can execute via CLI
  const uniqueCommands = Object.keys(this.respondersLookup);

  const eventName = uniqueCommands.find(command => userInput.toLowerCase().includes(command));

  if (!eventName) {
    console.log('Sorry! Try again...');
    this.interface.prompt();
  }

  this.eventEmitter.emit(eventName, userInput);
};

module.exports = Cli;