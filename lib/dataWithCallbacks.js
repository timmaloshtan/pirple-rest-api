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

// Container for the module
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '../.data/');

// Write data to a file
lib.create = async (dir, file, data, callback) => {
  let fileDescriptor;
  const stringData = JSON.stringify(data);
  // Open the file for writing
  try {
    fileDescriptor = await promisifiedOpen(
      lib.baseDir + dir + '/' + file + '.json',
      'wx'
    );
  } catch (err) {
    return callback('Error! Could not create new file, it may already exist.');
  }

  // Write to file
  try {
    await promisifiedWriteFile(
      fileDescriptor,
      stringData,
    );
  } catch (err) {
    return callback('Error! Couldn\'t write to new file.');
  }

  // Close file
  try {
    await promisifiedClose(
      fileDescriptor
    );
  } catch (err) {
    return callback('Error! Couldn\'t close a new file.')
  }

  callback(false);
};

// Read data from a file
lib.read = async (dir, file, callback) => {
  try {
    const data = await promisifiedReadFile(
      lib.baseDir + dir + '/' + file + '.json',
      'utf-8',
    );
    const parsedData = helpers.parseJsonToObject(data);
    callback(false, parsedData);
  } catch (err) {
    callback(err, null);
  }
};

// Update an existing file with new data
lib.update = async (dir, file, data, callback) => {
  let fileDescriptor;

  // Convert data to a string
  const stringData = JSON.stringify(data);

  // Open file for writing
  try {
    fileDescriptor = await promisifiedOpen(
      lib.baseDir + dir + '/' + file + '.json',
      'r+',
    )
  } catch (error) {
    callback('Error! Could not open a file for updating, it may not exist yet');
  }

  // Truncate before writing
  try {
    await promisifiedFtruncate(fileDescriptor);
  } catch (error) {
    callback('Error! Could not truncate the file.');
  }

  // Write to the file
  try {
    await promisifiedWriteFile(
      fileDescriptor,
      stringData,
    )
  } catch (error) {
    callback('Error! Could not write to existing file');
  }

  // Close the file
  try {
    await promisifiedClose(fileDescriptor);
  } catch (error) {
    callback('Error! Could not close the file');
  }

  callback(false);
};

// Deleting a file
lib.delete = async (dir, file, callback) => {
  try {
    await promisifiedUnlink(
      lib.baseDir + dir + '/' + file + '.json',
    )
  } catch (error) {
    callback('Error! Could not delete the file.');
  }

  callback(false);
};


// Export the module
module.exports = lib;