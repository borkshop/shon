'use strict';

function ValueParser(name) {
    this.name = name;
}

ValueParser.prototype.parse = function parse(unraveler, delegate, context) {
    if (unraveler.hasArgument()) {
        context[this.name] = unraveler.nextArgument();
    } else {
        delegate.error('Expected value for: ' + this.name, unraveler.cursor);
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
