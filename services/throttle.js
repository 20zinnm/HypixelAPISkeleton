/**
 * Created by meyerzinn on 12/18/15.
 * Credits to http://apicatus-laboratory.rhcloud.com/2014/04/13/rate-limit-your-nodejs-api-with-mongodb/
 * for all rate limiting.
 */
// Module dependencies
var config = require('../config'),
    mongoose = require('mongoose');

// Load model
var RateBuckets_schema = require('../models/throttle'),
    RateBuckets = mongoose.model('RateBuckets', RateBuckets_schema);

exports.limit = function (request, response, next) {
    'use strict';
    //console.log(request.headers);
    var token = request.headers["authorization"].split(' ')[1];

    RateBuckets
        .findOneAndUpdate({token: token}, {$inc: {hits: 1}}, {upsert: false})
        .exec(function (error, rateBucket) {
            if (error) {
                response.status(500);
                return next(error);
            }
            if (!rateBucket) {
                rateBucket = new RateBuckets({
                    createdAt: new Date(),
                    token: token
                });
                rateBucket.save(function (error, rateBucket) {
                    if (error) {
                        response.statusCode = 500;
                        return next(error);
                    }
                    if (!rateBucket) {
                        return response.status(500).json({error: "500 Internal Server Error. We're working on fixing it!"});
                    }
                    var timeUntilReset = config.rateLimits.ttl - (new Date().getTime() - rateBucket.createdAt.getTime());
                    console.log(JSON.stringify(rateBucket, null, 4));
                    // the rate limit ceiling for that given request
                    response.set('X-Rate-Limit-Limit', config.rateLimits.maxHits);
                    // the number of requests left for the time window
                    response.set('X-Rate-Limit-Remaining', config.rateLimits.maxHits - 1);
                    // the remaining window before the rate limit resets in miliseconds
                    response.set('X-Rate-Limit-Reset', timeUntilReset);
                    // Return bucket so other routes can use it
                    request.rateBucket = rateBucket;
                    return next();
                });
            } else {
                var timeUntilReset = config.rateLimits.ttl - (new Date().getTime() - rateBucket.createdAt.getTime());
                var remaining = Math.max(0, (config.rateLimits.maxHits - rateBucket.hits));
                console.log(JSON.stringify(rateBucket, null, 4));
                // the rate limit ceiling for that given request
                response.set('X-Rate-Limit-Limit', config.rateLimits.maxHits);
                // the number of requests left for the time window
                response.set('X-Rate-Limit-Remaining', remaining);
                // the remaining window before the rate limit resets in miliseconds
                response.set('X-Rate-Limit-Reset', timeUntilReset);
                // Return bucket so other routes can use it
                request.rateBucket = rateBucket;
                // Reject or allow
                if (rateBucket.hits < config.rateLimits.maxHits) {
                    return next();
                } else {
                    return response.status(429).json({error: "429 Too Many Requests. You have exceeded your rate limit."});
                }
            }
        });

};