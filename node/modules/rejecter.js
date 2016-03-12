"use strict";

const config        = require('../config.json');
const log           = require('./logger');

class Rejecter {

    constructor (storage) {
        this.storage            = storage;
        this.publishingSlots    = config.quotes["publishing-N"];
        this.subscribersSlots   = config.quotes["streaming-N"];
        log.info(`Rejecter initialized. Quotes are: publishing: ${this.publishingSlots}; subscribing: ${this.subscribersSlots};`);
    }

    publishAllowed () {
        return (this.storage) ? (this.storage.getStreamsAmount() < this.publishingSlots) : false;
    }
    
    playAllowed (streamName) {
        let streamData = this.storage.getStreamData(streamName);
        return (streamData) ? (streamData.subscribers.length < this.subscribersSlots) : false;
    }
    
    canPublish (saltedStreamName, wowzaSession) {
        let request = this.splitSaltedName(saltedStreamName);
        let streamData = this.storage.getStreamData(request.name);
        return (streamData) ? (streamData.streamSalt == request.salt) : false;
    }

    canPlay (saltedStreamName) {
        let request = this.splitSaltedName(saltedStreamName);
        
        let subscriberData = this.storage.getSubscriberData(request.name, request.salt);
        if (!subscriberData || subscriberData.wowzaSession) {
            return false;
        }
        
        return true;
    }

    splitSaltedName (saltedName) {
        let slises = saltedName.split('_', 2);
        let dashIdx = slises[0].indexOf('-');
        if (dashIdx >= 0) {
            slises[0] = slises[0].substr(dashIdx+1);
        }
        return {
            name : slises[0],
            salt : slises[1]
        }
    }
}
module.exports = Rejecter;


// TESTING COURT
// const StreamStorage = require('./stream-storage');
// let storage = new StreamStorage();
// let streamData1 = {
//     streamName  : "name1",
//     streamSalt  : "salt1"   
// };
// storage.addStream(streamData1);

// let rejecter = new Rejecter(storage);
// console.log(rejecter.publishAllowed());
// console.log(rejecter.playAllowed('name1'));
