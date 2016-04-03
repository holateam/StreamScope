"use strict";

const config 		= require('../config');
const assert 		= require('assert');
const should 		= require('should');
const Rejecter 		= require('../modules/rejecter');
const Storage 		= require('../modules/stream-storage');

describe('Rejecter', function() {

	// ------------------------------------------------------- constructor
	describe('#constructor()', function () {

		it('should throw an error, when parameter is undefined', function () {
			(function(){ let rejecter = new Rejecter() }).should.throw();
		});

		it('should throw an error, when parameter is not a valid storage', function () {
			(function(){ let rejecter = new Rejecter(1, config) }).should.throw();
		});

		it('local qoutes are initialized by config parameter', function () {
			let storage = new Storage();
			let specConfig = { quotes : { 'publishing-N' : 99, 'streaming-N' : 88 } };
			let rejecter = new Rejecter(storage, specConfig);
			rejecter.should.have.property('publishingSlots');
			rejecter.should.have.property('subscribersSlots');
			(rejecter.publishingSlots).should.be.exactly(specConfig.quotes['publishing-N']);
			(rejecter.subscribersSlots).should.be.exactly(specConfig.quotes['streaming-N']);
		});

		it('should fallback to system-wide config when parameter is undefined', function () {
			let storage = new Storage();
			let rejecter = new Rejecter(storage);
			rejecter.should.have.property('publishingSlots');
			rejecter.should.have.property('subscribersSlots');
			(rejecter.publishingSlots).should.be.exactly(config.quotes['publishing-N']);
			(rejecter.subscribersSlots).should.be.exactly(config.quotes['streaming-N']);
		});

	});
	
	// ------------------------------------------------------- publishAllowed
	describe('#publishAllowed()', function() {

		it('returns TRUE, when number of stored units satisfies quotes', function () {
			let storage = new Storage();
			let specConfig = { quotes : { 'publishing-N' : 2, 'streaming-N' : 88 } };
			let rejecter = new Rejecter(storage, specConfig);
			let streamData = { streamName : '1', streamSalt : '2' };
			should(rejecter.publishAllowed()).be.ok();
			storage.addStream(streamData);
			should(rejecter.publishAllowed()).be.ok();
			storage.addStream(streamData);
			should(rejecter.publishAllowed()).not.be.ok();
		});

	});

	// ------------------------------------------------------- playAllowed
	describe('#playAllowed()', function() {

		it('checks, if the passed stream name registered in storage', function () {
			let storage = new Storage();
			let rejecter = new Rejecter(storage);
			should(rejecter.playAllowed('nonsence')).not.throw().and.not.be.ok();
		});
		
		it('returns TRUE, when number of subscribers to special unit satisfies quotes', function () {
			let storage = new Storage();
			let specConfig = { quotes : { 'publishing-N' : 2, 'streaming-N' : 2 } };
			let rejecter = new Rejecter(storage, specConfig);
			let streamData = { streamName : '1', streamSalt : '2' };
			storage.addStream(streamData);
			should(rejecter.playAllowed('1')).be.ok();
			storage.subscribeUser('1', '3');
			storage.subscribeUser('1', '4');
			should(rejecter.playAllowed('1')).not.be.ok();
		});

	});

	// ------------------------------------------------------- canPublish
	describe('#canPublish()', function() {

		it('checks, if the passed stream name registered in storage', function () {
			let storage = new Storage();
			let rejecter = new Rejecter(storage);
			should(rejecter.canPublish('nonsence_salt')).not.throw().and.not.be.ok();
		});

		it('TRUE -- passed stream name and salt are equal to stored', function () {
			let streamName = '123';
			let streamSalt = '456';
			let saltedName = streamName + '_' + streamSalt;
			let fakeSaltedName = streamName + '_789';
			let streamData = { streamName : streamName, streamSalt : streamSalt };
			let storage = new Storage();
			let rejecter = new Rejecter(storage);
			storage.addStream(streamData);
			should(rejecter.canPublish(fakeSaltedName)).not.be.ok();
			should(rejecter.canPublish(saltedName)).be.ok();
		});

	});

	// ------------------------------------------------------- canPlay
	describe('#canPlay()', function() {

		it('checks, if the passed stream name registered in storage', function () {
			let storage = new Storage();
			let rejecter = new Rejecter(storage);
			should(rejecter.canPlay('nonsence_salt')).not.throw().and.not.be.ok();
		});

		it('returns TRUE, if the passed salt was previously subscribed to a stream', function () {
			let streamName = '123';
			let streamSalt = '456';
			let subscriberSalt = '789';
			let saltedName = streamName + '_' + subscriberSalt;
			let fakeSaltedName = streamName + '_abc';
			let streamData = { streamName : streamName, streamSalt : streamSalt };
			let storage = new Storage();
			let rejecter = new Rejecter(storage);
			storage.addStream(streamData);
			storage.subscribeUser(streamName, subscriberSalt);
			should(rejecter.canPlay(fakeSaltedName)).not.be.ok();
			should(rejecter.canPlay(saltedName)).be.ok();
		});

		it('returns FALSE, someone is allready watching stream by passed salt', function () {
			let streamName = '123';
			let streamSalt = '456';
			let subscriberSalt = '789';
			let wowzaSession = 'abc';
			let saltedName = streamName + '_' + subscriberSalt;
			let streamData = { streamName : streamName, streamSalt : streamSalt };
			let storage = new Storage();
			let rejecter = new Rejecter(storage);
			storage.addStream(streamData);
			storage.subscribeUser(streamName, subscriberSalt);
			console.log(storage.confirmSubscription(streamName, subscriberSalt, wowzaSession));
			should(rejecter.canPlay(saltedName)).not.be.ok();
		});

	});
	
	// ------------------------------------------------------- splitSaltedName
	describe('#splitSaltedName()', function() {

		it('splits basically concatenated with `_` stream name and salt', function () {
			let storage = new Storage();
			let rejecter = new Rejecter(storage);
			let streamName = '123';
			let streamSalt = '456';
			let saltedName = streamName + '_' + streamSalt;
			(rejecter.splitSaltedName(saltedName)).should.be.eql({ name: streamName, salt: streamSalt });
		});

		it('ignores `preview-` prefix', function () {
			let storage = new Storage();
			let rejecter = new Rejecter(storage);
			let streamName = '123';
			let streamSalt = '456';
			let saltedName = 'preview-' + streamName + '_' + streamSalt;
			(rejecter.splitSaltedName(saltedName)).should.be.eql({ name: streamName, salt: streamSalt });
		});

	});
});