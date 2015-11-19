'use strict';

var Defaulter = require('./defaulter');

function ValueCollector(args) {
    this.name = args.name;
    this.value = args.default;
    this.defaulter = Defaulter.lift(args.defaulter);
    this.required = args.required;
    this.collected = false;
}

ValueCollector.prototype.collect = function collect(value, iterator, delegate) {
    if (this.collected) {
        delegate.warn('Redundant: ' + this.name);
        delegate.cursor();
        return true;
    }
    this.collected = true;
    this.value = value;
    return true;
};

ValueCollector.prototype.capture = function capture(iterator, delegate) {
    if (!this.collected) {
        if (this.required) {
            delegate.error('Required: ' + this.name);
            delegate.cursor();
        }
        if (this.defaulter) {
            this.value = this.defaulter.default(this.value);
        }
    }
    return this.value;
};

module.exports = ValueCollector;
