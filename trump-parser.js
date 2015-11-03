'use strict';

function TrumpParser(value, collector) {
    this.value = value;
    this.collector = collector;
}

TrumpParser.prototype.parse = function parse(iterator, delegate, flag) {
    delegate.exitCode = 1;
    delegate.trumped = this.value;
};

module.exports = TrumpParser;
