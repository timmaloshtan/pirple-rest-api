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
  const form = document.querySelector('form');

  if (!form) {
    return;
  }
  
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
app.formResponseProcessor = async function(formId,requestPayload,responsePayload){
  var functionToCall = false;
  if (formId == 'accountCreate') {
    const { phone, password } = requestPayload;
    const path = 'api/tokens';
    const method = 'POST';

    try {
      const { statusCode, payload: loginResponse } = await app.client.request({
        path,
        method,
        payload: {
          phone,
          password,
        },
      });

      if (statusCode === 200) {
        // Is successfull, set the token and redirect the user
        app.setSessionToken(loginResponse);
        window.location = '/checks/all';
      }

      // Set the formError field with the error text
      document.querySelector("#"+formId+" .formError").innerHTML = error;
      // Show (unhide) the form error field on the form
      document.querySelector("#"+formId+" .formError").style.display = 'block';
    } catch (error) {
      console.warn(error);
    }
  }

  if (formId === 'sessionCreate') {
    app.setSessionToken(responsePayload);
    window.location = '/checks/all';
  }
};

// Get the session token from local storage
// and set it in the app.config object
app.getSessionToken = () => {
  const tokenString = localStorage.getItem('token');
  if (typeof(tokenString) !== 'string') {
    return;
  }

  try {
    const token = JSON.parse(tokenString);
    app.config.sessionToken = token;

    if (typeof(token) === 'object') {
      return app.setLoggedInClass(true);
    }
  
    app.setLoggedInClass(false);
  } catch (error) {
    app.config.sessionToken = false;
    app.setLoggedInClass(false);
  }
};

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = add => {
  var target = document.querySelector("body");

  if (add) {
    return target.classList.add('loggedIn');
  }
  
  target.classList.remove('loggedIn');
};

// Set the session token in the app.congig object
// and to local storage
app.setSessionToken = token => {
  app.config.sessionToken = token;
  const tokenString = JSON.stringify(token);
  localStorage.setItem('token', tokenString);

  if (typeof(token) === 'object') {
    return app.setLoggedInClass(true);
  }

  app.setLoggedInClass(false);
}

// Renew the token
app.renewToken = async () => {
  const { sessionToken } = app.config;

  if (!sessionToken) {
    app.setSessionToken(false);
    return true;
  }

  const payload = {
    id: sessionToken.id,
    extend: true,
  };
  const path = 'api/tokens';
  let method = 'PUT';

  // Update the token with a new expiration
  try {
    const { statusCode } = await app.client.request({
      path,
      method,
      payload,
    });

    if (statusCode !== 200) {
      app.setSessionToken(false);
      return true;
    }
  } catch (error) {
    console.warn(error);
  }

  const queryStringObject = { id: sessionToken.id };
  method = 'GET';

  // Get the new token details
  try {
    const { statusCode, payload } = await app.client.request({
      path,
      method,
      queryStringObject,
    });

    if (statusCode !== 200) {
      app.setSessionToken(false);
      return true;
    }

    app.setSessionToken(payload);
    return false;
  } catch (error) {
    console.warn(error);
  }
};

// Loop to renew token
app.tokenRenewalLoop = () => {
  setInterval(
    async () => {
      const err = await app.renewToken();

      if (!err) {
        console.log("Token renewed successfully @ "+Date.now());
      }
    },
    1000 * 60,
  );
};

// Init (bootstraping)
app.init = () => {

  // Bind all form submissions
  app.bindForms();

  // Get the token from local storage
  app.getSessionToken();

  // Renew token
  app.tokenRenewalLoop();
};

// Call the init process after the window loads
window.onload = () => {
  app.init();
};
