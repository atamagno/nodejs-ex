// modules =================================================
var express        = require('express'),
    app            = express(),
    bodyParser     = require('body-parser'),
    session        = require('express-session'),
    methodOverride = require('method-override'),
    path           = require('path'),
    mongoStore     = require('connect-mongo')(session),
    consolidate    = require('consolidate'),
    config         = require('./config');

// configuration ===========================================
//module.exports = function(db) {
module.exports = function() {

    return app;
}