/**
 * Front-end logic for the application
 */

// Container for the frontend application
const app = {};

// Config
app.config = {
  sessionToken: false,
};

// AJAX client for the restful API
app.client = {};

// Interface for making API calls
app.client.request = async ({
  headers = {},
  path = '/',
  method = 'GET',
  queryStringObject = {},
  payload = {},
}) => {

  const queryString = Object.entries(queryStringObject)
    .map(entry => entry.join('='))
    .join('&');

  const requestUrl = `${path}${queryString ? '?' : ''}${queryString}`;

  return new Promise ((resolve, reject) => {
    // Form the http request as a JSON type
    const xhr = new XMLHttpRequest();
  
    xhr.open(method, requestUrl, true);
    xhr.setRequestHeader("Content-Type", 'application/json');

    // Add the rest of the headers
    Object.keys(headers).forEach(key => {
      xhr.setRequestHeader(key, headers[key]);
    });

    // If there is a current session token
    // add that as a header as well
    if (app.config.sessionToken) {
      xhr.setRequestHeader('token', app.config.sessionToken);
    }

    // Handle the reponse
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        const { status: statusCode, responseText } = xhr;

        try {
           resolve({
            statusCode,
            payload: JSON.parse(responseText),
          });
        } catch (error) {
          reject(error);
        }
      }
    };

    // Send off the request as JSON
    const payloadString = JSON.stringify(payload);
    xhr.send(payloadString);
  });
};