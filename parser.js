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
        if (!this.parseFlags(iterator, delegate)) {
            return false;
        }
        if (!this.args[index].parse(iterator, delegate)) {
            return false;
        }
    }

    // expect end of input unless tail
    if (!this.parseFlags(iterator, delegate)) {
        return false;
    }
    if (!this.tail) {
        if (iterator.hasArgument()) {
            delegate.error('Unexpected argument: ' + JSON.stringify(iterator.shiftArgument()));
            delegate.cursor(-1);
            return false;
        }
        return true;
    }

    // parse tail arguments
    for (;;) {
        if (!this.parseFlags(iterator, delegate)) {
            return false;
        }
        if (!iterator.hasArgument()) {
            break;
        }
        if (!this.tail.parse(iterator, delegate)) {
            return false;
        }
    }

    return true;
};

Parser.prototype.parseFlags = function parseFlags(iterator, delegate) {
    for (;;) {
        this.parseEscape(iterator, delegate);
        if (!iterator.hasFlag()) {
            break;
        }
        if (!this.parseFlag(iterator, delegate)) {
            return false;
        }
    }
    return true;
};

Parser.prototype.parseFlag = function parseFlag(iterator, delegate) {
    var flag = iterator.shiftFlag();
    if (this.flags[flag]) {
        if (!this.flags[flag].parse(iterator, delegate)) {
            return false;
        }
    } else if (flag.lastIndexOf('-', 0) === 0 && recognizeInteger(flag.slice(1))) {
        if (this.minus) {
            iterator.reserve = flag;
            if (!this.minus.parse(iterator, delegate)) {
                return false;
            }
        }
    } else if (flag.lastIndexOf('+', 0) === 0 && recognizeInteger(flag.slice(1))) {
        if (this.plus) {
            iterator.reserve = flag;
            if (!this.plus.parse(iterator, delegate)) {
                return false;
            }
        }
    } else {
        delegate.error('Unexpected flag: ' + JSON.stringify(flag));
        delegate.cursor(-1);
        return false;
    }
    if (iterator.reserve !== null && iterator.reserveFlag === null) {
        delegate.error('Unexpected argument for flag: ' + JSON.stringify(iterator.reserve));
        delegate.cursor();
        iterator.reserve = null;
        return false;
    }

    return true;
};

Parser.prototype.parseEscape = function parseEscape(iterator, delegate) {
    if (iterator.shiftEscape() && this.escape) {
        if (!this.escape.parse(iterator, delegate)) {
            return false;
        }
    }
    return true;
};

function recognizeInteger(text) {
    return /^[0-9]+$/.test(text);
}

module.exports = Parser;
