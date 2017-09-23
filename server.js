var init = require('./config/init')(),
    config = require('./config/config'),
    mongoose = require('mongoose');

// Bootstrap db connection
var db = mongoose.connect('mongodb://userHWO:iJPa7ToVdNPpt5ke@127.0.0.1:27017/sampledb', function(err) {
    if (err) {
        console.error('Could not connect to MongoDB!');
        console.log(err);
    }
});

// Init the express application
var app = require('./config/express')(db);

// start app ===============================================
app.listen(config.app.port, config.app.server);

// expose app
exports = module.exports = app;

console.log('Application started on port ' + config.app.port);