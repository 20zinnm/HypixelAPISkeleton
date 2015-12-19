/*
 * THIS SKELETON WAS CREATED BY MEYER ZINN. Copyright (c) 2015. All rights reserved.
 * This software is offered as-is. I do not impose any warrenty or guarentee on it's operability.
 * I hereby grant an explicit license to Hypixel Inc. to use, modify, repurpose, and sell this software.
 * Credits to http://apicatus-laboratory.rhcloud.com/2014/04/13/rate-limit-your-nodejs-api-with-mongodb/
 * for all rate limiting.
 */

// Here are the global variables.
var MASTER_API_KEY = "thisKeyIsForTheServer";
var SECRET = "abcdefg";
// Define the variables and dependencies needed.
var express = require("express");
var app = express();
var cors = require("cors");
var bodyparser = require("body-parser");
var jwt = require("jsonwebtoken");
var expressjwt = require('express-jwt');
var mongoose = require('mongoose');
mongoose.connect("mongodb://meyerzinn.me:27017/hypixel");
var Throttle = require('./services/throttle');
// Use CORS (Cross-Origin Resource Sharing) Javascript util. Basically, it handles the CORS dirtywork for us.
app.use(cors());
// Use body-parser to parse the body of requests as JSON. This is standard in RESTful APIs.
app.use(bodyparser.json());
// Secure all endpoints except for /token.
app.use(expressjwt({
    secret: SECRET,
    getToken: function fromHeaderOrQuerystring(req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            return req.query.token;
        }
        return null;
    }
}).unless({path: [/\/api\/auth\/.*\/.*/i]}));
// If expressJWT determines the token is unauthorized,
app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({error: "401 Unauthorized. A token was either not sent or invalid."});
    } else {
        next();
    }
});
var router = express.Router();
/*
 This is how the /api command in-game will work.
 The game server has a master key that only it can know.
 It does a POST request to /api/auth. The body should look like:
 {
 "uuid": "PLAYER_UUID",
 "key": "MASTER_KEY"
 }
 Then, the server does some basic logic.
 If the key is not valid, send 403 Unauthorized error.
 If the body is malformed (does not contain the UUID), send 400 Bad Request error.
 Otherwise, make and sign a JSON Web Token containing the UUID.
 */
router.get('/auth/:key/:uuid', function (req, res) {
    if (req.params['key'] == MASTER_API_KEY) {
        if (req.params['uuid']) {
            var token = jwt.sign({uuid: req.params['uuid']}, SECRET, {});
            //console.log(token);
            res.status(200).json({token: token});
        } else {
            res.status(400).json({error: "400 Bad Request. A uuid was not passed. For a server, pass 'server.'"});
        }
    } else {
        req.res.status(401).json({error: "401 Unauthorized. You are not authorized to generate API keys."});
    }
});

var Player = require('./models/player');


router.get('/players/:uuid', Throttle.limit, function (req, res) {
    //console.log(req.params['uuid']);
    if (!req.params['uuid']) return res.status(400).json({error: "400 Bad Request. A uuid was not passed."});
    Player.findOne({uuid: req.params['uuid']}, function (err, player) {
        //console.log(player);
        if (err || player == null) return res.status(404).json({error: "404 Not Found. A player by the given UUID was not found."});
        res.status(200).json({response: player});
    });
});
router.get('/players', function(req, res) {
    var token = req.headers['authorization'].split(' ')[1];
    if (jwt.decode(token)['uuid'] != 'server') return res.status(401).json({error: "401 Unauthorized. You are not allowed to use this endpoint."});
    Player.find({}, function(err, players) {
        if (err) return res.status(500).json({error: "500 Internal Server Error. We're working on fixing it!"});
        res.status(200).json({response: players});
    })
});
app.use('/api', router);
app.listen(3000);