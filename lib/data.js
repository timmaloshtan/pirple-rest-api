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

// Container for the module
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '../.data/');

// Write data to a file
lib.create = async function(dir, file, data, callback) {
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
lib.read = async function(dir, file, callback) {
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
lib.update = function(dir, file, data, callback) {
  // Open the file for writing
  fs.open(
    lib.baseDir + dir + '/' + file + '.json',
    'r+',
    function(err, fileDescriptor) {
      if (!err && fileDescriptor) {
        // Convert data to a string
        var stringData = JSON.stringify(data);

        // Truncate the file before writing
        fs.ftruncate(
          fileDescriptor,
          function(err) {
            if (!err) {
              // Write to the file and close it
              fs.writeFile(
                fileDescriptor,
                stringData,
                function(err) {
                  if (!err) {
                    fs.close(
                      fileDescriptor,
                      function(err) {
                        if (!err) {
                          callback(false);
                        } else {
                          callback('Error! Could not close the file');
                        }
                      }
                    )
                  } else {
                    callback('Error! Could not write to existing file');
                  }
                }
              );

            } else {
              callback('Error! Could not truncate the file.');
            }
          }
        );
      } else {
        callbakc('Error! Could not open a file for updating, it may not exist yet');
      }
    }
  )
};

// Deleting a file
lib.delete = function(dir, file, callback) {
  // Unlink the file
  fs.unlink(
    lib.baseDir + dir + '/' + file + '.json',
    function(err) {
      if(!err) {
        callback(false);
      } else {
        callback('Error! Could not delete the file.');
      }
    },
  );
};


// Export the module
module.exports = lib;