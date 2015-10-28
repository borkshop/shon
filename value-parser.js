'use strict';

function ValueParser(name, converter, validator, collector, optional) {
    this.name = name;
    this.converter = converter;
    this.validator = validator;
    this.collector = collector;
    this.optional = optional;
}

ValueParser.prototype.parse = function parse(iterator, delegate, flag) {
    if (this.collector.collected) {
        return;
    }
    if (iterator.hasArgument()) {
        var argument = iterator.shiftArgument();
        var value = this.converter.convert(argument, iterator, delegate, flag);
        if (this.validator.validate(value, delegate)) {
            this.collector.collect(value, iterator, delegate);
            return;
        } else {
            delegate.error('Invalid: ' + this.name);
            delegate.cursor(iterator.cursor, -1);
        }
    } else if (!this.optional) {
        delegate.error('Expected: ' + this.name);
        delegate.cursor(iterator.cursor);
    }
};

module.exports = ValueParser;
