'use strict';

function DifferenceCollector(args) {
    this.name = args.name;
    this.value = args.value;
    this.min = args.min;
    this.max = args.max;
}

DifferenceCollector.prototype.collect = function collect(value) {
    this.value += value;
    return true;
};

DifferenceCollector.prototype.capture = function capture(iterator, delegate) {
    if (this.value > this.max) {
        delegate.error('Too much: ' + this.name + ' (maximum is ' + this.max + ')');
        delegate.cursor();
    } else if (this.value < this.min) {
        delegate.error('Too little: ' + this.name + ' (minimum is ' + this.min + ')');
        delegate.cursor();
    }
    return this.value;
};

module.exports = DifferenceCollector;
