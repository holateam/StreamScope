/**
 * Created by Uzer on 09.03.2016.
 */
var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config.json');

var StreamStorage = require('./modules/stream-storage');
var streamStorage = new StreamStorage;

var Router = require('./modules/router');
var router = new Router(streamStorage);

var port = config.scopePort;

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.post('/streamscopeapi/v1/stream/publish', router.publishRequest);
app.post('/streamscopeapi/v1/stream/play', router.playRequest);
app.get ('/streamscopeapi/v1/streams', router.getStreams);
app.get ('/streamscopeapi/v1/stream/snapshot', router.getSnapshot);

app.post('/streamscopeapi/v1/user/canPublish', router.canPublish);
app.post('/streamscopeapi/v1/user/canPlay', router.canPlay);

app.post('/streamscopeapi/v1/user/stopPublish', userStopPublish);
app.post('/streamscopeapi/v1/user/stopPlay', userStopPlay);

app.use(function (req, res) {
    sendResponse(res, 404, 'Route not found');
});

app.listen(port, function () {
    console.log('Running on http://localhost:' + port)
});
