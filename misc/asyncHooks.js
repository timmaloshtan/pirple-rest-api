const async_hooks = require('async_hooks');
const fs = require('fs');

// Target execution context
const targetExecutionContext = false;

const sleep = ms => new Promise(resolve => {
  setTimeout(() => resolve(), ms);
});

const whatTimeIsIt = async () => {
  await sleep(1000);
  fs.writeSync(1, `When function runs, execution context is ${async_hooks.executionAsyncId()}\n`);
  return Date.now();
};

whatTimeIsIt();

const hooks = {
  init(asyncId, type, triggerAsyncId, resource) {
    fs.writeSync(1, `Hook initialization: ${asyncId}\n`);
  },
  before(asyncId) {
    fs.writeSync(1, `Hook before: ${asyncId}\n`);
  },
  after(asyncId) {
    fs.writeSync(1, `Hook after: ${asyncId}\n`);
  },
  destroy(asyncId) {
    fs.writeSync(1, `Hook destroy: ${asyncId}\n`);
  },
  promiseResolve(asyncId) {
    fs.writeSync(1, `Hook promiseResolve: ${asyncId}\n`);
  },
};

const asyncHook = async_hooks.createHook(hooks);
asyncHook.enable();