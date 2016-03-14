/**
 * Created by Uzer on 09.03.2016.
 */
const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config.json');

const StreamStorage = require('./modules/stream-storage.js');
const storage = new StreamStorage();

const ActiveStreamManager = require('./modules/active-stream-manager');
const activeStreamManager = new ActiveStreamManager(storage);

const Router = require('./modules/router');
const router = new Router(activeStreamManager, storage);

const log = require('./modules/logger');

const app = express();

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

app.get('/streamscopeapi/v1/user/canPlay', function(req, res) {
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
    log.info(req.originalUrl);
});

app.listen(config.scopePort, function () {
    log.info('Running on http://localhost:' + config.scopePort)
});
