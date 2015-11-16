'use strict';

var Cursor = require('./cursor');
var Iterator = require('./iterator');
var Delegate = require('./delegate');
var parse = require('./parse');
var logUsage = require('./log-usage');

function exec(command, args, index, delegate) {
    if (!args) {
        args = process.argv;
        index = 2;
    }
    var cursor = new Cursor(args, index);
    var iterator = new Iterator(cursor);
    delegate = delegate || new Delegate();
    var config = parse(command, iterator, delegate);
    if (delegate.trumped) {
        return delegate.trumped;
    }
    if (config === null) {
        logUsage(command, delegate);
        return delegate.end();
    }
    return config;
}

module.exports = exec;
