'use strict';

// Short options of the form `-fx file` (which is equivalent to `-f file -x`)
// pose a problem for a parser that pulls values off a cursor.
// The unraveler ensures that defered short options are tracked in a reserve.
// The Unraveler manages a cursor within a particular context, exposing
// a higher level cursor interface, which can distinguish options from other
// arguments.

// In the context of consuming an argument, arguments may look like options,
// e.g., --key=--value and --key --value.

function Unraveler(cursor) {
    this.cursor = cursor;
    this.reservedOptions = [];
    this.reservedArgument = null;
    this.pluses = false;
    this.likeCut = false;
    this.escaped = false;
}

Unraveler.prototype.hasArgument = function hasArgument() {
    if (this.reservedArgument !== null) {
        return true;
    }
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
    var arg = this.reservedArgument;
    if (arg !== null) {
        this.reservedArgument = null;
        return arg;
    }
    if (this.cursor.end()) {
        return null;
    }
    if (this.escaped) {
        return this.cursor.shift();
    }
    arg = this.cursor.shift();
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
    if (this.reservedOptions.length) {
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
    if (this.reservedOptions.length) {
        return this.reservedOptions.shift();
    }
    if (this.cursor.end()) {
        return null;
    }
    var arg = this.cursor.shift();
    var index;
    if (arg.lastIndexOf('--', 0) === 0) {
        index = arg.indexOf('=', 2);
        if (index >= 2) {
            this.reservedArgument = arg.slice(index + 1);
            return arg.slice(0, index);
        } else {
            return arg;
        }
    } else if (
        arg.lastIndexOf('-', 0) === 0 ||
        (this.pluses && arg.lastIndexOf('+', 0) === 0)
    ) {
        if (this.likeCut && arg.length > 2) {
            this.reservedArgument = arg.slice(2);
            return arg.slice(0, 2);
        } else {
            this.unravel(arg);
        }
    }
    if (this.reservedOptions.length) {
        return this.reservedOptions.shift();
    }
    return arg;
};

Unraveler.prototype.unravel = function unravel(arg) {
    for (var index = 1; index < arg.length; index++) {
        this.reservedOptions.push(arg[0] + arg[index]);
    }
};

module.exports = Unraveler;
