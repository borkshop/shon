'use strict';

var ValueParser = require('./value-parser');

function CounterParser(name, delta) {
    this.name = name;
    this.delta = delta || 1;
}

CounterParser.prototype = Object.create(ValueParser.prototype);
CounterParser.prototype.constructor = CounterParser;

CounterParser.prototype.parse = function parse(cursor, delegate, context) {
    context[this.name] += this.delta;
};

module.exports = CounterParser;
