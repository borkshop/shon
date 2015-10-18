'use strict';

function ArrayCollector(name, valueName, min, max) {
    this.name = name;
    this.valueName = valueName;
    this.value = [];
    this.min = min;
    this.max = max;
}

ArrayCollector.prototype.collect = function collect(value, delegate, cursor) {
    if (this.value.length >= this.max) {
        delegate.error('Too many: ' + this.valueName);
        delegate.cursor(cursor);
    }
    this.value.push(value);
}

ArrayCollector.prototype.capture = function capture(delegate, cursor) {
    if (this.value.length < this.min) {
        delegate.error('Too few: ' + this.valueName);
        delegate.cursor(cursor);
    }
    return this.value;
};

module.exports = ArrayCollector;
