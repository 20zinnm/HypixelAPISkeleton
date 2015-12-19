/**
 * Created by meyerzinn on 12/18/15.
 * Credits to http://apicatus-laboratory.rhcloud.com/2014/04/13/rate-limit-your-nodejs-api-with-mongodb/
 * for all rate limiting.
 */
module.exports = {
    rateLimits: {
        ttl: 10 * 60 * 1000, // 10 mins
        maxHits: 600 // Max Hits
    }
};