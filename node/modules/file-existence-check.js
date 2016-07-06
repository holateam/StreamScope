"use strict";
const Promise = require('bluebird');
const statAsync = Promise.promisify(require('fs').stat);
const config = require('../config.json');
const log = require('./logger');

function existenceCheck(file){
    return Promise.resolve(statAsync(file))
    .then((stat)=>{
        log.info('Snapshot exists');
        return stat;
    })
    .catch((error)=>{
        log.info('Snapshot does not exist at the moment');
        return Promise.resolve(delay(config.timings['snapshotLifetime-Sec']*1000)).then(()=>{
            return error;
        });
    });
}


function delay(milliseconds){
    return Promise.delay(milliseconds);
}

module.exports = existenceCheck;
