'use strict';

function ArrayParser(name) {
    this.name = name;
}

ArrayParser.prototype.parse = function parse(unraveler, delegate, context) {
    // TODO redundancy detection
    // TODO coercion
    // TODO validation
    context[this.name].push(unraveler.nextArgument());
};

ArrayParser.prototype.expected = function expected(delegate) {
    delegate.error('Expected: ' + this.name);
};

module.exports = ArrayParser;
