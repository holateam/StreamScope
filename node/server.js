/**
 * Created by Uzer on 09.03.2016.
 */
var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config.json');
var nameGenerator = require('./modules/name-generator');
var rejecter = require('./modules/rejecter');
var streamStorage = require('./modules/stream-storage');

var port = config.scopePort;

//@ TODO
var snapshotManagerReady = false;

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.post('/streamscopeapi/v1/stream/publish', publishRequest);
app.post('/streamscopeapi/v1/stream/play', playRequest);
/*
app.get ('/streamscopeapi/v1/streams', getStreams);
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

function sendResponse (res, code, data) {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json');
    if (typeof data=="string") {
        res.statusMessage = data;
        res.status(code).json({code: code, error: data});
    } else {
        res.status(code).json({code: code, response: data});
    }
    res.end();
    console.log("send response", code, data)
}

function formDataObject(streamName){
    return {
            data: {
                streamUrl: config.streamUrl,
                streamName: streamName
            }
    };
}

function formErrorObject() {
    return {
            error: {
                code: " ",
                message: " "
            }
    };
}

function publishRequest (req, res) {
    if (rejecter.publishAllowed()){
        var streamName = nameGenerator.generateName();
        streamStorage.addStream(streamName);
        sendResponse(res, 200, formDataObject(streamName));
    } else {
        sendResponse(res, 400, formErrorObject());
    }
}
function playRequest (req, res) {
    var shortStreamName = req.query.id;
    if (rejecter.streamAllowed(shortStreamName)){
        var previewMode = false;
        if (req.query.preview == "true"){
            previewMode = true;
        }
        var streamName = nameGenerator.generateName(shortStreamName);
        streamStorage.addStream(streamName);
        sendResponse(res, 200, formDataObject(streamName));
    } else {
        sendResponse(res, 400, formErrorObject());
    }
}