/**
 * Example REPL server
 */

const repl = require('repl');

repl.start({
  prompt: '>',
  eval: string => {
    console.log(`At the evaluation stage: ${string}`);

    if (string.trim().toLowerCase() === 'ping') {
      console.log('pong');
    }
  },
});