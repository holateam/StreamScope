"use strict";

const config = require('../../config.json');
const log = require('./logger');

class Rejecter {

    constructor (storage) {
        this.storage            = storage;
        this.publishingSlots    = config.quotes["publishing-N"];
        this.subscribersSlots   = config.quotes["streaming-N"];
        log.info(`Rejecter initialized. Quotes are: publishing: ${this.publishingSlots}; subscribing: ${this.subscribersSlots};`);
    }

    publishAllowed () {
        if (this.storage.getStreamsAmount() >= this.publishingSlots) {
            return false;
        } else {
            return true;
        }
    }

    canPublish (saltedStreamName, wowzaSession) {
        let request = this.splitSaltedName(saltedStreamName);
        let streamData = this.storage.getStreamData(request.name);
        return streamData.streamSalt == request.salt;
    }

    canPlay (saltedStreamName, wowzaSession) {
        let request = this.splitSaltedName(saltedStreamName);
        let streamData = this.storage.getStreamData(request.name);
        
        if (streamData.subscribers.length >= this.subscribersSlots) {
            return false;
        }
        
        let subscriberData = this.storage.getSubscriberData(request.name, request.salt);
        if (subscriberData.wowzaSession) {
            return false;
        }
        
        return true;
    }

    splitSaltedName (saltedName) {
        let slises = saltedName.split('_',2);
        return {
            name : slises[0],
            salt : slises[1]
        }
    }
}
