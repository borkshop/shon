'use strict';

function ArrayCollector(name, valueName, min, max) {
    this.name = name;
    this.valueName = valueName;
    this.value = [];
    this.min = min;
    this.max = max;
}

ArrayCollector.prototype.collect = function collect(value, iterator, delegate) {
    if (this.value.length + 1 >= this.max) {
        delegate.error('Too many: ' + this.valueName);
        delegate.cursor(iterator.cursor);
    }
    this.value.push(value);
}

ArrayCollector.prototype.capture = function capture(iterator, delegate) {
    if (this.value.length < this.min) {
        delegate.error('Too few: ' + this.valueName);
        delegate.cursor(iterator.cursor);
    }
    return this.value;
};

module.exports = ArrayCollector;
