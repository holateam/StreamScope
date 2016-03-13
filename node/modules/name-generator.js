"use strict";

const config = require('../../config.json');

class NameGenerator {

    constructor () {
        this.saltMin = config.ranges.saltMin;
        this.saltMax = config.ranges.saltMax;
    }

    generateIDs () {
        return this.generateName() + '_' + this.generateSalt();
    }

    generateSalt () {
        return '' + Math.random() * (this.saltMax - this.saltMin) + this.saltMin;
    }

    generateName () {
        return '' + (new Date()).getTime();
    }
}
module.exports = NameGenerator;