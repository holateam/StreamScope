"use strict";
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
const log = require('./logger');

function sendRequest(uri){
    let response = {};
    return Promise.resolve(request(
        {
            method: 'GET',
            uri: uri
        }))
    .then((incomingMsg)=>{
        response.statusCode = incomingMsg.statusCode;
        response.statusMessage = incomingMsg.statusMessage;
        response.body = incomingMsg.body;
        return response;
    })
    .catch((error)=>{
        log.error(`On request on ${uri} get ${error}`);
        throw new Error(error);
    });
}


module.exports = sendRequest;
