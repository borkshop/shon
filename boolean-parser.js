'use strict';

var ValueParser = require('./value-parser');

function BooleanParser(name, def) {
    this.name = name;
    this.default = def || false;
}

BooleanParser.prototype = Object.create(ValueParser.prototype);
BooleanParser.prototype.constructor = BooleanParser;

BooleanParser.prototype.parse = function parse(cursor, delegate, context) {
    context[this.name] = !this.default;
};

module.exports = BooleanParser;
