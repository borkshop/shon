'use strict';

var assert = require('assert');

function Cursor(args, index) {
    this.args = args;
    this.index = index || 0;
}

Cursor.prototype.peek = function peek() {
    assert.ok(!this.done(), 'cannot peek');
    return this.args[this.index];
};

Cursor.prototype.shift = function shift() {
    return this.args[this.index++];
};

Cursor.prototype.done = function done() {
    return this.index >= this.args.length;
};

module.exports = Cursor;
