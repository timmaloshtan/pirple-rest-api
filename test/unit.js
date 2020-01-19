/**
 * Unit tests
 */

const helpers = require('../lib/helpers');
const assert = require('assert');

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

module.exports = unit;