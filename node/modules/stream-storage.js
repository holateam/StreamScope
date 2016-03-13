"use strict";

Array.prototype.fastRemove = function(idx) {
	let last = this.length - 1;
	this[idx] = this[last];
	this.pop();
}

class StreamStorage {

	constructor () {
		this.streams = [];
	}

	addStream (streamData) {

		if (!streamData.streamName) {
			throw Error('streamData.streamName option must be defined. Aborting.');
		} else if (!streamData.streamSalt) {
			throw Error('streamData.streamSalt option must be defined. Aborting.');
		}

		let stream = {
			streamName	: streamData.streamName,
			streamSalt	: streamData.streamSalt,
			subscribers	: [],
			pubishTime	: (new Date()).getTime()
		};

		this.streams.push(stream);
	}

	removeStream (streamName) {

		let streamIdx = this.findStream(streamName);
		if (streamIdx < 0) {
			return false;
		}

		this.streams.fastRemove(idx);
		return true;

	}

	getStreamData (streamName) {

		let streamIdx = this.findStream(streamName);
		if (streamIdx < 0) {
			return null;
		}

		return this.streams[streamIdx];

	}

	subscribeUser(streamName,  wowzaSession, sessionSalt) {

		let streamIdx = this.findStream(streamName);
		if (streamIdx < 0) {
			return false;
		}

		let subscriber = {
			wowzaSession	: wowzaSession,
			sessionSalt		: sessionSalt
		};
		this.streams[streamIdx].subscribers.push(subscriber);
		return true;

	}

	unsubscribeUser(streamName, wowzaSession) {

		let streamIdx = this.findStream(streamName);
		if (streamIdx < 0) {
			return false;
		}

		for (let idx in this.streams[streamIdx].subscribers) {
			if (this.streams[streamIdx].subscribers[idx].wowzaSession == wowzaSession) {
				this.streams[streamIdx].subscribers.fastRemove(idx);
				return true;
			}
		}

		return false;
		
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
// 	streamName 	: "name1",
// 	streamSalt	: "salt1"	
// };
// let streamData2 = {
// 	streamName 	: "name2",
// 	streamSalt	: "salt2"	
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