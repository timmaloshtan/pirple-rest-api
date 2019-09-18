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

  return new Promise((resolve, reject) => {
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
      xhr.setRequestHeader('token', app.config.sessionToken.id);
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

// Bind the logout button
app.bindLogoutButton = () => {
  document.getElementById('logoutButton').addEventListener('click', e => {
    e.preventDefault();

    app.logUserOut();
  });
};

// Log the user out then redirect to /sessionDeleted
app.logUserOut = async () => {
  // Get current token id
  const { id } = app.config.sessionToken;

  var queryStringObject = { id };

  await app.client.request({
    path: 'api/tokens',
    method: 'DELETE',
    queryStringObject,
  });

  // Clear the token from front
  app.setSessionToken(false);

  // Send the user to the logged out page
  window.location = '/session/deleted';
}

// Bind the forms
app.bindForms = () => {
  const form = document.querySelector('form');

  if (!form) {
    return;
  }

  const allForms = document.querySelectorAll('form');
  Array.from(allForms).forEach(form => {
    form.addEventListener('submit', async function (e) {

      // Prevent default form behavior
      e.preventDefault();
      const formId = this.id;
      const path = this.action;
      let method = this.method.toUpperCase();
      let queryStringObject;

      // Hide the error message (if it's currently shown due to a previous error)
      const error = document.querySelector(`#${formId}.formError`);
      if (error) {
        error.style.display = 'hidden';
      }

      // Hide the success message
      const success = document.querySelector(`#${formId}.formSuccess`);
      if (success) {
        success.style.display = 'hidden';
      }

      // Turn the inputs into a payload
      let payload = {};
      Array.from(this.elements).forEach(
        element => {
          const value = element.classList.contains('intval')
            ? parseInt(element.value)
            : element.value;
          
          if (element.type === 'submit') {
            return;
          }

          if (element.type === 'checkbox' && !element.classList.contains('multiselect')) {
            return payload[element.name] = element.checked;
          }

          if (element.name === '_method') {
            return method = value;
          }

          if (element.name === 'httpmethod') {
            return payload.method = value;
          }

          // Create an payload field named "id" if the elements name is actually uid
          if (element.name === 'uid') {
            return payload.id = value;
          }

          if (element.classList.contains('multiselect')) {
            if (!element.checked) {
              return;
            }
            payload[element.name] = payload[element.name] instanceof Array
              ? payload[element.name]
              : [];
            return element.checked && payload[element.name].push(value);
          }

          payload[element.name] = value;
        }
      );

      if (method === 'DELETE') {
        queryStringObject = payload || {};
        payload = undefined;
      }

      // Call the Api
      try {
        const { statusCode, payload: responsePayload } = await app.client.request({
          path,
          method,
          payload,
          queryStringObject,
        });

        if (statusCode === 200) {
          return app.formResponseProcessor(formId, payload, responsePayload);
        }

        // Try to get the error from api
        const { error = 'An error has occured, please try again' } = responsePayload;

        // Set the formError field with the error text
        document.querySelector("#" + formId + " .formError").innerHTML = error;
        // Show (unhide) the form error field on the form
        document.querySelector("#" + formId + " .formError").style.display = 'block';

      } catch (error) {
        console.warn(error);
      }
    });
  });
};

// Form response processor
app.formResponseProcessor = async function (formId, requestPayload, responsePayload) {
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
      document.querySelector("#" + formId + " .formError").innerHTML = error;
      // Show (unhide) the form error field on the form
      document.querySelector("#" + formId + " .formError").style.display = 'block';
    } catch (error) {
      console.warn(error);
    }
  }

  if (formId === 'sessionCreate') {
    app.setSessionToken(responsePayload);
    window.location = '/checks/all';
  }

  // If the user just deleted their account, redirect them to the account-delete page
  if(formId == 'accountEdit3'){
    app.logUserOut(false);
    window.location = '/account/deleted';
  }

  // If the user just created a check, redirect to dashboard
  if (formId === 'checksCreate') {
    window.location = '/checks/all';
  }

  // If forms saved successfully and they have success messages, show them
  const formsWithSuccessMessages = ['accountEdit1', 'accountEdit2','checksEdit1'];
  if(formsWithSuccessMessages.includes(formId)){
    document.querySelector("#"+formId+" .formSuccess").style.display = 'block';
  }
};

