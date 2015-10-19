'use strict';

function ValueCollector(name, value, required) {
    this.name = name;
    this.value = value;
    this.collected = false;
    this.required = required;
}

ValueCollector.prototype.collect = function collect(value, delegate, cursor) {
    if (this.collected) {
        delegate.warn('Redundant: ' + this.name);
        delegate.cursor(cursor);
        return;
    }
    this.collected = true;
    this.value = value;
};

ValueCollector.prototype.capture = function capture(delegate, cursor) {
    if (!this.collected && this.required) {
        delegate.error('Required: ' + this.name);
        delegate.cursor(cursor);
    }
    return this.value;
};

module.exports = ValueCollector;
