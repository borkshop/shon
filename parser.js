'use strict';

var Cursor = require('./cursor');
var Iterator = require('./iterator');

function Parser(name) {
    this.name = name;
    // Parsers:
    this.options = {};
    this.args = [];
    this.tail = null;
    this.plusOptions = false;
    this.shortArguments = false;
}

Parser.prototype.parse = function parse(iterator, delegate, context) {
    iterator = new Iterator(iterator.cursor);
    iterator.plusOptions = this.plusOptions;
    iterator.shortArguments = this.shortArguments;

    while (iterator.hasOption()) {
        this.parseOption(iterator, delegate, context);
    }

    // Interleaved arguments and options until the arguments in the schema run
    // dry.
    var index = 0;
    for (; index < this.args.length; index++) {
        var arg = this.args[index];
        if (iterator.hasOption()) {
            this.parseOption(iterator, delegate, context);
        } else {
            arg.parse(iterator, delegate, context);
        }
    }

    while (iterator.hasOption()) {
        this.parseOption(iterator, delegate, context);
    }

    if (!this.tail && iterator.hasArgument()) {
        delegate.error('Unexpected argument: ' + iterator.nextArgument(), iterator.cursor);
        return null;
    }

    // Parse interleaved arguments and options until the source runs dry.
    while (iterator.hasArgument() || iterator.hasOption()) {
        if (iterator.hasOption()) {
            this.parseOption(iterator, delegate, context);
        } else if (iterator.hasArgument()) {
            this.tail.parse(iterator, delegate, context);
        }
    }

    return null;
};

Parser.prototype.parseOption = function parseOption(iterator, delegate, context) {
    var option = iterator.nextOption();
    if (this.options[option]) {
        this.options[option].parse(iterator, delegate, context);
        return true;
    } else {
        delegate.error('Unexpected option: ' + option, iterator.cursor);
        return false;
    }
};

Parser.prototype.expected = function expected(delegate) {
    delegate.error('Expected: ' + this.name);
};

module.exports = Parser;
