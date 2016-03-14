/**
 * Created by Uzer on 09.03.2016.
 */
var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config.json');

var StreamStorage = require('./modules/stream-storage.js');
var storage = new StreamStorage();

var ActiveStreamManager = require('./modules/active-stream-manager');
var activeStreamManager = new ActiveStreamManager(storage);

var Router = require('./modules/router');
var router = new Router(activeStreamManager, storage);

var port = config.scopePort;

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.post('/streamscopeapi/v1/stream/publish', function(req, res) {
    router.publishRequest (req, res)
});

app.post('/streamscopeapi/v1/stream/play', function(req, res) {
    router.playRequest (req, res);
});

app.get ('/streamscopeapi/v1/streams', function(req, res) {
    router.getStreams (req, res);
});

app.get ('/streamscopeapi/v1/stream/snapshot', function(req, res) {
    router.getSnapshot (req, res);
});

app.get('/streamscopeapi/v1/user/canPublish', function(req, res) {
    router.canPublish (req, res);
});
app.get('/streamyscopeapi/v1/publishstart', function(req, res) {
    router.canPublish (req, res);
});

app.get('/streamyscopeapi/v1/user/canPlay', function(req, res) {
    router.canPlay (req, res);
});
app.get('/streamyscopeapi/v1/viewerstart', function(req, res) {
    router.canPlay (req, res);
});

app.get('/streamscopeapi/v1/user/stopPublish', function(req, res) {
    router.stopPublish (req, res);
});
app.get('/streamyscopeapi/v1/publishstop', function(req, res) {
    router.stopPublish (req, res);
});

app.get('/streamscopeapi/v1/user/stopPlay', function(req, res) {
    router.stopPlay (req, res);
});
app.get('/streamyscopeapi/v1/viewerstop', function(req, res) {
    router.stopPlay (req, res);
});

app.use(function (req, res) {
    router.sendResponse(res, 404, 'Route not found');
    console.log(req.originalUrl);
});

app.listen(port, function () {
    console.log('Running on http://localhost:' + port)
});
