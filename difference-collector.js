'use strict';

function DifferenceCollector(name, value, min, max) {
    this.name = name;
    this.value = value;
    this.min = min;
    this.max = max;
}

DifferenceCollector.prototype.collect = function collect(value) {
    this.value += value;
    return true;
};

DifferenceCollector.prototype.capture = function capture(iterator, delegate) {
    if (this.value > this.max) {
        delegate.error('Too much: ' + this.name + ' (maximum is ' + this.max + ')');
        delegate.cursor(iterator.cursor);
    } else if (this.value < this.min) {
        delegate.error('Too little: ' + this.name + ' (minimum is ' + this.min + ')');
        delegate.cursor(iterator.cursor);
    }
    return this.value;
};

module.exports = DifferenceCollector;
