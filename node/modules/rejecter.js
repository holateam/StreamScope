"use strict";

const config = require('../config.json');
const log = require('./logger');

class Rejecter {

    constructor (storage) {
        this.storage            = storage;
        this.publishingSlots    = config.quotes["publishing-N"];
        this.subscribersSlots   = config.quotes["streaming-N"];
        log.info(`Rejecter initialized. Quotes are: publishing: ${this.publishingSlots}; subscribing: ${this.subscribersSlots};`);
    }

    publishAllowed () {
        return this.storage.getStreamsAmount() < this.publishingSlots;
    }
    
    playAllowed (streamName) {
        let streamData = this.storage.getStreamData(streamName);
        return (streamData) ? streamData.subscribers.length < this.subscribersSlotsx : false;
    }
    
    canPublish (saltedStreamName, wowzaSession) {
        let request = this.splitSaltedName(saltedStreamName);
        let streamData = this.storage.getStreamData(request.name);
        return streamData.streamSalt == request.salt;
    }

    canPlay (saltedStreamName, wowzaSession) {
        let request = this.splitSaltedName(saltedStreamName);
        
        let subscriberData = this.storage.getSubscriberData(request.name, request.salt);
        if (!subscriberData || subscriberData.wowzaSession) {
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
<<<<<<< HEAD
module.exports = Rejecter;
=======

module.exports = Rejecter;
>>>>>>> bcf8ea17c0cd01ea34cd0c154edf6f821df26801
