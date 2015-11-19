'use strict';

var Cursor = require('./cursor');
var Iterator = require('./iterator');
var Delegate = require('./delegate');
var parse = require('./parse');
var logUsage = require('./log-usage');

function exec(command, args, index, delegate) {
    if (!args) {
        var name = command._name || command.name;
        args = [name].concat(process.argv.slice(2));
        index = 1;
    }
    var cursor = new Cursor(args, index);
    var iterator = new Iterator(cursor);
    delegate = delegate || new Delegate({
        cursor: cursor,
        logUsage: logUsage,
        command: command
    });
    var config = parse(command, iterator, delegate);
    if (delegate.trumped) {
        return delegate.trumped;
    }
    if (config === null) {
        return delegate.end();
    }
    return config;
}

module.exports = exec;
