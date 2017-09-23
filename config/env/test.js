'use strict';

module.exports = {

    app: {
        title: 'Weezzler',
        port: process.env.OPENSHIFT_NODEJS_PORT || 8002,
        server: process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'
    },

    db: {
        port: process.env.OPENSHIFT_MONGODB_DB_PORT || '27017',
        server: process.env.OPENSHIFT_MONGODB_DB_HOST || '127.0.0.1',
        user: process.env.OPENSHIFT_MONGODB_DB_USERNAME || 'admin',
        password: process.env.OPENSHIFT_MONGODB_DB_PASSWORD || '714gSI13lJA5',
        database: 'musicstream',
    },

    dbConnectionString : function()
    {
        return 'mongodb://' + this.db.user + ':' + this.db.password + '@' + this.db.server + ':' + this.db.port + '/'  + this.db.database
    }
};
