"use strict";
const config = require('../config.json');

const NameGenerator = require('./name-generator');
const nameGenerator = new NameGenerator();

const snapshot = require('./snapshot-cache');
const log = require('./logger');

class Router {
    constructor (activeStreamManager, storage) {
        this.activeStreamManager = activeStreamManager;
        var Rejecter = require('./rejecter');
        this.rejecter = new Rejecter(storage);
        log.info("router inited");
    }

    sendResponse (res, code, data) {
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
    }

    publishRequest (req, res) {
        log.info("publish request");
        if (this.rejecter.publishAllowed()){
            var data = this.activeStreamManager.publish();
            this.sendResponse(res, 200, data);
            log.info("publish request sent ok response");
        } else {
            this.sendResponse(res, 400, "publish request rejected");
            log.info("publish request sent error response");
        }
    }

    playRequest (req, res) {
        log.info("play request");
        var shortStreamName = req.query.id;
        if (this.rejecter.playAllowed(shortStreamName)){
            var salt = nameGenerator.generateSalt();
            var streamName = this.activeStreamManager.subscribe(shortStreamName, salt, (req.query.preview=="true"));
            this.sendResponse(res, 200, {streamUrl: config.streamUrl, streamName: streamName});
            log.info("play request sent ok response");
        } else {
            this.sendResponse(res, 400, "play request rejected");
            log.info("play request sent error response");
        }
    }

    getStreams (req, res) {
        log.info("Streams list request");
        var streamsList = this.activeStreamManager.getActiveStreams();
        this.sendResponse(res, 200, streamsList);
        log.info("Streams list sent");
    };

    getSnapshot (req, res) {
        log.info("Snapshot request");
        var shortStreamName = req.query.id;
        let snapshotFile = `${config.snapshotPath}/${shortStreamName}.png`;
        try {
            res.sendfile(snapshotFile);
            log.info("Snapshot sent");
        } catch (err) {
            log.info("Snapshot don't sent, error", err);
        }
    }

    canPublish (req, res) {
        log.info("canPublish request", req.originalUrl);
        var streamName = req.query.streamName;
        var allowed = false;
        if (this.rejecter.canPublish(streamName)){
            allowed = true;
            log.info("canPublish allowed");
            this.activeStreamManager.confirmStream(streamName);
        } else {
            log.info("canPublish rejected");
        }
        this.sendResponse(res, 200, {"allowed": allowed});
    }

    canPlay (req, res) {
        log.info("canPlay request", req.originalUrl);
        var streamName = req.query.streamName;
        var sessionId = req.query.sessionid;

        var allowed = false;
        if (this.rejecter.canPlay(streamName, sessionId)){
            allowed = true;
            log.info("canPlay allowed");
            this.activeStreamManager.confirmSubscription(streamName, sessionId);
        } else {
            log.info("canPlay rejected");
        }
        this.sendResponse(res, 200, {"allowed": allowed});
    }

    stopPlay (req, res) {
        log.info("stopPlay request", req.originalUrl);
        this.activeStreamManager.unsubscribeUser({
            streamName: req.query.streamName, wowzaSession: req.query.sessionid
        });
    }

    stopPublish (req, res) {
        log.info("stopPublish request", req.originalUrl);
        var streamName = req.query.streamName;
        //var sessionId = req.query.sessionid;
        this.activeStreamManager.unpublish(streamName);
    }

}

module.exports = Router;

/*
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
        this.sendResponse(res, 200, {streamUrl: config.streamUrl, streamName: streamName});
        log.info("play request sent ok response");
    } else {
        this.sendResponse(res, 400, "play request rejected");
        log.info("play request sent error response");
    }
};

Router.prototype.getStreams = function (req, res) {
    log.info("Streams list request");
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
    log.info("canPublish request", req.originalUrl);
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
    log.info("canPlay request", req.originalUrl);
    var streamName = req.query.streamName;
    var sessionId = req.query.sessionid;

    var allowed = false;
    if (this.rejecter.canPlay(streamName, sessionId)){
        allowed = true;
        log.info("canPlay allowed");
        this.activeStreamManager.confirmSubscription(streamName, sessionId);
    } else {
        log.info("canPlay rejected");
    }
    this.sendResponse(res, 200, {"allowed": allowed});
};

Router.prototype.stopPlay = function (req, res) {
    log.info("stopPlay request", req.originalUrl);
    var streamName = req.query.streamName;
    var sessionId = req.query.sessionid;
    this.activeStreamManager.unsubscribeUser({streamName: streamName, wowzaSession: sessionId});
};

Router.prototype.stopPublish = function (req, res) {
    log.info("stopPublish request", req.originalUrl);
    var streamName = req.query.streamName;
    //var sessionId = req.query.sessionid;
    this.activeStreamManager.unpublish(streamName);
};

*/