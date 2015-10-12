'use strict';

function FlagParser(value, collector) {
    this.value = value;
    this.collector = collector;
}

FlagParser.prototype.parse = function parse(cursor, delegate) {
    this.collector.collect(this.value, delegate);
};

module.exports = FlagParser;
