/**
 * Formating tools
 */

// Create a module object
const formating = {};

// Print a vertical space
formating.printVerticalSpaces = (numberOfLines = 1) => {
  console.log('\n'.repeat(numberOfLines));
};

formating.padWithLeadingSpaces = (numberOfSpaces, string) => ' '.repeat(numberOfSpaces) + string;
formating.padWithTrailingSpaces = (numberOfSpaces, string) => string + ' '.repeat(numberOfSpaces);

// Get available screen width
formating.getScreenWidth = () => process.stdout.columns;

formating.drawHorizontalLine = () => {
  console.log('-'.repeat(formating.getScreenWidth()));
};

formating.printCenteredString = (string) => {
  string = string.trim();
  const padding = (formating.getScreenWidth() - string.length) / 2;

  string = formating.padWithLeadingSpaces(Math.ceil(padding), string);
  console.log(string);
};

// Export the module
module.exports = formating;