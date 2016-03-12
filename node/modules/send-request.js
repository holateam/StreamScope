"use strict";
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
const log = require('./logger');




function sendRequest (uri) {
    let response = {};
    return Promise.resolve(request(
        {
            method: 'GET',
            uri: uri
        }))
        .then((incomingMsg)=> {
            response.error = incomingMsg.error;
            response.statusCode = incomingMsg.statusCode;
            response.body = incomingMsg.body;
            return response;
        })
        .catch((error)=> {
            log.error(`On request on ${uri} get ${error}`);
        });
}



module.exports = sendRequest;
