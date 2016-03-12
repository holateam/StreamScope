"use strict";
let sendRequest = require('./send-request.js');
const config = require('../config.json');
const log = require('./logger');
let NameGenerator = require('./name-generator');
let nameGenerator = new NameGenerator();

class ActiveStreamManager {
    constructor(storage) {
        this.storage = storage;
        this.activeStreams = {};
        this.activeUsers = {};
        this.pendingConfirmLifetime = config.timings["pendingConfirmLifetime-Sec"] * 1000;
        this.streamUrl = config.streamUrl;
        this.wowzaUrl = config.wowzaUrl;
        log.info(`Active stream manager initialized.`);
        this.initialize();
    }

    initialize() {
        Promise.resolve(sendRequest(this.wowzaUrl))
            .then((response)=> {
                if (response.statusCode == 200) {
                    let body = JSON.parse(response.body);
                    this.upDateStorage(body.data.streams);
                    log.info(`Response from ${this.wowzaUrl}: ${body}`);
                } else {
                    log.error(`On request on ${this.wowzaUrl} get statusCode: ${response.statusCode} statusMessage: ${response.statusMessage}`);
                }
            })
            .catch((error)=> {
                log.error(`On request on ${this.wowzaUrl} get ${error.toString()}`);
            });
    }

    publish(streamName, streamSalt, duration) {
        streamName = streamName || nameGenerator.generateName();
        streamSalt= streamSalt || nameGenerator.generateSalt();
        duration = duration || -1;
        let fullName = `${streamName}_${streamSalt}`;
        this.activeStreams[streamName] = {fullName: fullName, confirm: false};
        this.storage.addStream({streamName: streamName, streamSalt: streamSalt, duration: duration});
        setTimeout(this.removeUnconfirmedPublish.bind(this), this.pendingConfirmLifetime, streamName);
        log.info(`Initialize new publish with name: ${fullName}`);
        return {streamUrl: this.streamUrl, streamName: fullName};
    }

    confirmStream(fullName) {
        let streamName = this.splitPartFullName(fullName, 0);
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

    subscribe(streamName, sessionSalt, preveiw) {
        if (this.storage.subscribeUser(streamName, sessionSalt)) {
            this.activeUsers[streamName] = {salt: sessionSalt, confirm: false};
            setTimeout(this.removeUnconfirmedUser.bind(this), this.pendingConfirmLifetime, streamName, sessionSalt);
            log.info(`Initialize new subscribe on stream: ${streamName} for: ${sessionSalt}`);

            return (preveiw) ? `preview-${streamName}_${sessionSalt}` : `${streamName}_${sessionSalt}`;
        } else {
            log.info(`Reject initialize subscribe on unavailable stream: ${streamName}`);
        }
    }

    confirmSubscription(streamName, wowzaSession) {
        let pos = streamName.lastIndexOf('-');
        streamName = (pos >= 0) ? streamName.substr(pos + 1) : streamName;
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
            log.error(`Unable to find matches to stream: ${streamName} and ${(streamData.wowzaSession) ? streamData.wowzaSession : streamData.userSalt}`);
        }
    }

    getActiveStreams() {
        let activeStreamList = [];
        let streamList = this.storage.getAllStreams();
        for (let stream of streamList) {
            if (this.activeStreams[stream.streamName].confirm) {
                let duration = (stream.duration) ? stream.duration : -1;
                let liveTime = (stream.publishTime) ? ((new Date()).getTime() - stream.publishTime)/1000 : -1;
                activeStreamList.push({name: this.activeStreams[stream.streamName].fullName, duration: duration, liveTime: liveTime});
            }
        }
        return {streams: activeStreamList};
    }

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


    upDateStorage(streams) {
        streams.forEach((stream)=> {
            let streamSalt = this.splitPartFullName(stream.id, 1);
            this.publish(stream.streamName, streamSalt);
            this.confirmStream(stream.id, stream.durationSec);
            stream.connections.forEach((user)=> {
                this.subscribeUser(stream.streamName, user.sessionId);
                this.confirmSubscription(`${stream.streamName}_${user.sessionId}`, user.ip);
            });
        });
        log.info(`Up-date stream storage`);
    }
}

module.exports = ActiveStreamManager;