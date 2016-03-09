/**
 * Created by Uzer on 09.03.2016.
 */
var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config.json');
var nameGenerator = require('./modules/name-generator');
var rejecter = require('./modules/rejecter');
var streamStorage = require('./modules/stream-storage');
var Router = require('./modules/router');
var router = new Router;

var port = config.scopePort;

//@ TODO
var snapshotManagerReady = false;

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.post('/streamscopeapi/v1/stream/publish', router.publishRequest);
app.post('/streamscopeapi/v1/stream/play', router.playRequest);
app.get ('/streamscopeapi/v1/streams', router.getStreams);
/*
app.get ('/streamscopeapi/v1/stream/snapshot', getSnapshot);

app.post('/streamscopeapi/v1/user/canPublish', canPublish);
app.post('/streamscopeapi/v1/user/canPlay', canPlay);
app.post('/streamscopeapi/v1/user/publish', userPublish);
app.post('/streamscopeapi/v1/user/unpublish', userUnpublish);
app.post('/streamscopeapi/v1/user/play', userPlay);
app.post('/streamscopeapi/v1/user/stopPlay', userStopPlay);
*/
app.use(function (req, res) {
    sendResponse(res, 404, 'Route not found');
});

app.listen(port, function () {
    console.log('Running on http://localhost:' + port)
});
