'use strict';

var ShonParser = require('./shon-parser');

function JshonParser(args) {
    ShonParser.call(this, args);
}

JshonParser.prototype = Object.create(ShonParser.prototype);
JshonParser.prototype.constructor = JshonParser;
JshonParser.prototype.json = true;

module.exports = JshonParser;
