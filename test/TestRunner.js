/**
 * Test Runner
 */

const helpers = require('../lib/helpers');

function TestRunner(testDictionary) {
  this.testDictionary = testDictionary;
}

TestRunner.prototype.runTests = async function() {
  const allTests = Object.keys(this.testDictionary).reduce((testTuples, subsetName) => ([
    ...testTuples,
    ...Object.keys(this.testDictionary[subsetName])
      .map(testName => [testName, this.testDictionary[subsetName][testName]]),
  ]), []);

  const testResults = await Promise.allSettled(
    allTests.map(([testName, testBody]) => this.runTest(testName, testBody)),
  );

  this.presentTestResults(testResults);
};

TestRunner.prototype.runTest = function(testName, testBody) {
  return testBody.length ? this.testAsyncCode(testName, testBody) : this.testSyncCode(testName, testBody);
};

TestRunner.prototype.testAsyncCode = function(testName, testBody) {
  const promisisfiedTest = new Promise((resolve, reject) => {
    helpers.ensureAsync(testBody)(resolve)
      .catch(err => {
        console.log('err :', err);
        reject(err);
      });
  });

  promisisfiedTest
    .then(() => console.log('\x1b[32m%s\x1b[0m', testName))
    .catch(() => console.log('\x1b[31m%s\x1b[0m', testName));

  return promisisfiedTest;
};

TestRunner.prototype.testSyncCode = function(testName, testBody) {
  try {
    testBody()
    console.log('\x1b[32m%s\x1b[0m', testName);
    return Promise.resolve();
  } catch (error) {
    console.log('error :', error);
    console.log('\x1b[31m%s\x1b[0m', testName);
    return Promise.reject(error);
  }
};

TestRunner.prototype.presentTestResults = function(testResults) {
  const { fulfilled, rejected } = testResults.reduce((acc, result) => ({
    ...acc,
    [result.status]: acc[result.status] + 1,
  }), { fulfilled: 0, rejected: 0 });

  console.log('\n');
  console.log('------------------TEST REPORT------------------');
  console.log('Total tests: ', testResults.length);
  console.log('Passed: ', fulfilled);
  console.log('Failed: ', rejected);
  console.log('-----------------------------------------------');
  console.log('\n');
  process.exit(0);
};

module.exports = TestRunner;