'use strict';

var SHON = require('./shon');

function ShonParser(name, collector) {
    this.name = name;
    this.collector = collector;
}

ShonParser.prototype.parse = function parse(iterator, delegate) {
    var value = SHON.parseValue(iterator.cursor, delegate);
    if (delegate.isDone()) {
        return false;
    }
    return this.collector.collect(value, iterator, delegate);
};

module.exports = ShonParser;
