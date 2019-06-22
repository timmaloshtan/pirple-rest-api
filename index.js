/*
 * Primary file for the API
 * 
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const config = require('./lib/config');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

// All the server logic for both http and https
const unifiedServer = async (req, res) => {
  
  // Get the url and parse it
  const pasrsedUrl = url.parse(req.url, true);
  
  // Get the path from url
  const path = pasrsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '')
  
  // Get the query string as an object
  const queryString = Object.assign({}, pasrsedUrl.query);
  
  // Get the HTTP Method
  const method = req.method.toLowerCase();
  
  // Get headers as an object
  const headers = req.headers;
  
  // Get payloads, if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', data => buffer += decoder.write(data));
  req.on('end', async () => {
    buffer += decoder.end();
    
    // Choose the handler this request should go to
    // If one is not found, use not found handler
    const chosenHandler = typeof router[trimmedPath] !== 'undefined'
    ? router[trimmedPath]
    : handlers.notFound;
    
    // Construct the data object to send to the handler
    const data = {
      trimmedPath,
      queryString,
      method,
      headers,
      payload: helpers.parseJsonToObject(buffer),
    };
    
    // Route the request to the handler specified in the router
    const { statusCode = 200, payload = {} } = await chosenHandler(data);
    
    const payloadString = JSON.stringify(payload);
    
    // Return the response
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(statusCode);
    res.end(payloadString);
    
    console.log('Returning this response', statusCode, payloadString);
  });
};

// Define a request router
const router = {
  'ping': handlers.ping,
  'users': handlers.users,
  'tokens': handlers.tokens,
};

// Instantiate HTTP server
const httpServer = http.createServer(unifiedServer);

// Start HTTP server
httpServer.listen(
  config.httpPort,
  () => console.log(
    `The HTTP server is listening on port ${config.httpPort} in ${config.envName} mode`,
  ),
);

// Instantiate HTTPS server
const httpsServerOptions = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/cert.pem'),
};
const httpsServer = https.createServer(
  httpsServerOptions,
  unifiedServer,
);

// Start HTTPS server
httpsServer.listen(
  config.httpsPort, 
  () => console.log(
    `The HTTPS server is listening on port ${config.httpsPort} in ${config.envName} mode`,
  ),
);