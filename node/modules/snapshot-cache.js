"use strict";

const config        = require('../config.json');
const log           = require('./logger');
const cp            = require('child_process');

class SnapshotCache {

    constructor (targetStreamsSource) {
        if (!targetStreamsSource) {
            throw Error('SnapshotCache: constructor: targetStreamsSource parameter nust pe specified');
        }
        this.enabled = false;
        this.snapshotInterval = config.timings['snapshotLifetime-Sec'] * 1000;
        this.targetStreamsSource = targetStreamsSource;
        log.info('StapshotCache initialized');
        log.info(this.targetStreamsSource);
    }

    start () {
        setInterval(
            this.cacheSourceStreams,
            this.snapshotInterval
        );
        log.info(`StapshotCache is starting with interval: ${this.snapshotInterval}`);
    }

    cacheSourceStreams () {
        log.info('StapshotCache: caching called');
        let streams = this.targetStreamsSource().data;
        for (let idx in streams) {
            cacheSingleStream(streams[idx].name);
        }
    }

    cacheSingleStream (streamName) {
        let command = `scrot '${streamName}.png' -e 'mv $f ~/Desktop/'`;
        Promise.resolve(cp.exec(command))
            .then(() => {
                log.info(`StapshotCache: ${streamName} is cached`);
            })
            .catch((e) => {
                log.error(`Error occured while catching stream: ${e} Stacktrace: ${e.stack}`);
            });
    }

}

// TESTING COURT

// const StreamStorage = require('./stream-storage');
// const ActiveStreamManager = require('./active-stream-manager');

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
// storage.subscribeUser('name1', 'session1', 'salt11');
// storage.subscribeUser('name1', 'session2', 'salt12');
// storage.subscribeUser('name1', 'session3', 'salt13');
// storage.subscribeUser('name2', 'session4', 'salt21');
// storage.subscribeUser('name3', 'session5', 'salt31');
// console.log(JSON.stringify(storage));
// storage.unsubscribeUser('name1', 'session2');
// console.log(JSON.stringify(storage.getStreamData('name1')));

// let manager = new ActiveStreamManager(storage);
// let cacher = new SnapshotCache(manager.getActiveStreams.bind(manager));
// cacher.start();