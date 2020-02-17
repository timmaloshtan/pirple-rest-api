const vm = require('vm');

// Define a context for the script to run in
const context = {
  foo: 25,
};

// Define the script that should execute
const script = new vm.Script(`
  var bar = foo * 2;
  var baz = bar + 1;
`);

// Run the script
script.runInNewContext(context);
console.log('context :', context);