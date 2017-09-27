var init = require('./config/init')(),
    config = require('./config/config'),
    mongoose = require('mongoose');

Object.assign=require('object-assign')

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
  mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
}

var db = null,
    dbDetails = new Object();

mongoURL = 'mongodb://localhost/musicstream';
//mongoURL = 'mongodb://userHWO:iJPa7ToVdNPpt5ke@127.0.0.1:27017/sampledb';

console.log('mongoURL: %s', mongoURL);

if (mongoURL != null) {
  db = mongoose.connect(mongoURL, function(err) {
    if (err) {
      console.error('Could not connect to MongoDB!');
      console.log(err);
      return;
    }

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
}

var app = require('./config/express')(db);

app.get('/', function (req, res) {
    res.render('index.html', { pageCountMessage : null});
});

app.get('/pagecount', function (req, res) {
    res.send('{ pageCount: -1 }');
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

exports = module.exports = app;
