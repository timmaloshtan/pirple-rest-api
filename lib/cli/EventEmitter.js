const events = require('events');

// Extend events library
function EventEmitter() {}
EventEmitter.__proto__ = events;
EventEmitter.prototype.__proto__ = events.prototype;

module.exports = EventEmitter;