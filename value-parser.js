'use strict';

function ValueParser(args) {
    this.name = args.name;
    this.arg = args.arg;
    this.converter = args.converter;
    this.validator = args.validator;
    this.collector = args.collector;
    this.required = args.required;
}

ValueParser.prototype.parse = function parse(iterator, delegate, flag) {
    if (this.collector.collected) {
        return true;
    }
    if (iterator.hasArgument()) {
        var argument = iterator.shiftArgument();
        var value = this.converter.convert(argument, iterator, delegate, flag);
        if (this.validator.validate(value, delegate)) {
            return this.collector.collect(value, iterator, delegate);
        } else {
            delegate.error('Invalid: ' + this.arg);
            delegate.cursor(-1);
            return false;
        }
    } else if (this.required) {
        delegate.error('Expected: ' + this.arg);
        delegate.cursor();
        return false;
    }
    return true;
};

module.exports = ValueParser;
