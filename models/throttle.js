/**
 * Created by meyerzinn on 12/18/15.
 * Credits to http://apicatus-laboratory.rhcloud.com/2014/04/13/rate-limit-your-nodejs-api-with-mongodb/
 * for all rate limiting.
 */
var mongoose = require('mongoose'),
    config = require('../config'),
    Schema = mongoose.Schema;

var RateBuckets = new Schema({
    createdAt: {type: Date, required: true, default: Date.now, expires: config.rateLimits.ttl},
    token:{type: String, required: true},
    hits: {type: Number, default: 1, required: true, max: config.rateLimits.maxHits, min: 0}
});

module.exports = mongoose.model('RateBuckets', RateBuckets);