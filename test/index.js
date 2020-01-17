/**
 * Test runner
 */

// Dependencies
const helpers = require('../lib/helpers');
const assert = require('assert');

// Application logic for the test runner
const app = {};

// Container for the tests
app.tests = {
  unit: {}
};

// Assert that getNumber is returning a number
app.tests.unit['helpers.getNumber should return a number'] = function(done) {
  const value = helpers.getNumber();
  assert.equal(typeof value, 'number');
  done();
};

// Assert that getNumber is returning a number
app.tests.unit['helpers.getNumber should return 1'] = function(done) {
  const value = helpers.getNumber();
  assert.equal(value, 1);
  done();
};

// Assert that getNumber is returning 2
app.tests.unit['helpers.getNumber should return 2'] = function(done) {
  const value = helpers.getNumber();
  assert.equal(value, 2);
  done();
};

app.runTests = function() {
  const errors = [];
  let successes = 0;
  const limit = app.countTests();
  let counter = 0;

  Object.keys(app.tests).forEach(key => {
    const subtests = app.tests[key];

    Object.keys(subtests).forEach(subtest => {
      (function() {
        const testValue = subtests[subtest];

        try {
          testValue(() => {
            console.log('\x1b[32m%s\x1b[0m', subtest);
            counter++;
            successes++;

            if (counter === limit) {
              app.produceTestReport(limit, successes, errors);
            }
          });
        } catch (error) {
          errors.push({
            name: subtest,
            error,
          });
          console.log('\x1b[31m%s\x1b[0m', subtest);
          counter++;

          console.log('limit :', limit);
          if (counter === limit) {
            app.produceTestReport(limit, successes, errors);
          }
        }
      })();
    });
  });
};

app.countTests = function() {
  let counter = 0;

  Object.keys(app.tests).forEach(key => {
    counter += Object.keys(app.tests[key]).length;
  })

  return counter;
};

app.produceTestReport = function(limit, successes, errors) {
  console.log('\n');
  console.log('------------------TEST REPORT------------------');
  console.log('Total tests: ', limit);
  console.log('Passed: ', successes);
  console.log('Failed: ', errors.length);
}

// Run the tests
app.runTests();