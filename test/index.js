/**
 * Test runner
 */

// Override the NODE_ENV variable
process.env.NODE_ENV = 'testing';

// Dependencies
const unit = require('./unit');
const api = require('./api');
const TestRunner = require('./TestRunner');

const testRunner = new TestRunner({
  unit,
  api,
});

// Run the tests
testRunner.runTests();