/**
 * Test runner
 */

// Dependencies
const unit = require('./unit');
const TestRunner = require('./TestRunner');

const testRunner = new TestRunner({
  unit,
});

// Run the tests
testRunner.runTests();