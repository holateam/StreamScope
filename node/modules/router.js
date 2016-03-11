"use strict";
var config = require('../config.json');
var nameGenerator = require('./name-generator');

var snapshot = require('./snapshot-cache');
const log = require('./logger');

function Router(activeStreamManager, storage) {
    this.activeStreamManager = activeStreamManager;
    var Rejecter = require('./rejecter');
    this.rejecter = new Rejecter(storage);
    log.info("router inited");
}

module.exports = Router;

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
    log.info("send response", code, data)
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
    log.info("publish request");
    if (this.rejecter.publishAllowed()){
        var data = this.activeStreamManager.publish();
        this.sendResponse(res, 200, this.formDataObject(data));
        log.info("publish request sent ok response");
    } else {
        this.sendResponse(res, 400, this.formErrorObject());
        log.info("publish request sent error response");
    }
};

Router.prototype.playRequest = function (req, res) {
    log.info("play request");
    var shortStreamName = req.query.id;
    if (this.rejecter.streamAllowed(shortStreamName)){
        var previewMode = false;
        if (req.query.preview == "true"){
            previewMode = true; // TODO?
        }
        var salt = nameGenerator.generateSalt();
        var streamName= shortStreamName + salt;

        this.activeStreamManager.subscribeUser(streamName, salt);
        this.sendResponse(res, 200, this.formDataObject({streamUrl: config.streamUrl, streamName: streamName}));
        log.info("play request sent ok response");
    } else {
        this.sendResponse(res, 400, this.formErrorObject());
        log.info("play request sent error response");
    }
};

Router.prototype.getStreams = function (req, res) {
    log.info("Streams list request");
    var streamsList = this.activeStreamManager.getActiveStreams();
    this.sendResponse(res, 200, this.formDataObject(streamsList));
    log.info("Streams list sent");
};

Router.prototype.getSnapshot = function (req, res) {
    log.info("Snapshot request");
    var shortStreamName = req.query.id;
    var currentSnapshot = snapshot.getSnapshot(shortStreamName);
    // TODO
    //this.sendResponse(res, 200, {data: currentSnapshot});
    //log.info("Snapshot sent");
};

Router.prototype.canPublish = function (req, res) {
    log.info("canPublish request");
    var streamName = req.query.streamName;
    //var sessionid = req.query.sessionid;

    var allowed = false;
    if (this.rejecter.canPublish(streamName)){
        allowed = true;
        log.info("canPublish allowed");
        activeStreamManager.confirmStream(streamName)
    } else {
        log.info("canPublish rejected");
    }
    this.sendResponse(res, 200, this.formDataObject({"allowed": allowed}));
};

Router.prototype.canPlay = function (req, res) {
    log.info("canPlay request");
    var streamName = req.query.streamName;
    var sessionId = req.query.sessionid;

    var allowed = false;
    if (this.rejecter.canPlay(streamName)){
        allowed = true;
        log.info("canPlay allowed");
        activeStreamManager.confirmSubscription(streamName, sessionId);
    } else {
        log.info("canPlay rejected");
    }
    this.sendResponse(res, 200, this.formDataObject({"allowed": allowed}));
};

Router.prototype.stopPlay = function (req, res) {
    log.info("stopPlay request");
    var streamName = req.query.streamName;
    var sessionId = req.query.sessionid;
    activeStreamManager.unsubscribeUser({streamName: streamName, wowzaSession: sessionId});
};

Router.prototype.stopPublish = function (req, res) {
    log.info("stopPublish request");
    var streamName = req.query.streamName;
    //var sessionId = req.query.sessionid;
    activeStreamManager.unpublish(streamName);
};
