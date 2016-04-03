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

        console.log("Current subscribers:");
        for (let idx in streamData.subscribers) {
            console.log(idx, streamData.subscribers[idx]);
            console.log("idx: ", idx);
            console.log("data: ", streamData.subscribers[idx]);
            if (streamData.subscribers[idx].sessionSalt == sessionSalt) {
                console.log("List of subscribers finished. Salt found!");
                return {
                    id : idx,
                    salt : streamData.subscribers[idx].streamSalt,
                    wowzaId : streamData.subscribers[idx].wowzaId
                }
            }
        }
        console.log("List of subscribers finished, required salt not found: "+sessionSalt);

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
            console.log("unsubscribeUser: stream not found", options.streamName);
            return false;
        }

        let criterion = (options.wowzaSession) ? options.wowzaSession : options.userSalt;
        console.log("unsubscribe criterion", criterion);
        for (let idx in this.streams[streamIdx].subscribers) {
            let subscriber = this.streams[streamIdx].subscribers[idx];
            let currentValue = (options.wowzaSession) ? subscriber.wowzaSession : subscriber.userSalt;
            console.log("unsubscribe currentValue", currentValue);
            if (criterion == currentValue) {
                this.streams[streamIdx].subscribers.fastRemove(idx);
                console.log("unsubscribe found!");
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
        //for (let idx in this.streams) {
        //    if (this.streams[idx].streamName == streamName) {
        //        return idx;
        //    }
        //}
        for(var i=0; i<this.streams.length; i++){
            if (streamName.indexOf(this.streams[i].streamName)>-1){
                return i;
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
// storage.confirmStream("name1");
// storage.confirmStream("name2");
// console.log("--------\n",JSON.stringify(storage),"--------\n");
// // storage.subscribeUser('name1', 'salt1');
// storage.subscribeUser('name1', 'salt2');
// // storage.subscribeUser('name1', 'salt3');
// // storage.subscribeUser('name2', 'salt4');
// // storage.confirmSubscription('name1', 'salt1', 'sess1');
// storage.confirmSubscription('name1', 'salt2', 'sess2');
// // storage.confirmSubscription('name1', 'salt3', 'sess3');
// // storage.confirmSubscription('name2', 'salt4', 'sess4');
// console.log("--------\n",JSON.stringify(storage),"--------\n");
// storage.unsubscribeUser({streamName: 'name1', wowzaSession: 'sess2'});
// console.log("--------\n",JSON.stringify(storage),"--------\n");

