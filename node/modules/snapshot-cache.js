"use strict";

const Promise       = require('bluebird');
const config        = require('../config.json');
const log           = require('./logger');
const NameGenerator = require('./name-generator');
const nameGenerator = new NameGenerator();
const cpExecAsync   = Promise.promisify(require('child_process').exec);

class SnapshotCache {

    constructor (activeStreamManager) {
        if (!activeStreamManager) {
            throw Error('SnapshotCache: constructor: activeStreamManager parameter must pe specified');
        }
        this.enabled = false;
        this.snapshotInterval = config.timings['snapshotLifetime-Sec'] * 1000;
        this.activeStreamManager = activeStreamManager;
        log.info('StapshotCache initialized');
    }

    start () {
        setInterval(
            this.cacheSourceStreams.bind(this),
            this.snapshotInterval
        );
        log.info(`StapshotCache is starting with interval: ${this.snapshotInterval}`);
    }

    cacheSourceStreams () {
        log.info('StapshotCache: caching called');
        let streams = this.activeStreamManager.getActiveStreams().streams;
        log.info(`StapshotCache: Initialising caching of ${streams.length} streams`);
        for (let idx = 0; idx < streams.length; idx++) {
            log.info(`StapshotCache: caching ${streams[idx].name}`);
            this.cacheSingleStream(streams[idx].name);
        }
    }

    cacheSingleStream (streamName) {

        let salt         = nameGenerator.generateSalt();
        let streamUrl    = `${config.streamUrl}/${streamName}_${salt}`;
        let snapshotFile = `${config.snapshotPath}/${streamName}.png`;
        let command      = `ffmpeg -y -timelimit 10 -i ${streamUrl} -vframes 1 ${snapshotFile}`;

        this.activeStreamManager.subscribe(streamName, salt);
        this.activeStreamManager.lastSnapshotStreamName = streamUrl;
        Promise.resolve(cpExecAsync(command))
            .then((param) => {
                console.log("Param!", param);
                log.info(`StapshotCache: ${streamName} is cached`);
            })
            .catch((e) => {
                log.error(`Error occured while catching stream: ${e} Stacktrace: ${e.stack}`);
            });

    }

}

module.exports = SnapshotCache;

// TESTING COURT
/*
const StreamStorage = require('./stream-storage');
const ActiveStreamManager = require('./active-stream-manager');

let storage = new StreamStorage();
let streamData1 = {
 streamName  : "name1",
 streamSalt  : "salt1"   
};
let streamData2 = {
 streamName  : "name2",
 streamSalt  : "salt2"   
};

// storage.addStream(streamData1);
// storage.addStream(streamData2);
// console.log(JSON.stringify(storage));
// storage.subscribeUser('name1', 'session1', 'salt11');
// storage.subscribeUser('name1', 'session2', 'salt12');
// storage.subscribeUser('name1', 'session3', 'salt13');
// storage.subscribeUser('name2', 'session4', 'salt21');
// storage.subscribeUser('name3', 'session5', 'salt31');
// console.log(JSON.stringify(storage));
// // storage.unsubscribeUser('name1', 'session2');
// console.log(JSON.stringify(storage.getStreamData('name1')));

let manager = new ActiveStreamManager(storage);
manager.publish('name1', 'session1');
manager.confirmStream('name1_session1');

let cacher = new SnapshotCache(manager);
cacher.start();
*/
