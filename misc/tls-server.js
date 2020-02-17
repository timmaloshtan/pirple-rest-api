const tls = require('tls');
const fs = require('fs');
const path = require('path');

// Server options
const options = {
  'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem')),
};

// Create the server
const server = tls.createServer(options, connection => {
  const outboundMessage = 'pong';
  connection.write(outboundMessage);

  connection.on('data', inboundMessage => {
    const messageString = inboundMessage.toString();
    console.log('messageString :', messageString);
  })
})

server.listen(6000);
