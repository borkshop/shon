'use strict';

var assert = require('assert');

function Iterator(cursor) {
    this.cursor = cursor;
    this.reserve = null;
    this.reserveFlag = null;
    this.plusFlags = false;
    this.escaped = false;
}

Iterator.prototype.hasFlag = function hasFlag() {
    if (this.reserveFlag !== null) {
        return true;
    }
    // if (this.reserve !== null) {
    //     return false;
    // }
    if (this.cursor.done() || this.escaped) {
        return false;
    }
    var arg = this.cursor.peek();
    if (arg === '--') {
        return false;
    } else if (arg.lastIndexOf('--', 0) === 0) {
        return true;
    } else if (arg === '-') {
        return false;
    } else if (arg.lastIndexOf('-', 0) === 0) {
        return true;
    } else if (this.plusFlags && arg.lastIndexOf('+', 0) === 0) {
        return true;
    } else {
        return false;
    }
};

Iterator.prototype.shiftFlag = function shiftFlag() {
    assert(this.hasFlag(), 'unable to shift flag');
    var arg;
    if (this.reserveFlag !== null) {
        arg = this.reserveFlag + this.reserve;
        this.reserveFlag = null;
        this.reserve = null;
    } else {
        arg = this.cursor.shift();
    }
    // invariant: arg is a flag
    // so not --, not -, not + if + not accepted
    var index;
    if (arg.lastIndexOf('--', 0) === 0) {
        index = arg.indexOf('=', 2);
        if (index >= 2) {
            this.reserve = arg.slice(index + 1);
            this.reserveFlag = null;
            return arg.slice(0, index);
        } else {
            return arg;
        }
    }
    // invariant: arg[0] is + or -
    if (arg.length > 2) {
        this.reserve = arg.slice(2);
        this.reserveFlag = arg[0];
        return arg.slice(0, 2);
    } else {
        return arg;
    }
};

Iterator.prototype.shiftEscape = function shiftEscape() {
    if (
        this.reserve === null &&
        !this.cursor.done() &&
        !this.escaped &&
        this.cursor.peek() === '--'
    ) {
        this.escaped = true;
        this.cursor.shift();
        return true;
    }
    return false;
};

Iterator.prototype.hasArgument = function hasArgument() {
    // invariant: shiftEscape has been called to clear out --
    if (this.reserve !== null) {
        return true;
    }
    return !this.cursor.done();
};

Iterator.prototype.shiftArgument = function shiftArgument() {
    if (this.reserve !== null) {
        var reserve = this.reserve;
        this.reserveFlag = null;
        this.reserve = null;
        return reserve;
    }
    return this.cursor.shift();
};

Iterator.prototype.initialFlag = function initialFlag() {
    if (!this.hasFlag() && this.hasArgument()) {
        this.reserve = this.shiftArgument();
        this.reserveFlag = '-';
    }
};

module.exports = Iterator;
