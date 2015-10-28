'use strict';

function FlagParser(value, collector) {
    this.value = value;
    this.collector = collector;
}

FlagParser.prototype.parse = function parse(iterator, delegate, flag) {
    this.collector.collect(this.value, iterator, delegate);
};

module.exports = FlagParser;
