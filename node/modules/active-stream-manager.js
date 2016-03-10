"use strict";

let StreamStorage = require('./modules/stream-storage.js');
let nameGenerator = require('./modules/name-generator');
let Rejector = require('./modules/rejector');
const config = require('../../config.json');
let storage = new StreamStorage();
let rejector = new Rejector(storage);

class ActiveStreamManager() {
    constructor() {
        this.activeStreams = {};
        this.timeInitialize = [];
        this.pendingPublishLifetime = config.quotes[""];
    }

    publish() {
        if (rejector.publishAllowed()) {
            let streamName = nameGenerator.generateName();
            let streamSalt= nameGenerator.generateSalt();
            let fullName = `${streamName}_${streamSalt}`;
            let timeInitialize = Date.now();
            this.activeStreams[streamName] = {fullName: fullName, state: "initialize"};
            this.timeInitialize.push({streamName: streamName, time: timeInitialize});
            storage.addStream({streamName: streamName, streamSalt: streamSalt});
            return fullName;
        } else if ((Date.now() - this.timeInitialize[0].time) > this.pendingPublishLifetime) {
            this.unpublish(this.timeInitialize[0].streamName);
            this.timeInitialize.shift();
            return this.publish();
        } else {
            return false;
        }

    }

    confirmStream(streamData) {
        if (rejector.canPublish(streamData)) {
            storage.confirmStream(streamData);
            this.activeStreams[streamData.streamName].state = "confirm";
            for (let i = 0; i < this.timeInitialize.length; i++) {
                if (this.timeInitialize[i].streamName == streamData.streamName) {
                    this.timeInitialize.splice(i, 1);
                    break;
                }
            }
            return {"data": { "allowed" : true } } ;
        } else {
            return {"data": { "allowed" : false } } ;
        }
    }

    unpublish(streamName) {
        storage.removeStream(streamName);
        delete this.activeStreams[streamName];
    }

    subscribe(streamName, wowzaStreamSession) {
        if (rejector.canPlay(streamName, wowzaStreamSession)) {
            storage.subscribeUser(streamName, wowzaStreamSession);
            return {"data": { "allowed" : true } } ;
        } else {
            return {"data": { "allowed" : false } } ;
        }
    }

    unsubscribe(streamName, wowzaStreamSession) {
        storage.unsubscribeUser(streamName, wowzaStreamSession);
    }
}

module.exports = ActiveStreamManager;
