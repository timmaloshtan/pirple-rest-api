/*
 * Primary file for the API
 * 
 */

// Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');
const cluster = require('cluster');
const os = require('os');

// Declare the app
const app = {};

// Init function
app.init = () => {
  if (cluster.isMaster) {
    // Start the workers
    // workers.init();
  
    // Start the CLI, but make sure it starts last
    setTimeout(() => {
      cli.init();
    }, 500);

    // Fork the process
    const cpus = os.cpus();

    for (let i = 0; i < cpus.length - 1; i++) {
      cluster.fork();
    }
  } else {
    // Start the server
    server.init();
  }
};

// Execute only if required directly
if (require.main === module) {
  app.init();
}

// Export the app
module.exports = app;