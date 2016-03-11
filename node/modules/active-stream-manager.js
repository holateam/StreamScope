"use strict";
let request = require('request');
let NameGenerator = require('./name-generator');
const config = require('../config.json');
let nameGenerator = new NameGenerator();
const log = require('./logger');

class ActiveStreamManager {
    constructor(storage) {
        this.storage = storage;
        this.activeStreams = {};
        this.activeUsers = {};
        this.pendingConfirmLifetime = config.timings.pendingConfirmLifetime * 1000;
        this.streamUrl = config.streamUrl;
        this.wowzaUrl = config.wowzaUrl;
        log.info(`Active stream manager initialized.`);
    }

    publish(streamName, streamSalt) {
        streamName = streamName || nameGenerator.generateName();
        streamSalt= streamSalt || nameGenerator.generateSalt();
        let fullName = `${streamName}_${streamSalt}`;
        this.activeStreams[streamName] = {fullName: fullName, confirm: false};
        this.storage.addStream({streamName: streamName, streamSalt: streamSalt});
        setTimeout(this.removeUnconfirmedPublish.bind(this), this.pendingConfirmLifetime, streamName);
        log.info(`Initialize new publish with name: ${fullName}`);
        return {streamUrl: this.streamUrl, streamName: fullName};
    }

    confirmStream(fullName) {
        let streamName = splitPartFullName(fullName, 0);
        if (this.storage.confirmStream(streamName)) {
            this.activeStreams[streamName].confirm = true;
            log.info(`Confirm publish: ${fullName}`);
        } else {
            log.error(`Unable to confirm publish stream: ${fullName}`);
        }

    }

    unpublish(streamName) {
        if (this.storage.removeStream(streamName)) {
            delete this.activeStreams[streamName];
            log.info(`Remove publish: ${streamName} from storage`);
        } else if (streamName in this.activeStreams) {
            delete this.activeStreams[streamName];
            log.info(`Remove publish: ${streamName} from manager`);
        }
    }

    subscribeUser(streamName, sessionSalt) {
        sessionSalt = sessionSalt || nameGenerator.generateSalt();
        if (this.storage.subscribeUser(streamName, sessionSalt)) {
            this.activeUsers[streamName] = {salt: sessionSalt, confirm: false};
            setTimeout(this.removeUnconfirmedUser.bind(this), this.pendingConfirmLifetime, streamName, sessionSalt);
            log.info(`Initialize new subscribe on stream: ${streamName} for: ${sessionSalt}`);
            return {streamUrl: config.streamUrl, streamName: `${streamName}_${sessionSalt}`};
        } else {
            log.info(`Reject initialize subscribe on unavailable stream: ${streamName}`);
            return { error: { code: 400, message: "Stream: ${streamName} is not available" }, version: config.version };
        }
    }

    confirmSubscription(streamName, wowzaSession) {
        let shortName = this.splitPartFullName(streamName, 0);
        let sessionSalt = this.splitPartFullName(streamName, 1);
        if (this.storage.confirmSubscription(shortName, sessionSalt, wowzaSession)) {
            this.activeUsers[shortName].confirm = true;
            log.info(`Confirm subscribe on stream: ${shortName} for: ${wowzaSession}`);
        } else {
            log.error(`Reject confirm subscription on stream: ${shortName} with sessionSalt ${sessionSalt}`);
        }
    }

    unsubscribeUser(streamData) {
        let streamName = streamData.streamName;
        if (this.storage.unsubscribeUser(streamData)) {
            delete  this.activeUsers[streamName];
            log.info(`Remove subscribe on stream: ${streamName} for: ${(streamData.wowzaSession) ? streamData.wowzaSession : streamData.userSalt}`);
        } else {
            log.error(`Unable to find matches to stream: ${shortName} and ${(streamData.wowzaSession) ? streamData.wowzaSession : streamData.userSalt}`);
        }
    }

   /* getActiveStreams() {
        request.get(this.wowzaUrl)
            .on('response', this.upDateStorage(data.streams))
            .on('error', this.reportError);
    }*/

    splitPartFullName (fullName, idx) {
        let slices = fullName.split('_' , 2);
        return slices[idx];
    }

    removeUnconfirmedPublish (streamName) {
        if (streamName in this.activeStreams && !this.activeStreams[streamName].confirm){
            this.unpublish(streamName);
        }
    }

    removeUnconfirmedUser (streamName, userSalt) {
        if (streamName in this.activeUsers && !this.activeUsers[streamName].confirm) {
            this.unsubscribeUser({streamName: streamName, userSalt: userSalt});
        }
    }


    /*upDateStorage(streams) {
        let streamsList = [];
        streams.forEach((stream)=> {
            let streamName = this.splitPartFullName(stream.streamName, 0);
            let streamSalt = this.splitPartFullName(stream.streamName, 1);
            this.publish(streamName, streamSalt);
            this.confirmStream(stream.streamName);
            stream.viewers.forEach((user)=> {
                this.subscribeUser(streamName);
                this.confirmSubscription(user.fullStreamName, user.sessionId);
            });
            streamsList.push({name: stream.streamName, duration: stream.durationSec, liveTime: -1});
        });
        log.info(`Return active streams list: ${streamsList};`);
        return {data: {streams: streamsList}};
    }

    reportError() {
        log.error(`Can not get information about active streams from ${this.wowzaUrl}`);
    }
*/
}

module.exports = ActiveStreamManager;