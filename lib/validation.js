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

validation.checkTosAgreement = tosAgreement =>
  typeof tosAgreement == 'boolean' && tosAgreement;

validation.checkToken = token =>
  typeof token === 'string' && token.trim().length === 20
    ? token
    : false;

// Export module
module.exports = validation;