// Get the session token from local storage
// and set it in the app.config object
app.getSessionToken = () => {
  const tokenString = localStorage.getItem('token');
  if (typeof (tokenString) !== 'string') {
    return;
  }

  try {
    const token = JSON.parse(tokenString);
    app.config.sessionToken = token;

    if (typeof (token) === 'object') {
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

  if (typeof (token) === 'object') {
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

// Load data on the page
app.loadDataOnPage = () => {
  // Get current page from the body class
  const bodyClasses = document.querySelector('body').classList;
  const [primaryClass] = bodyClasses;

  // Logic for account settings page
  if (primaryClass === 'accountEdit') {
    app.loadAccountEditPage();
  }

  // Logic for dashboard page
  if (primaryClass === 'checkList') {
    app.loadCheckListPage();
  }

  // Logic for check details page
  if (primaryClass === 'checksEdit') {
    app.loadChecksEditPage();
  }
};

// Load the account edit page specifically
app.loadAccountEditPage = async () => {
  // Get the phone number from current token
  // Log out if there is none
  const { phone } = app.config.sessionToken;

  if (!phone) {
    return app.logUserOut();
  }

  const queryStringObject = { phone };

  try {
    const { statusCode, payload } = await app.client.request({
      path: 'api/users',
      method: 'GET',
      queryStringObject
    });

    if (statusCode !== 200) {
      return app.logUserOut();
    }

    // Put the data into the forms as values where needed
    document.querySelector("#accountEdit1 .firstNameInput").value = payload.firstName;
    document.querySelector("#accountEdit1 .lastNameInput").value = payload.lastName;
    document.querySelector("#accountEdit1 .displayPhoneInput").value = payload.phone;

    // Put the hidden phone field into both forms
    const hiddenPhoneInputs = document.querySelectorAll("input.hiddenPhoneNumberInput");

    Array.from(hiddenPhoneInputs).forEach(
      input => input.value = payload.phone,
    );
  } catch (error) {
    console.warn(error);
  }
};

// Load the dashboard page specifically
app.loadCheckListPage = async () => {
  // Get the phone number from current token
  // Log out if there is none
  const { phone } = app.config.sessionToken;

  if (!phone) {
    return app.logUserOut();
  }

  const queryStringObject = { phone };

  try {
    const { statusCode, payload } = await app.client.request({
      path: 'api/users',
      method: 'GET',
      queryStringObject
    });

    if (statusCode !== 200) {
      return app.logUserOut();
    }

    const checks = payload.checks instanceof Array
      ? payload.checks
      : [];

    if (!checks.length) {
      // Show 'you have no checks' message
      document.getElementById('noChecksMessage').style.display = 'table-row';

      // Show the createCheck CTA
      document.getElementById("createCheckCTA").style.display = 'block';

      return;
    }

    if(checks.length < 5){
      // Show the createCheck CTA
      document.getElementById("createCheckCTA").style.display = 'block';
    }

    const checksRequests = await Promise.all(
      checks.map(async id => {
        const { statusCode, payload } = await app.client.request({
          path: 'api/checks',
          method: 'GET',
          queryStringObject: { id }
        });

        if (statusCode !== 200) {
          console.warn(`Error downloading data for ${id} check`);
          return undefined;
        }

        return payload;
      }),
    );

    const checksData = checksRequests.filter(result => result !== undefined);
    
    checksData.forEach(check => {
      const table = document.getElementById('checksListTable');
      const tr = table.insertRow(-1);
      tr.classList.add('checkRow');
      const td0 = tr.insertCell(0);
      const td1 = tr.insertCell(1);
      const td2 = tr.insertCell(2);
      const td3 = tr.insertCell(3);
      const td4 = tr.insertCell(4);
      td0.innerHTML = check.method.toUpperCase();
      td1.innerHTML = check.protocol + '://';
      td2.innerHTML = check.url;
      const state = check.state || 'unknown';
      td3.innerHTML = state;
      td4.innerHTML = '<a href="/checks/edit?id='+check.id+'">View / Edit / Delete</a>';
    });
  } catch (error) {
    console.warn(error);
  }
}

// Load checks edit page specifically
app.loadChecksEditPage = async () => {
  // Get the check id from the query string
  // Redirect to dashboard if there is no id
  const idMatch = window.location.search.match(/id=(\w{20})/i);
  const id = idMatch
    ? idMatch[1]
    : '';

  if (!id) {
    return window.location = '/checks/all';
  }

  const queryStringObject = { id };

  try {
    // Get check data
    const { statusCode, payload } = await app.client.request({
      path: 'api/checks',
      method: 'GET',
      queryStringObject,
    });

    if (statusCode !== 200) {
      return window.location = '/checks/all';
    }
    
    // Put the hidden id field into both forms
    const hiddenIdInputs = document.querySelectorAll('input.hiddenIdInput');
    Array.from(hiddenIdInputs).forEach(idInput => idInput.value = payload.id);

    // Put the data into the top form as values where needed
    document.querySelector("#checksEdit1 .displayIdInput").value = payload.id;
    document.querySelector("#checksEdit1 .displayStateInput").value = payload.state;
    document.querySelector("#checksEdit1 .protocolInput").value = payload.protocol;
    document.querySelector("#checksEdit1 .urlInput").value = payload.url;
    document.querySelector("#checksEdit1 .methodInput").value = payload.method;
    document.querySelector("#checksEdit1 .timeoutInput").value = payload.timeoutSeconds;

    const successCodeCheckboxes = document.querySelectorAll("#checksEdit1 input.successCodesInput");
    Array.from(successCodeCheckboxes).forEach(checkbox => {
      const checkboxValue = parseInt(checkbox.value);
      if (payload.successCodes.includes(checkboxValue)) {
        checkbox.checked = true;
      }
    });
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
        console.log("Token renewed successfully @ " + Date.now());
      }
    },
    1000 * 60,
  );
};

// Init (bootstraping)
app.init = () => {

  // Bind all form submissions
  app.bindForms();

  // Bind logout button
  app.bindLogoutButton();

  // Get the token from local storage
  app.getSessionToken();

  // Renew token
  app.tokenRenewalLoop();

  // Load data on page
  app.loadDataOnPage();
};

// Call the init process after the window loads
window.onload = () => {
  app.init();
};
