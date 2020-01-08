/**
 * Stats responder
 */

const os = require('os');
const v8 = require('v8');
const formating = require('../formating');

const stats = () => {
  // Create a stats object
  const stats = {
    'Load average': os.loadavg().join(' '),
    'CPU count': os.cpus().length,
    'Free memory': os.freemem(),
    'Current Mallocked memory': v8.getHeapStatistics().malloced_memory,
    'Peak Mallocked memory': v8.getHeapStatistics().peak_malloced_memory,
    'Allockated heap used (%)': Math.round(v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size * 100),
    'Available heap allockated (%)': Math.round(v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit * 100),
    'Uptime': os.uptime() + ' sec',
  };

  formating.drawHorizontalLine();
  formating.printCenteredString('SYSTEM STATISTICS');
  formating.drawHorizontalLine();
  formating.printVerticalSpaces(2);

  Object.keys(stats).forEach(stat => {
    const description = stats[stat];
    const key = `\x1b[33m${stat}\x1b[0m`;

    const line = formating.padWithTrailingSpaces(60 - key.length, key) + description;

    console.log(line);
    formating.printVerticalSpaces();
  });

  formating.drawHorizontalLine();
};

module.exports = stats;