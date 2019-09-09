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

// Bind the forms
app.bindForms = () => {
  document.querySelector('form').addEventListener('submit', async function(e) {

    // Prevent default form behavior
    e.preventDefault();
    const formId = this.id;
    const path = this.action;
    const method = this.method.toUpperCase();

    // Hide the error message (if it's currently shown due to a previous error)
    const error = document.querySelector(`#${formId}.formError`);
    if (error) {
      error.style.display = 'hidden';
    }
  
    // Turn the inputs into a payload
    const payload = Array.from(this.elements)
      .filter(element => element.type !== 'submit')
      .reduce((pld, element) => ({
        ...pld,
        [element.name]: element.type === 'checkbox'
          ? element.checked
          : element.value,
      }), {});
  
  
    // Call the Api
    try {
      const { statusCode, payload: responsePayload } = await app.client.request({
        path,
        method,
        payload,
      });

      if (statusCode === 200) {
        return app.formResponseProcessor(formId, payload, responsePayload);
      }

      // Try to get the error from api
      const { error = 'An error has occured, please try again' } = responsePayload;

      // Set the formError field with the error text
      document.querySelector("#"+formId+" .formError").innerHTML = error;
      // Show (unhide) the form error field on the form
      document.querySelector("#"+formId+" .formError").style.display = 'block';
      
    } catch (error) {
      console.warn(error);
    }
  });
};

// Form response processor
app.formResponseProcessor = function(formId,requestPayload,responsePayload){
  var functionToCall = false;
  if(formId == 'accountCreate'){
    // @TODO Do something here now that the account has been created successfully
  }
};

// Init (bootstraping)
app.init = () => {
  app.bindForms();
};

// Call the init process after the window loads
window.onload = () => {
  app.init();
};
