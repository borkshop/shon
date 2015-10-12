'use strict';

function ValueParser(name) {
    this.name = name;
}

ValueParser.prototype.parse = function parse(iterator, delegate, context) {
    if (iterator.hasArgument()) {
        context[this.name] = iterator.nextArgument();
    } else {
        delegate.error('Expected value for: ' + this.name, iterator.cursor);
        return;
    }
    // TODO redundancy detection
    // TODO coercion
    // TODO validation
};

ValueParser.prototype.expected = function expected(delegate) {
    delegate.error('Expected: ' + this.name);
};

module.exports = ValueParser;
