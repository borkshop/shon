'use strict';

function Parser() {
    this.flags = {}; // for all keyword arguments
    this.args = []; // for all positional arguments
    this.tail = null; // for all arguments following positional args
    this.escape = null; // for arguments after --, otherwise consumed as non-option arguments
    this.plus = null; // for +10 and other positive numbers
    this.minus = null; // for -10 and other negative numbers
}

Parser.prototype.parse = function parse(iterator, delegate) {

    for (var index = 0; index < this.args.length; index++) {
        this.parseFlags(iterator, delegate);
        if (delegate.exitCode !== 0) {
            break;
        }
        this.args[index].parse(iterator, delegate);
        if (delegate.exitCode !== 0) {
            break;
        }
    }

    // expect end of input unless tail
    this.parseFlags(iterator, delegate);
    if (delegate.exitCode !== 0) {
        return;
    }
    if (!this.tail) {
        if (iterator.hasArgument()) {
            delegate.error('Unexpected argument: ' + JSON.stringify(iterator.shiftArgument()));
            delegate.cursor(iterator.cursor, -1);
        }
        return;
    }

    // parse tail arguments
    for (;;) {
        this.parseFlags(iterator, delegate);
        if (delegate.exitCode !== 0) {
            return;
        }
        if (!iterator.hasArgument()) {
            break;
        }
        this.tail.parse(iterator, delegate);
        if (delegate.exitCode !== 0) {
            return;
        }
    }
};

Parser.prototype.parseFlags = function parseFlags(iterator, delegate) {
    for (;;) {
        this.parseEscape(iterator, delegate);
        if (!iterator.hasFlag()) {
            break;
        }
        this.parseFlag(iterator, delegate);
    }
};

Parser.prototype.parseFlag = function parseFlag(iterator, delegate) {
    var flag = iterator.shiftFlag();
    if (this.flags[flag]) {
        this.flags[flag].parse(iterator, delegate);
    } else if (flag.lastIndexOf('-', 0) === 0 && recognizeInteger(flag.slice(1))) {
        if (this.minus) {
            iterator.reserve = flag;
            this.minus.parse(iterator, delegate);
        }
    } else if (flag.lastIndexOf('+', 0) === 0 && recognizeInteger(flag.slice(1))) {
        if (this.plus) {
            iterator.reserve = flag;
            this.plus.parse(iterator, delegate);
        }
    } else {
        delegate.error('Unexpected flag: ' + JSON.stringify(flag));
        delegate.cursor(iterator.cursor);
    }
    if (iterator.reserve !== null && iterator.reserveFlag === null) {
        delegate.error('Unexpected argument for flag: ' + JSON.stringify(iterator.reserve));
        delegate.cursor(iterator.cursor);
        iterator.reserve = null;
    }
};

Parser.prototype.parseEscape = function parseEscape(iterator, delegate) {
    if (iterator.shiftEscape() && this.escape) {
        this.escape.parse(iterator, delegate);
    }
};

function recognizeInteger(text) {
    return /^[0-9]+$/.test(text);
}

module.exports = Parser;
