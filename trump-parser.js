'use strict';

function TrumpParser(args) {
    this.value = args.name;
    this.collector = args.collector;
}

TrumpParser.prototype.parse = function parse(iterator, delegate, flag) {
    delegate.trumped = this.value;
    return false;
};

module.exports = TrumpParser;
