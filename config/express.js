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
module.exports = function(db) {

    // globbing model files
    config.getGlobbedFiles('./app/models/*.js').forEach(function(modelPath) {
        require(path.resolve(modelPath));
    });

    // globbing model files with static data
    // TODO: move more files to staticdata folder (e.g.: jobstatuses, ratingtypes, etc), so they are retrieved
    // only once by the application.
    config.staticdata = [{}];
    config.getGlobbedFiles('./app/models/staticdata/*.js').forEach(function(modelPath) {
        require(path.resolve(modelPath))(config);
    });

    // Setting application local variables
    app.locals.title = config.app.title;
    app.locals.description = config.app.description;
    app.locals.keywords = config.app.keywords;
    app.locals.jsFiles = config.getJavaScriptAssets();
    app.locals.cssFiles = config.getCSSAssets();

    app.engine('server.view.html', consolidate[config.templateEngine]);

    // Set views path and view engine
    app.set('view engine', 'server.view.html');
    app.set('views', './app/views');

    // get all data/stuff of the body (POST) parameters
    // parse application/json
    app.use(bodyParser.json({limit: '5mb'}));

    app.use(bodyParser.urlencoded({ extended: true }));

    // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
    app.use(methodOverride());

    // Express MongoDB session storage
    app.use(session({
        saveUninitialized: true,
        resave: true,
        secret: config.sessionSecret,
        store: new mongoStore({
            mongooseConnection: db.connection,
            collection: config.sessionCollection
        })
    }));

    // set the static files location /public/img will be /img for users
    app.use(express.static(path.resolve('./public')));

    // globbing routing files
    config.getGlobbedFiles('./app/routes/**/*.js').forEach(function(routePath) {
        require(path.resolve(routePath))(app);
    });

    return app;
}