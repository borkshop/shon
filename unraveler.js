'use strict';

// Short options of the form `-fx file` (which is equivalent to `-f file -x`)
// pose a problem for a parser that pulls values off a cursor.
// The unraveler ensures that defered short options are tracked in a reserve.
// The Unraveler manages a cursor within a particular context, exposing
// a higher level cursor interface, which can distinguish options from other
// arguments.

function Unraveler(cursor) {
    this.cursor = cursor;
    this.reserve = [];
    this.pluses = false;
    this.escaped = false;
}

Unraveler.prototype.hasArgument = function hasArgument() {
    if (this.cursor.end()) {
        return false;
    }
    if (this.escaped) {
        return !this.cursor.end();
    }
    var arg = this.cursor.peek();
    if (arg === '--') {
        this.escaped = true;
        this.cursor.shift();
    }
    return !this.cursor.end();
};

Unraveler.prototype.nextArgument = function nextArgument() {
    if (this.cursor.end()) {
        return null;
    }
    if (this.escaped) {
        return this.cursor.shift();
    }
    var arg = this.cursor.shift();
    if (arg === '--') {
        this.escaped = true;
        if (this.cursor.end()) {
            return null;
        }
        arg = this.cursor.shift();
    }
    return arg;
};

Unraveler.prototype.hasOption = function hasOption() {
    if (this.reserve.length) {
        return true;
    }
    if (this.escaped || this.cursor.end()) {
        return false;
    }
    var arg = this.cursor.peek();
    if (arg === '--') {
        return false; // escape
    } else if (arg.lastIndexOf('--', 0) === 0) {
        return true; // long option
    } else if (arg === '-') {
        return false; // - is a valid argument
    } else if (
        arg.lastIndexOf('-', 0) === 0 ||
        (this.pluses && arg.lastIndexOf('+', 0) === 0)
    ) {
        return true; // short option
    } else {
        return false; // argument
    }
};

Unraveler.prototype.nextOption = function nextOption() {
    if (this.reserve.length) {
        return this.reserve.shift();
    }
    if (this.cursor.end()) {
        return null;
    }
    var arg = this.cursor.shift();
    if (arg.lastIndexOf('--', 0) === 0) {
        return arg;
    } else if (
        arg.lastIndexOf('-', 0) === 0 ||
        (this.pluses && arg.lastIndexOf('+', 0) === 0)
    ) {
        this.unravel(arg);
    }
    if (this.reserve.length) {
        return this.reserve.shift();
    }
    return arg;
};

Unraveler.prototype.unravel = function unravel(arg) {
    for (var index = 1; index < arg.length; index++) {
        this.reserve.push(arg[0] + arg[index]);
    }
};

module.exports = Unraveler;
