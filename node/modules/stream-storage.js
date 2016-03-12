"use strict";

Array.prototype.fastRemove = function(idx) {
    let last = this.length - 1;
    this[idx] = this[last];
    this.pop();
}

const log = require('./logger');

class StreamStorage {

    constructor () {
        this.streams = [];
        log.info('StreamStorage initialized');
    }

    addStream (streamData) {

        if (!streamData.streamName) {
            throw Error('streamData.streamName option must be defined. Aborting.');
        } else if (!streamData.streamSalt) {
            throw Error('streamData.streamSalt option must be defined. Aborting.');
        }
        
        log.info(`StreamStorage: adding new stream: ${streamData.streamName}_${streamData.streamSalt}`);
        this.streams.push({
            streamName  : streamData.streamName,
            streamSalt  : streamData.streamSalt,
            subscribers : [],
            publishTime : 0,
            duration    : streamData.duration || 0
        });
    }

    removeStream (streamName) {

        let streamIdx = this.findStream(streamName);
        if (streamIdx < 0) {
            return false;
        }
        
        log.info(`StreamStorage: removing stream: ${streamName}`);
        this.streams.fastRemove(streamIdx);
        return true;

    }

    getAllStreams () {
        return this.streams;
    }

    getStreamData (streamName) {

        let streamIdx = this.findStream(streamName);
        if (streamIdx < 0) {
            return null;
        }

        return this.streams[streamIdx];

    }

    getSubscriberData (streamName, sessionSalt) {
        
        let streamData = this.getStreamData(streamName);
        if (!streamData) {
            return null;
        }
        
        for (let idx in streamData.subscribers) {
            console.log(idx, streamData.subscribers[idx]);
            if (streamData.subscribers[idx].sessionSalt == sessionSalt) {
                return {
                    id : idx,
                    salt : streamData.subscribers[idx].streamSalt,
                    wowzaId : streamData.subscribers[idx].wowzaId
                }
            }
        }
        
        return null;
        
    }

    subscribeUser(streamName, sessionSalt) {

        let streamIdx = this.findStream(streamName);
        if (streamIdx < 0) {
            return false;
        }

        log.info(`StreamStorage: subscribing new user to: ${streamName}`);
        this.streams[streamIdx].subscribers.push({
            wowzaSession    : null,
            sessionSalt     : sessionSalt
        });
        return true;

    }
    
    confirmSubscription(streamName, sessionSalt, wowzaSession) {
        
        let streamIdx = this.findStream(streamName);
        if (streamIdx < 0) {
            return false;
        }

        let subscriberData = this.getSubscriberData(streamName, sessionSalt);
        if (!subscriberData) {
            return false;
        }
        
        this.streams[streamIdx].subscribers[subscriberData.id].wowzaSession = wowzaSession;
        return true;
            
    }
    
    unsubscribeUser(options) {
        
        if (!options) {
            log.error('Options object must be spesified');
            return false;
        }
        
        if (!options.wowzaSession && !options.userSalt) {
            log.error('At least one of wowzaSession or optionsuserSalt option must be specified');    
        }
        
        let streamIdx = this.findStream(options.streamName);
        if (streamIdx < 0) {
            return false;
        }
        
        let criterion = (options.wowzaSession) ? options.wowzaSession : options.userSalt;
        for (let idx in this.streams[streamIdx].subscribers) {
            let subscriber = this.streams[streamIdx].subscribers[idx];
            let currentValue = (options.wowzaSession) ? subscriber.wowzaSession : subscriber.userSalt;
            if (criterion == currentValue) {
                this.streams[streamIdx].subscribers.fastRemove(idx);
                return true;
            }
        }

        return false;
        
    }

    getStreamsAmount() {
        return this.streams.length;
    }

    confirmStream(streamName) {

        let streamIdx = this.findStream(streamName);
        if (streamIdx < 0) {
            return false;
        }
        
        if (this.streams[streamIdx].duration > 0) {
            return false;
        }
        
        log.info(`StreamStorage: stream ${streamName} is confirmed`);
        this.streams[streamIdx].publishTime = (new Date()).getTime();
        return true;

    }

    findStream(streamName) {
        for (let idx in this.streams) {
            if (this.streams[idx].streamName == streamName) {
                return idx;
            }
        }
        return -1;
    }

}
module.exports = StreamStorage;

// TESTING COURT
// let storage = new StreamStorage();
// let streamData1 = {
//  streamName  : "name1",
//  streamSalt  : "salt1"   
// };
// let streamData2 = {
//  streamName  : "name2",
//  streamSalt  : "salt2"   
// };

// storage.addStream(streamData1);
// storage.addStream(streamData2);
// console.log(JSON.stringify(storage));
// storage.subscribeUser('name1', 'session1');
// storage.subscribeUser('name1', 'session2');
// storage.subscribeUser('name1', 'session3');
// storage.subscribeUser('name2', 'session4');
// storage.subscribeUser('name3', 'session5');
// console.log(JSON.stringify(storage));
// storage.unsubscribeUser('name1', 'session2');
// console.log(JSON.stringify(storage.getSubscriberData('name1', 'session3')));
