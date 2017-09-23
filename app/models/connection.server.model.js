'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var ConnectionSchema = new Schema({
	code: {
		type: String,
		trim: true
	},
	url: {
		type: String,
		trim: true
	},
	created: {
		type: Date,
		default: Date.now
	},
});

mongoose.model('Connection', ConnectionSchema);