/*
 * Primary file for the API
 * 
 */

// Dependencies
var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;

// Server should repond to all requests with a string
var server = http.createServer(function(req, res) {

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
      payload: buffer,
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
});

// Start the server and have it listen on the port 3000
server.listen(3000, function() {
  console.log('The server is listening on port 3000');
});

// Define the handlers
var handlers = {};

// Sample handler
handlers.sample = function(data, callback) {
  // Callback a http status code, and a payload object

  callback(406, { 'name': 'sample handler' });
}

// Not found handler
handlers.notFound = function(data, callback) {
  callback(404);
}

// Define a request router
var router = {
  'sample': handlers.sample,
};
