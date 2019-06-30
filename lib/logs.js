/**
 * Library for storing and rotating logs
 * 
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const util = require('util');

// Promisify required functions
const promisifiedOpen = util.promisify(fs.open);
const promisifiedClose = util.promisify(fs.close);
const promisifiedWriteFile = util.promisify(fs.writeFile);
const promisifiedReadFile = util.promisify(fs.readFile);
const promisifiedFtruncate = util.promisify(fs.ftruncate);
const promisifiedUnlink = util.promisify(fs.unlink);
const promisifiedReaddir = util.promisify(fs.readdir);
const promisifiedAppendFile = util.promisify(fs.appendFile);
const promisifiedGzip = util.promisify(zlib.gzip);
const promisifiedUnzip = util.promisify(zlib.unzip);

// Container for the module
const lib = {};

// Base directory of the logs folder
lib.baseDir = path.join(__dirname, '../.logs/');

// Append a string to a file
// Create the file if it doesn't exist
lib.append = async (file, str) => {
  // Open the file for appending
  let fileDescriptor = null;

  try {
    fileDescriptor = await promisifiedOpen(
      lib.baseDir  + file + '.log',
      'a',
    )
  } catch (error) {
    const err = new Error('Could not open a file or create a new one.');
    err.details = error;
    throw error;
  }

  // Append to the file and close it
  try {
    await promisifiedAppendFile(fileDescriptor, `${str}\n`);
  } catch (error) {
    const err = new Error('Could not append to a file.');
    err.details = error;
    throw error;
  }
  
  try {
    await promisifiedClose(fileDescriptor)
  } catch (error) {
    const err = new Error('Could not close the file.');
    err.details = error;
    throw error;
  }
  
};

// List all the logs and optionally include compressed logs
lib.list = async shouldIncludeCompressed => {
  let logNames;

  try {
    logNames = await promisifiedReaddir(lib.baseDir);
  } catch (error) {
    const err = new Error('Could not read log names');
    err.details = error;
    throw err;
  }

  const trimmedFileNames = logNames.reduce((result, fileName) => {
    if (fileName.includes('.log')) {
      return result.concat(fileName.replace('.log', ''));
    }

    if (fileName.includes('.gz.b64') && shouldIncludeCompressed) {
      return result.concat(fileName.replace('.gz.b64', ''));
    }

    return result;
  }, []);

  return trimmedFileNames;
}

// Compress the contents of one .log file into a .gz.b64 file within the same directory.
lib.compress = async (logId, newFileId) => {
  const sourceFile = `${logId}.log`;
  const destinationFile = `${newFileId}.gz.b64`;

  // Read the source file 
  let inputString;
  try {
    inputString = await promisifiedReadFile(
      lib.baseDir + sourceFile,
      'utf-8',
    );
  } catch (error) {
    const err = new Error('Could not read the file');
    err.details = error;
    throw err;
  }

  // Compress the data using gzip
  let buffer;
  try {
    buffer = await promisifiedGzip(inputString)
  } catch (error) {
    const err = new Error('Could not gzip an input string');
    err.details = error;
    throw err;
  }

  // Open destination file for writing
  let fileDescriptor;
  try {
    fileDescriptor = await promisifiedOpen(
      lib.baseDir + destinationFile,
      'wx',
    );
  } catch (error) {
    const err = new Error('Could not open a file for writing');
    err.details = error;
    throw err;
  }

  // Write to the file
  try {
    await promisifiedWriteFile(fileDescriptor, buffer.toString('base64'));
  } catch (error) {
    const err = new Error('Could not write to a file');
    err.details = error;
    throw err;
  }

  // Close the destination file
  try {
    await promisifiedClose(fileDescriptor);
  } catch (error) {
    const err = new Error('Could not close the destination file');
    err.details = error;
    throw err;
  }
};

// Decompress the contents of the .gz.b64 file into a string variable
lib.decompress = async fileId => {
  const fileName = `${fileId}.gz.b64`;

  // Read the compressed file
  let stringData;
  try {
    stringData = await promisifiedReadFile(lib.baseDir + fileName, 'utf-8');
  } catch (error) {
    const err = new Error('Could not close the destination file');
    err.details = error;
    throw err;
  }

  // Decompress the data
  const inputBuffer = Buffer.from(stringData, 'base64');
  let outputBuffer;
  try {
    outputBuffer = await promisifiedUnzip(inputBuffer);

    return outputBuffer.toString();
  } catch (error) {
    const err = new Error('Could not unzip the string data');
    err.details = error;
    throw err;
  }
};

// Truncate a log file
lib.truncate = async logId => {
  // Open the file for truncating
  let fileDescriptor;
  try {
    fileDescriptor = await promisifiedOpen(
      lib.baseDir + logId + '.log',
      'r+',
    );
  } catch (error) {
    const err = new Error('Could not open the file for truncating');
    err.details = error;
    throw err;
  }

  // Truncate the file
  try {
    await promisifiedFtruncate(fileDescriptor, 0);
  } catch (error) {
    const err = new Error('Could not truncate the file');
    err.details = error;
    throw err;
  }

  // Close truncated file
  try {
    await promisifiedClose(fileDescriptor)
  } catch (error) {
    const err = new Error('Could not close the truncated file.');
    err.details = error;
    throw error;
  }
}


// Export module
module.exports = lib;