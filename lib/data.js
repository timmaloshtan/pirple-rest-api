/**
 * Library for storing and editing data
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const util = require('util');
const helpers = require('./helpers');

// Promisify required functions
const promisifiedOpen = util.promisify(fs.open);
const promisifiedClose = util.promisify(fs.close);
const promisifiedWriteFile = util.promisify(fs.writeFile);
const promisifiedReadFile = util.promisify(fs.readFile);
const promisifiedFtruncate = util.promisify(fs.ftruncate);
const promisifiedUnlink = util.promisify(fs.unlink);
const promisifiedReaddir = util.promisify(fs.readdir);

// Container for the module
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '../.data/');

// Write data to a file
lib.create = async (dir, file, data) => {
  let fileDescriptor;
  const stringData = JSON.stringify(data);
  // Open the file for writing
  try {
    fileDescriptor = await promisifiedOpen(
      lib.baseDir + dir + '/' + file + '.json',
      'wx'
    );
  } catch (err) {
    const error = new Error('Could not create new file, it may already exist.');
    error.details = err;
    throw error;
  }

  // Write to file
  try {
    await promisifiedWriteFile(
      fileDescriptor,
      stringData,
    );
  } catch (err) {
    const error = new Error('Couldn\'t write to new file.');
    error.details = err;
    throw error;
  }

  // Close file
  try {
    await promisifiedClose(
      fileDescriptor
    );
  } catch (err) {
    const error = new Error('Couldn\'t close a new file.');
    error.details = err;
    throw error;
  }
};

// Read data from a file
lib.read = async (dir, file) => {
  try {
    const data = await promisifiedReadFile(
      lib.baseDir + dir + '/' + file + '.json',
      'utf-8',
    );
    const parsedData = helpers.parseJsonToObject(data);
    return parsedData;
  } catch (err) {
    const error = new Error('Couldn\'t read file.');
    error.details = err;
    throw error;
  }
};

// Update an existing file with new data
lib.update = async (dir, file, data) => {
  let fileDescriptor;

  // Convert data to a string
  const stringData = JSON.stringify(data);

  // Open file for writing
  try {
    fileDescriptor = await promisifiedOpen(
      lib.baseDir + dir + '/' + file + '.json',
      'r+',
    )
  } catch (err) {
    const error = new Error('Could not open a file for updating, it may not exist yet.');
    error.details = err;
    throw error;
  }

  // Truncate before writing
  try {
    await promisifiedFtruncate(fileDescriptor);
  } catch (err) {
    const error = new Error('Could not truncate the file.');
    error.details = err;
    throw error;
  }

  // Write to the file
  try {
    await promisifiedWriteFile(
      fileDescriptor,
      stringData,
    )
  } catch (err) {
    const error = new Error('Could not write to existing file.');
    error.details = err;
    throw error;
  }

  // Close the file
  try {
    await promisifiedClose(fileDescriptor);
  } catch (err) {
    const error = new Error('Could not close the file.');
    error.details = err;
    throw error;
  }
};

// Deleting a file
lib.delete = async (dir, file) => {
  try {
    await promisifiedUnlink(
      lib.baseDir + dir + '/' + file + '.json',
    )
  } catch (err) {
    const error = new Error('Could not delete the file.');
    error.details = err;
    throw error;
  }
};

// List all the items in a directory
lib.list = async dir => {
  try {
    const fileNames = await promisifiedReaddir(
      lib.baseDir + dir + '/',
    );

    if (!fileNames.length) {
      throw new Error('Directory is empty');
    }

    const trimmedFileNames = fileNames.map(fileName => fileName.replace('.json', ''));

    return trimmedFileNames;
  } catch (err) {
    const error = new Error('Could not list the directory or the directory is empty.');
    error.details = err;
    throw error;
  }
}


// Export the module
module.exports = lib;