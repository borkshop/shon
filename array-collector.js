'use strict';

function ArrayCollector(args) {
    this.name = args.name;
    this.arg = args.arg;
    this.value = [];
    this.minLength = args.minLength || 0;
    this.maxLength = args.maxLength || Infinity;
    this.defaulter = args.defaulter;
    this.collected = false;
}

ArrayCollector.prototype.collect = function collect(value, iterator, delegate) {
    this.value.push(value);
    if (this.value.length > this.maxLength) {
        delegate.error('Too many: ' + this.arg);
        delegate.cursor();
        return false;
    }
    return true;
}

ArrayCollector.prototype.capture = function capture(iterator, delegate) {
    if (this.defaulter) {
        while (this.value.length < this.minLength) {
            this.value.push(this.defaulter.default());
        }
    }
    if (this.value.length < this.minLength) {
        delegate.error('Too few: ' + this.arg);
        delegate.cursor();
    }
    return this.value;
};

module.exports = ArrayCollector;
