/**
 * Validation service
 */

// Define a container for validation methods
const validation = {};

// Validate non empty string
validation.checkNonEmptyString = str =>
  typeof str == 'string' && str.trim().length > 0
    ? str.trim()
    : false;

validation.checkPhone = phone =>
  typeof phone == 'string' && phone.trim().length === 10
    ? phone.trim()
    : false;

validation.checkBoolean = bool =>
  typeof bool == 'boolean' && bool;

validation.checkToken = token =>
  typeof token === 'string' && token.trim().length === 20
    ? token
    : false;

validation.checkId = id =>
  typeof id === 'string' && id.trim().length === 20
    ? id.trim()
    : false;

validation.checkProtocol = protocol =>
  typeof protocol === 'string' && ['http', 'https'].includes(protocol.toLowerCase())
    ? protocol
    : false;

validation.checkMethod = method =>
  typeof method === 'string' && ['post', 'get', 'put', 'delete'].includes(method.toLowerCase())
    ? method
    : false;

validation.checkSuccessCodes = successCodes =>
  typeof successCodes === 'object'
    && successCodes instanceof Array
    && successCodes.length > 0
      ? successCodes
      : false;

validation.checkTimeoutSeconds = timeoutSeconds =>
  typeof timeoutSeconds === 'number'
    && timeoutSeconds % 1 === 0
    && timeoutSeconds >= 1
    && timeoutSeconds <= 5
      ? timeoutSeconds
      : false;

validation.checkSms = sms =>
  typeof sms === 'string'
    && sms.trim().length > 0
    && sms.trim().length <=160
      ? sms.trim()
      : false;

validation.checkState = state =>
  typeof state === 'string' && ['up', 'down'].includes(state.toLowerCase())
    ? state
    : 'down';

validation.checkLastChecked = lastChecked =>
  typeof lastChecked === 'number'
    && lastChecked > 0
      ? lastChecked
      : false;

validation.checkObject = obj =>
  typeof obj === 'object'
    && obj !== null
      ? obj
      : {}

// Export module
module.exports = validation;