/**
 * API tests
 */

// Dependencies
const app = require('../index');
const assert = require('assert');
const http = require('http');
const config = require('../lib/config');
const helpers = require('../lib/helpers');

const api = {};

const makeGetRequest = async path => {
  const requestDetails = {
    protocol: 'http:',
    hostname: 'localhost',
    port: config.httpPort,
    method: 'GET',
    path,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  return await helpers.promisifiedHttpRequest(requestDetails);
};

api['app.init should start without throwing'] = function () {
  assert.doesNotThrow(() => {
    app.init();
  }, TypeError);
};

api['/ping should respond to GET with 200'] = async function(done){
  const result = await makeGetRequest('/ping');
  assert.equal(result.statusCode, 200);
  done();
};

api['/api/users should respond to GET with 400'] = async function(done){
  const result = await makeGetRequest('/api/users');
  assert.equal(result.statusCode, 400);
  done();
};

api['A random path should respond to GET with 404'] = async function(done){
  const result = await makeGetRequest('/doesnt/exist');
  assert.equal(result.statusCode, 404);
  done();
};

module.exports = api;
