/**
 * Server-related tasks
 * 
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const path = require('path');
const config = require('./config');
const handlers = require('./handlers');
const helpers = require('./helpers');
const util = require('util');
const debug = util.debuglog('server');

const _data = require('./data');

// Instantiate the server module object
const server = {};

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
    let chosenHandler = typeof router[trimmedPath] !== 'undefined'
    ? router[trimmedPath]
    : handlers.notFound;

    // If the request is within public directory
    // Use the public handler
    if (/^public\//i.test(trimmedPath)) {
      chosenHandler = router.public;
    }
    
    // Construct the data object to send to the handler
    const data = {
      trimmedPath,
      queryString,
      method,
      headers,
      payload: helpers.parseJsonToObject(buffer),
    };
    
    // Route the request to the handler specified in the router
    let {
      statusCode = 200,
      payload,
      contentType,
    } = await chosenHandler(data);
    
    // Determine the type of response (fallback to JSON)
    contentType = typeof(contentType) === 'string' ? contentType : 'json',
    
    res.setHeader('Content-Type', 'application/json');
    
    // Return the response parts that are content specific
    let payloadString = '';

    if (contentType === 'json') {
      res.setHeader('Content-Type', 'application/json');
      payload = typeof(payload) === 'object' ? payload : {};
      payloadString = JSON.stringify(payload);
    }

    if (contentType === 'html') {
      res.setHeader('Content-Type', 'text/html');
      payloadString = typeof(payload) === 'string' ? payload : '';
    }
    
    if (contentType === 'favicon') {
      res.setHeader('Content-Type', 'image/x-icon');
      payloadString = typeof(payload) !== 'undefined' ? payload : '';
    }
    
    if (contentType === 'css') {
      res.setHeader('Content-Type', 'text/css');
      payloadString = typeof(payload) !== 'undefined' ? payload : '';
    }
    
    if (contentType === 'png') {
      res.setHeader('Content-Type', 'image/png');
      payloadString = typeof(payload) !== 'undefined' ? payload : '';
    }
    
    if (contentType === 'jpg') {
      res.setHeader('Content-Type', 'image/jpeg');
      payloadString = typeof(payload) !== 'undefined' ? payload : '';
    }
    
    if (contentType === 'plain') {
      res.setHeader('Content-Type', 'text/plain');
      payloadString = typeof(payload) !== 'undefined' ? payload : '';
    }
    
    // Return the response parts that are common to all content-types
    res.writeHead(statusCode);
    res.end(payloadString);
    
    debug('Returning this response', statusCode, payloadString);
  });
};

// Define a request router
const router = {
  '': handlers.index,
  'account/create': handlers.accountCreate,
  'account/edit': handlers.accountEdit,
  'account/deleted': handlers.accountDeleted,
  'session/create': handlers.sessionCreate,
  'session/deleted': handlers.sessionDeleted,
  'checks/all': handlers.checkList,
  'checks/create': handlers.checksCreate,
  'checks/edit': handlers.checksEdit,
  'ping': handlers.ping,
  'api/users': handlers.users,
  'api/tokens': handlers.tokens,
  'api/checks': handlers.checks,
  'favicon.ico': handlers.favicon,
  'public': handlers.public,
};

// Instantiate HTTP server
const httpServer = http.createServer(unifiedServer);



// Instantiate HTTPS server
const httpsServerOptions = {
  'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem')),
};
const httpsServer = https.createServer(
  httpsServerOptions,
  unifiedServer,
);

// Init script
server.init = () => {
  // Start HTTP server
  httpServer.listen(
    config.httpPort,
    () => console.log(
      '\x1b[36m%s\x1b[0m',
      `The HTTP server is listening on port ${config.httpPort} in ${config.envName} mode`,
    ),
  );

  // Start HTTPS server
  httpsServer.listen(
    config.httpsPort, 
    () => console.log(
      '\x1b[35m%s\x1b[0m',
      `The HTTPS server is listening on port ${config.httpsPort} in ${config.envName} mode`,
    ),
  );
}

// Export module
module.exports = server;