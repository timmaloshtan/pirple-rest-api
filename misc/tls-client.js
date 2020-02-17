const tls = require('tls');
const fs = require('fs');
const path = require('path');

const outboundMessage = 'ping';

const options = {
  'ca': fs.readFileSync(path.join(__dirname, '/../https/cert.pem')),
};

const client = tls.connect(6000, options, () => {
  client.write(outboundMessage);
});

client.on('data', inboundMessage => {
  const messageString = inboundMessage.toString();
  console.log('messageString :', messageString);
  client.end();
})