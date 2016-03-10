var config = require('../config.json');
var nameGenerator = require('./name-generator');
var rejecter = require('./rejecter');
var snapshot = require('./snapshot-cache');

function Router(activeStreamManager) {
    this.activeStreamManager = activeStreamManager;
    console.log("router inited");
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
    console.log("publish request");
    if (rejecter.publishAllowed()){
        var streamName = nameGenerator.generateName();
        this.activeStreamManager.publish(streamName);
        this.sendResponse(res, 200, this.formDataObject({streamUrl: config.streamUrl, streamName: streamName}));
        console.log("publish request sent ok response");
    } else {
        this.sendResponse(res, 400, this.formErrorObject());
        console.log("publish request sent error response");
    }
};

Router.prototype.playRequest = function (req, res) {
    console.log("play request");
    var shortStreamName = req.query.id;
    if (rejecter.streamAllowed(shortStreamName)){
        var previewMode = false;
        if (req.query.preview == "true"){
            previewMode = true;
        }
        var salt = nameGenerator.generateSalt();
        var streamName= shortStreamName + salt;

        this.activeStreamManager.registryUser(streamName);
        this.sendResponse(res, 200, this.formDataObject({streamUrl: config.streamUrl, streamName: streamName}));
        console.log("play request sent ok response");
    } else {
        this.sendResponse(res, 400, this.formErrorObject());
        console.log("play request sent error response");
    }
};

Router.prototype.getStreams = function (req, res) {
    console.log("Streams list request");
    var streamsList = this.activeStreamManager.getActiveStreams();
    this.sendResponse(res, 200, this.formDataObject(streamsList));
    console.log("Streams list sent");
};

Router.prototype.getSnapshot = function (req, res) {
    console.log("Snapshot request");
    var shortStreamName = req.query.id;
    var currentSnapshot = snapshot.getSnapshot(shortStreamName);
    // TODO
    //this.sendResponse(res, 200, {data: currentSnapshot});
    //console.log("Snapshot sent");
};

Router.prototype.canPublish = function (req, res) {
    console.log("canPublish request");
    var streamName = req.query.streamName;
    //var sessionid = req.query.sessionid;

    var allowed = false;
    if (rejecter.canPublish(streamName)){
        allowed = true;
        console.log("canPublish allowed");
        activeStreamManager.confirmStream(streamName)
    } else {
        console.log("canPublish rejected");
    }
    this.sendResponse(res, 200, this.formDataObject({"allowed": allowed}));
};

Router.prototype.canPlay = function (req, res) {
    console.log("canPlay request");
    var streamName = req.query.streamName;
    var sessionId = req.query.sessionid;

    var allowed = false;
    if (rejecter.canPlay(streamName)){
        allowed = true;
        console.log("canPlay allowed");
        activeStreamManager.subscribeUser(streamName, sessionId);
    } else {
        console.log("canPlay rejected");
    }
    this.sendResponse(res, 200, this.formDataObject({"allowed": allowed}));
};

Router.prototype.stopPlay = function (req, res) {
    console.log("stopPlay request");
    var streamName = req.query.streamName;
    var sessionId = req.query.sessionid;
    activeStreamManager.unsubscribeUser(streamName, sessionId);
};

Router.prototype.stopPublish = function (req, res) {
    console.log("stopPublish request");
    var streamName = req.query.streamName;
    //var sessionId = req.query.sessionid;
    activeStreamManager.unpublish(streamName);
};
