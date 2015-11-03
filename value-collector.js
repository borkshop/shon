'use strict';

function ValueCollector(name, value, required) {
    this.name = name;
    this.value = value;
    this.collected = false;
    this.required = required;
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
