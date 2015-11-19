'use strict';

var Cursor = require('./cursor');
var Iterator = require('./iterator');
var Delegate = require('./delegate');

var usage = require('./usage');

var exec = require('./exec');
var logUsage = require('./log-usage');
var parse = require('./parse');

function Command(name, terms) {
    if (typeof name !== 'string') {
        throw new Error('Command(name, terms) name must be a string');
    }
    if (!terms || typeof terms !== 'object') {
        throw new Error('Command(name, terms) terms must be an object');
    }
    this._name = name;
    this._terms = {};
    this._usage = [];
    var names = Object.keys(terms);
    for (var index = 0; index < names.length; index++) {
        name = names[index];
        var term = terms[name];
        if (typeof term === 'object') {
            this._terms[name] = subcommand(name, term);
        } else if (typeof term === 'string') {
            var result = usage.parse(terms[name]);
            if (result.err) {
                throw result.err;
            }
            this[name] = result.value;
            this[name].name = name;
            this._terms[name] = this[name];
            this._usage.push(term);
        }
    }
}

function subcommand(name, commands) {
    var choices = {};
    var keys = Object.keys(commands);
    for (var index = 0; index < keys.length; index++) {
        var key = keys[index];
        choices[key] = new Command(key, commands[key]);
    }
    return {
        name: name,
        flags: [],
        arg: 'command',
        type: 'command',
        commands: choices,
        collectorType: null,
        validatorType: 'options',
        required: true,
        help: null,
    };
}

Command.prototype.exec = function _exec(args, index, delegate) {
    return exec(this, args, index, delegate);
};

Command.prototype.parse = function _parse(args, index, delegate) {
    var cursor = new Cursor(args, index);
    var iterator = new Iterator(cursor);
    delegate = delegate || new Delegate({
        cursor: cursor,
        command: this,
        logUsage: logUsage
    });
    return parse(this, iterator, delegate);
};

Command.prototype._logUsage = function _logUsage() {
    logUsage(this);
};

module.exports = Command;
