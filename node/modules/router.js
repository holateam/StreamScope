var config = require('../config.json');
var nameGenerator = require('./name-generator');
var rejecter = require('./rejecter');
var snapshot = require('./snapshot-cache');

function Router(streamStorage) {
    this.streamStorage = streamStorage;
}

module.exports=Router;

Router.prototype.sendResponse = function (res, code, data) {
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
};

Router.prototype.formDataObject = function (data){
    return {
        data: data,
        version: config.version
    };
};

Router.prototype.formErrorObject = function () {
    return {
        error: {
            code: " ",
            message: " "
        },
        version: config.version
    };
};

Router.prototype.publishRequest = function (req, res) {
    if (rejecter.publishAllowed()){
        var streamName = nameGenerator.generateName();
        this.streamStorage.addStream(streamName);
        this.sendResponse(res, 200, this.formDataObject({streamUrl: config.streamUrl, streamName: streamName}));
    } else {
        this.sendResponse(res, 400, this.formErrorObject());
    }
};

Router.prototype.playRequest = function (req, res) {
    var shortStreamName = req.query.id;
    if (rejecter.streamAllowed(shortStreamName)){
        var previewMode = false;
        if (req.query.preview == "true"){
            previewMode = true;
        }
        var streamName = nameGenerator.generateName(shortStreamName);
        this.streamStorage.addStream(streamName);
        this.sendResponse(res, 200, this.formDataObject({streamUrl: config.streamUrl, streamName: streamName}));
    } else {
        this.sendResponse(res, 400, this.formErrorObject());
    }
};

Router.prototype.getStreams = function (req, res) {
    var streamsList = this.streamStorage.getActiveStreams();
    this.sendResponse(res, 200, this.formDataObject(streamsList));
};

Router.prototype.getSnapshot = function (req, res) {
    var shortStreamName = req.query.id;
    var currentSnapshot = snapshot.getSnapshot(shortStreamName);
    // TODO
    //this.sendResponse(res, 200, {data: currentSnapshot});
};

Router.prototype.canPublish = function (req, res) {
    var streamName = req.query.streamName;
    var allowed = false;
    if (rejecter.canPublish(streamName)){
        allowed = true;
    }
    this.sendResponse(res, 200, this.formDataObject({"allowed": allowed}));
};

Router.prototype.canPlay = function (req, res) {
    var streamName = req.query.streamName;
    var allowed = false;
    if (rejecter.canPlay(streamName)){
        allowed = true;
    }
    this.sendResponse(res, 200, this.formDataObject({"allowed": allowed}));
};
