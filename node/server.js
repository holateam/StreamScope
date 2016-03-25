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

const SnapshotMaker = require('./modules/snapshot-cache.js');
const snapshotMaker = new SnapshotMaker(activeStreamManager);
//snapshotMaker.start();

const log = require('./modules/logger');

const app = express();

app.get ('/streamyscopeapi/ping', function(req, res) {
    res.sendStatus(200);
});

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.post('/streamyscopeapi/v1/stream/publish', function(req, res) {
    router.publishRequest (req, res)
});

app.post('/streamyscopeapi/v1/stream/play', function(req, res) {
    router.playRequest (req, res);
});

app.get ('/streamyscopeapi/v1/streams', function(req, res) {
    router.getStreams (req, res);
});

app.get ('/streamyscopeapi/v1/stream/snapshot', function(req, res) {
    router.getSnapshot (req, res);
});

app.get('/streamyscopeapi/v1/publishstart', function(req, res) {
    router.canPublish (req, res);
});

app.get('/streamyscopeapi/v1/viewerstart', function(req, res) {
    router.canPlay (req, res);
});

app.get('/streamyscopeapi/v1/publishstop', function(req, res) {
    router.stopPublish (req, res);
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
