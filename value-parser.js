'use strict';

function ValueParser(name, converter, validator, collector) {
    this.name = name;
    this.converter = converter;
    this.validator = validator;
    this.collector = collector;
}

ValueParser.prototype.parse = function parse(iterator, delegate) {
    if (iterator.hasArgument()) {
        var argument = iterator.nextArgument();
        var value = this.converter.convert(argument, delegate);
        if (this.validator.validate(value, delegate)) {
            this.collector.collect(value, delegate);
            return;
        } else {
            delegate.error('Expected: ' + this.name);
            delegate.cursor(iterator.cursor);
        }
    } else {
        delegate.error('Expected: ' + this.name);
        delegate.cursor(iterator.cursor);
    }
};

module.exports = ValueParser;
