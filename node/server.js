/**
 * Created by Uzer on 09.03.2016.
 */
var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config.json');

var ActiveStreamManager = require('./modules/active-stream-manager');
var activeStreamManager = new ActiveStreamManager;

var Router = require('./modules/router');
var router = new Router(activeStreamManager);

var port = config.scopePort;

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.post('/streamscopeapi/v1/stream/publish', router.publishRequest);
app.post('/streamscopeapi/v1/stream/play', router.playRequest);
app.get ('/streamscopeapi/v1/streams', router.getStreams);
app.get ('/streamscopeapi/v1/stream/snapshot', router.getSnapshot);

app.get('/streamscopeapi/v1/user/canPublish', router.canPublish);
app.get('/streamscopeapi/v1/user/canPlay', router.canPlay);

app.get('/streamscopeapi/v1/user/stopPublish', router.stopPublish);
app.get('/streamscopeapi/v1/user/stopPlay', router.stopPlay);

app.use(function (req, res) {
    sendResponse(res, 404, 'Route not found');
});

app.listen(port, function () {
    console.log('Running on http://localhost:' + port)
});
