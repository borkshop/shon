'use strict';

function ArrayCollector(name, valueName, min, max) {
    this.name = name;
    this.valueName = valueName;
    this.value = [];
    this.min = min;
    this.max = max;
    this.collected = false;
}

ArrayCollector.prototype.collect = function collect(value, iterator, delegate) {
    this.value.push(value);
    if (this.value.length > this.max) {
        delegate.error('Too many: ' + this.valueName);
        delegate.cursor(iterator.cursor);
        return false;
    }
    return true;
}

ArrayCollector.prototype.capture = function capture(iterator, delegate) {
    if (this.value.length < this.min) {
        delegate.error('Too few: ' + this.valueName);
        delegate.cursor(iterator.cursor);
    }
    return this.value;
};

module.exports = ArrayCollector;
