'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    errorHandler = require('./errors.server.controller'),
    Connection = mongoose.model('Connection'),
    _ = require('lodash');

exports.getUrlByCode = function(req, res) {

  var code = req.params.code;

  Connection.findOne({ code: code }).exec(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(connection);
    }
  });
}

exports.getConnectionInfo = function(req, res) {
  var url = req.params.url;

  // Get all connections
  Connection.find().exec(function(err, connections) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      var uniqueCode = generateUniqueCode();
      while (searchUniqueCode(uniqueCode, connections)) {
        uniqueCode = generateUniqueCode();
      }

      // Save new connection
      var connection = new Connection();
      connection.code = uniqueCode;
      connection.url = url;

      connection.save(function(err) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          res.jsonp({ code: connection.code });
        }
      });
    }
  });
};

function searchUniqueCode(code, connections) {

  for (var i = 0; i < connections.length; i++) {
    if (connections[i].code == code) {
      return true;
    }
  }

  return false;
}

function generateUniqueCode() {

  var code = "";
  var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

  for (var i= 0; i < 6; i++) {
    code += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return code;
};