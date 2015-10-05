'use strict';

var Cursor = require('./cursor');
var Unraveler = require('./unraveler');

function Parser(name) {
    this.name = name;
    // Parsers:
    this.options = {};
    this.args = [];
    this.tail = null;
    this.plusOptions = false;
    this.shortArguments = false;
}

Parser.prototype.parse = function parse(unraveler, delegate, context) {
    unraveler = new Unraveler(unraveler.cursor);
    unraveler.plusOptions = this.plusOptions;
    unraveler.shortArguments = this.shortArguments;

    while (unraveler.hasOption()) {
        this.parseOption(unraveler, delegate, context);
    }

    // Interleaved arguments and options until the arguments in the schema run
    // dry.
    var index = 0;
    for (; index < this.args.length; index++) {
        var arg = this.args[index];
        if (unraveler.hasOption()) {
            this.parseOption(unraveler, delegate, context);
        } else {
            arg.parse(unraveler, delegate, context);
        }
    }

    while (unraveler.hasOption()) {
        this.parseOption(unraveler, delegate, context);
    }

    if (!this.tail && unraveler.hasArgument()) {
        delegate.error('Unexpected argument: ' + unraveler.nextArgument(), unraveler.cursor);
        return null;
    }

    // Parse interleaved arguments and options until the source runs dry.
    while (unraveler.hasArgument() || unraveler.hasOption()) {
        if (unraveler.hasOption()) {
            this.parseOption(unraveler, delegate, context);
        } else if (unraveler.hasArgument()) {
            this.tail.parse(unraveler, delegate, context);
        }
    }

    return null;
};

Parser.prototype.parseOption = function parseOption(unraveler, delegate, context) {
    var option = unraveler.nextOption();
    if (this.options[option]) {
        this.options[option].parse(unraveler, delegate, context);
        return true;
    } else {
        delegate.error('Unexpected option: ' + option, unraveler.cursor);
        return false;
    }
};

Parser.prototype.expected = function expected(delegate) {
    delegate.error('Expected: ' + this.name);
};

module.exports = Parser;
