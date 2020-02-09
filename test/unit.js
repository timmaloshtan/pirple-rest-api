/**
 * Unit tests
 */

const helpers = require('../lib/helpers');
const assert = require('assert');
const logs = require('../lib/logs');

const unit = {};

// Assert that getNumber is returning a number
unit['helpers.getNumber should return a number'] = function() {
  const value = helpers.getNumber();
  assert.equal(typeof value, 'number');
};

// Assert that getNumber is returning a number
unit['helpers.getNumber should return 1'] = function() {
  const value = helpers.getNumber();
  assert.equal(value, 1);
};

// Assert that getNumber is returning 2
unit['helpers.getNumber should return 2'] = function() {
  const value = helpers.getNumber();
  assert.equal(value, 2);
};

// logs.list should return an array and not throw
unit['logs.list should not throw'] = async function(done) {
  return assert.doesNotReject(async () => await logs.list(true))
    .then(done);
};

unit['logs.list should return an array'] = async function(done) {
  const result = await logs.list(true);
  assert.ok(result instanceof Array);
  done();
};

unit['logs.truncate should throw if there is no such log'] = async function(done) {
  await assert.rejects(() => logs.truncate('hello'))
    .then(done);
}

module.exports = unit;