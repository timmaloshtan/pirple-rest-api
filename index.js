/*
 * Primary file for the API
 * 
 */

// Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var fs = require('fs');
var config = require('./lib/config');
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');

// Instantiate HTTP server
var httpServer = http.createServer(unifiedServer);

// Start HTTP server
httpServer.listen(config.httpPort, function() {
  console.log(
    `The HTTP server is listening on port ${config.httpPort} in ${config.envName} mode`,
  );
});

// Instantiate HTTPS server
var httpsServerOptions = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/cert.pem'),
};
var httpsServer = https.createServer(
  httpsServerOptions,
  unifiedServer,
);

// Start HTTPS server
httpsServer.listen(config.httpsPort, function() {
  console.log(
    `The HTTPS server is listening on port ${config.httpsPort} in ${config.envName} mode`,
  );
});

// All the server logic for both http and https
function unifiedServer(req, res) {

  // Get the url and parse it
  var pasrsedUrl = url.parse(req.url, true);

  // Get the path from url
  var path = pasrsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, '')

  // Get the query string as an object
  var queryString = Object.assign({}, pasrsedUrl.query);

  // Get the HTTP Method
  var method = req.method.toLowerCase();

  // Get headers as an object
  var headers = req.headers;

  // Get payloads, if any
  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function(data) {
    buffer += decoder.write(data);
  });
  req.on('end', function() {
    buffer += decoder.end();

    // Choose the handler this request should go to
    // If one is not found, use not found handler
    var chosenHandler = typeof router[trimmedPath] !== 'undefined'
      ? router[trimmedPath]
      : handlers.notFound;

    // Construct the data object to send to the handler
    var data = {
      trimmedPath,
      queryString,
      method,
      headers,
      payload: helpers.parseJsonToObject(buffer),
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, function(statusCode = 200, payload = {}) {
      // Convert payload to a string
      var payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      console.log('Returning this response', statusCode, payloadString);
    });
  });
};

// Define a request router
var router = {
  'ping': handlers.ping,
  'users': handlers.users,
  'tokens': handlers.tokens,
};
