'use strict';

function ValueCollector(args) {
    this.name = args.name;
    this.value = args.default;
    this.required = args.required;
    this.collected = false;
}

ValueCollector.prototype.collect = function collect(value, iterator, delegate) {
    if (this.collected) {
        delegate.warn('Redundant: ' + this.name);
        delegate.cursor(iterator.cursor);
        return true;
    }
    this.collected = true;
    this.value = value;
    return true;
};

ValueCollector.prototype.capture = function capture(iterator, delegate) {
    if (!this.collected && this.required) {
        delegate.error('Required: ' + this.name);
        delegate.cursor(iterator.cursor);
    }
    return this.value;
};

module.exports = ValueCollector;
