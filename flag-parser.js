'use strict';

function FlagParser(args) {
    this.value = args.value;
    this.collector = args.collector;
}

FlagParser.prototype.parse = function parse(iterator, delegate, flag) {
    return this.collector.collect(this.value, iterator, delegate);
};

module.exports = FlagParser;
