"use strict";

const config = require('../../config.json');

class Rejecter {

    constructor (storage) {
        this.storage            = storage;
        this.publishingSlots    = config.quotes["publishing-N"];
        this.subscribersSlots   = config.quotes["streaming-N"];
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
        // let request = this.splitSaltedName(saltedStreamName);
        // let streamData = this.storage.getStreamData(request.name);
        // if ()
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