'use strict';

function ArrayCollector(name, min, max) {
    this.name = name;
    this.value = [];
    this.min = min || 0;
    this.max = max || Infinity;
}

ArrayCollector.prototype.collect = function collect(value, delegate, cursor) {
    if (this.value.length >= this.max) {
        delegate.error('Too many: ' + this.name);
        delegate.cursor(cursor);
        return;
    }
    this.value.push(value);
}

ArrayCollector.prototype.capture = function capture(delegate, cursor) {
    if (this.value.length < this.min) {
        delegate.error('Too few: ' + this.name);
        delegate.cursor(cursor);
        return;
    }
    return this.value;
};

module.exports = ArrayCollector;
