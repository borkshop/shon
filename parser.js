'use strict';

var Cursor = require('./cursor');
var Unraveler = require('./unraveler');

function Parser() {
    // Parsers:
    this.options = {};
    this.args = [];
    this.tail = null;
    this.pluses = false;
    // TODO interleaved vs non-interleaved
}

Parser.prototype.parse = function parse(cursor, delegate, context) {
    var unraveler = new Unraveler(cursor);
    unraveler.pluses = this.pluses;

    // Interleaved arguments and options until the required arguments run dry.
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
        delegate.error('Expected no further arguments', cursor);
        return delegate.end();
    }

    while (unraveler.hasArgument()) {
        if (!this.tail.parse(unraveler, delegate, context)) {
            return delegate.end();
        }
    }

    return delegate.end();
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

module.exports = Parser;