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

    config.getGlobbedFiles('./app/models/*.js').forEach(function(modelPath) {
        require(path.resolve(modelPath));
    });

    app.locals.title = config.app.title;
    app.locals.description = config.app.description;
    app.locals.keywords = config.app.keywords;
    app.locals.jsFiles = config.getJavaScriptAssets();
    app.locals.cssFiles = config.getCSSAssets();

    //app.engine('server.view.html', consolidate[config.templateEngine]);

    // Set views path and view engine
    //app.set('view engine', 'server.view.html');
    //app.set('views', './app/views');

    // get all data/stuff of the body (POST) parameters
    // parse application/json
    /*
    app.use(bodyParser.json({limit: '5mb'}));

    app.use(bodyParser.urlencoded({ extended: true }));

    // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
    app.use(methodOverride());
    */

    return app;
}