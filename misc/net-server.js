const net = require('net');

// Create the server
const server = net.createServer(connection => {
  const outboundMessage = 'pong';
  connection.write(outboundMessage);

  connection.on('data', inboundMessage => {
    const messageString = inboundMessage.toString();
    console.log('messageString :', messageString);
  })
})

server.listen(6000);
