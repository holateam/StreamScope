"use strict";
var config = require('../config.json');

var NameGenerator = require('./name-generator');
var nameGenerator = new NameGenerator();

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
    if (typeof data=="string") { // error msg
        res.statusMessage = data;
        res.status(code).json({error: {code: code, message: data}, version: config.version});
    } else {
        res.status(code).json({data: data, version: config.version});
    }
    res.end();
    log.info("send response", code, data)
};

Router.prototype.publishRequest = function (req, res) {
    log.info("publish request");
    if (this.rejecter.publishAllowed()){
        var data = this.activeStreamManager.publish();
        this.sendResponse(res, 200, data);
        log.info("publish request sent ok response");
    } else {
        this.sendResponse(res, 400, "publish request rejected");
        log.info("publish request sent error response");
    }
};

Router.prototype.playRequest = function (req, res) {
    log.info("play request");
    var shortStreamName = req.query.id;
    if (this.rejecter.playAllowed(shortStreamName)){
        var salt = nameGenerator.generateSalt();
        var streamName = this.activeStreamManager.subscribe(shortStreamName, salt, (req.query.preview=="true"));
        //    shortStreamName + "_" + salt;
        //if (req.query.preview == "true"){
        //    streamName = "preview-"+streamName;
        //}
        //this.activeStreamManager.subscribeUser(shortStreamName, salt);
        this.sendResponse(res, 200, {streamUrl: config.streamUrl, streamName: streamName});
        log.info("play request sent ok response");
    } else {
        this.sendResponse(res, 400, "play request rejected");
        log.info("play request sent error response");
    }
};

Router.prototype.getStreams = function (req, res) {
    log.info("Streams list request");
    /*Promise.resolve(this.activeStreamManager.getActiveStreams())
        .then((streamsList)=> {this.sendResponse(res, 200, this.formDataObject(streamsList));})
        .catch(console.log.bind(console));*/

    var streamsList = this.activeStreamManager.getActiveStreams();
    this.sendResponse(res, 200, streamsList);
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
        this.activeStreamManager.confirmStream(streamName);
    } else {
        log.info("canPublish rejected");
    }
    this.sendResponse(res, 200, {"allowed": allowed});
};

Router.prototype.canPlay = function (req, res) {
    log.info("canPlay request");
    var streamName = req.query.streamName;
    var sessionId = req.query.sessionid;

    var allowed = false;
    if (this.rejecter.canPlay(streamName)){
        allowed = true;
        log.info("canPlay allowed");
        this.activeStreamManager.confirmSubscription(streamName, sessionId);
    } else {
        log.info("canPlay rejected");
    }
    this.sendResponse(res, 200, {"allowed": allowed});
};

Router.prototype.stopPlay = function (req, res) {
    log.info("stopPlay request");
    var streamName = req.query.streamName;
    var sessionId = req.query.sessionid;
    this.activeStreamManager.unsubscribeUser({streamName: streamName, wowzaSession: sessionId});
};

Router.prototype.stopPublish = function (req, res) {
    log.info("stopPublish request");
    var streamName = req.query.streamName;
    //var sessionId = req.query.sessionid;
    this.activeStreamManager.unpublish(streamName);
};
