/**
 * Library for storing and editing data
 */

// Dependencies
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

// Container for the module
var lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '../.data/');

// Write data to a file
lib.create = function(dir, file, data, callback) {
  // Open the file for writing
  fs.open(
    lib.baseDir + dir + '/' + file + '.json',
    'wx',
    function(err, fileDescriptor) {
      if (!err && fileDescriptor) {
        // Convert data to a string
        var stringData = JSON.stringify(data);

        // Write to file and close it
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
                    callback('Error! Couldn\'t close a new file.')
                  }
                }
              )
            } else {
              callback('Error! Couldn\'t write to new file.');
            }
          }
        );
      } else {
        callback('Error! Could not create new file, it may already exist.')
      }
    }
  )
};

// Read data from a file
lib.read = function(dir, file, callback) {
  fs.readFile(
    lib.baseDir + dir + '/' + file + '.json',
    'utf-8',
    function(err, data) {
      if (!err && data) {
        var parsedData = helpers.parseJsonToObject(data);
        callback(false, parsedData);
      } else {
        callback(err, data);
      }
    }
  );
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