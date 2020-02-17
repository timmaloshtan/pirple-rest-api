const http2 = require('http2');

const client = http2.connect('http://localhost:6000');

const request = client.request({
  ':path': '/',
});

let dataString = '';

request.on('data', chunk => {
  dataString += chunk;
});

request.on('end', () => console.log(dataString));

request.end();