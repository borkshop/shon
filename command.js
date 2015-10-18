'use strict';

var Cursor = require('./cursor');
var Iterator = require('./iterator');
var Parser = require('./parser');
var Delegate = require('./delegate');
var camelcase = require('camelcase');

var ValueCollector = require('./value-collector');
var ArrayCollector = require('./array-collector');
var DifferenceCollector = require('./difference-collector'); // TODO
// TODO SetCollector

var Converter = require('./converter');
var Validator = require('./validator');

var FlagParser = require('./flag-parser');
var ValueParser = require('./value-parser');

function Command() {

    this._name = null;
    this._displayName = null;
    this._argumentName = null;
    this._terms = [];
    this._options = [];
    this._arguments = [];
    this._commands = [];
    this._help = [];
    this._shortArguments = false;
    this._plusOptions = false;

    this._long = [];
    this._no = [];
    this._short = [];
    this._plus = [];
    this._required = false;
    this._minLength = 0;
    this._maxLength = Infinity;
    this._command = false;
    this._collectorType = null;
    this._converterType = null;
    this._validatorType = null;
    this._default = null;

    for (var index = 0; index < arguments.length; index++) {
        var arg = arguments[index];
        if (/ /.test(arg)) {
            this._help.push(arg);
        } else if (/^--no-/.test(arg)) {
            this._no.push(arg);
        } else if (/^--/.test(arg)) {
            this._long.push(arg);
        } else if (/^-.$/.test(arg)) {
            this._short.push(arg);
        } else if (/^\+.$/.test(arg)) {
            this._plus.push(arg);
            this._plusOptions = true;
        } else if (/^-/.test(arg)) {
            throw new Error('Option names with one dash may only have one letter.');
        } else if (/^\+/.test(arg)) {
            throw new Error('Option names with one plus may only have one letter.');
        } else {
            this._argumentName = arg;
            console.log(this._argumentName, this._name, this._displayName);
        }
    }

    if (this._name === null) {
        if (this._long.length) {
            this._name = camelcase(this._long[0]);
        } else if (this._argumentName !== null) {
            this._name = camelcase(this._argumentName);
        } else if (this._short.length) {
            this._name = camelcase(this._short[0]);
        }
    }
}

Command.prototype.parse = function parse(args, index, delegate) {
    var cursor = new Cursor(args, index);
    var iterator = new Iterator(cursor);
    delegate = delegate || new Delegate();
    return this._parse(iterator, delegate);
};

Command.prototype._parse = function parse(iterator, delegate) {
    var parser = new Parser();
    parser.shortArguments = this._shortArguments;
    var collectors = [];
    this._setup(parser, collectors);
    parser.parse(iterator, delegate);
    return this._collect(collectors, delegate, iterator.cursor);
};

Command.prototype.option = function option() {
    var term = Object.create(Command.prototype);
    Command.apply(term, arguments);
    this._terms.push(term);
    this._options.push(term);
    return term;
};

Command.prototype.argument = function argument() {
    var term = Object.create(Command.prototype);
    Command.apply(term, arguments);
    term._required = true;
    this._terms.push(term);
    this._arguments.push(term);
    return term;
};

Command.prototype.command = function command() {
    var term = Object.create(Command.prototype);
    Command.apply(term, arguments);
    term._command = true;
    this._terms.push(term);
    this._commands.push(term);
    return term;
};

Command.prototype.shortArguments = function shortArguments() {
    this._shortArguments = true;
    return this;
};

Command.prototype.name = function name(name) {
    this._name = name;
    return this;
};

Command.prototype.help = function help(line) {
    this._help.push(line);
    return this;
};

Command.prototype.int = function int() {
    this._converterType = 'number';
    this._validatorType = 'int';
    return this;
};

Command.prototype.number = function int() {
    this._converterType = 'number';
    return this;
};

Command.prototype.push = function push(min, max) {
    this._collectorType = 'array';
    this._minLength = min || 0;
    this._maxLength = max || Infinity;
    return this;
};

Command.prototype.add = function add() {
    this._collectorType = 'set';
    return this;
};

Command.prototype.validate = function validate(validator) {
    this._validator = Validator.lift(validator);
    return this;
};

Command.prototype.convert = function convert(converter) {
    this._converter = Converter.lift(converter);
    return this;
};

// TODO collect

Command.prototype.required = function required() {
    this._required = true;
    this._minLength = Math.max(this._minLength, 1);
    return this;
};

Command.prototype.optional = function optional() {
    this._required = false;
    this._minLength = 0;
    return this;
};

Command.prototype.default = function _default(value) {
    this._required = false;
    this._default = value;
    return this;
};

Command.prototype._setup = function setup(parser, collectors) {
    // TODO support for optional command, fallback on missing
    var commandCollector = new ValueCollector('command', null, true);
    var commands = {};
    if (this._commands.length) {
        this._setupCommands(parser, collectors, commands, commandCollector);
        collectors.push(commandCollector);
    }
    for (var index = 0; index < this._terms.length; index++) {
        this._terms[index]._setupParser(parser, collectors, commands, commandCollector);
    }
};

Command.prototype._setupCommands = function setupCommands(parser, collectors, commands, commandCollector) {
    var commandParser = new CommandParser(commands, commandCollector);
    parser.args.push(commandParser);
};

Command.prototype._collect = function collect(collectors, delegate, cursor) {
    var context = {};
    for (var index = 0; index < collectors.length; index++) {
        var collector = collectors[index];
        context[collector.name] = collector.capture(delegate, cursor);
    }
    return context;
};

Command.prototype._setupParser = function setup(parser, collectors, commands, commandCollector) {

    if (this._command) {
        return this._setupCommand(parser, commands, commandCollector);
    }

    if (this._no.length && this._argumentName === null) {
        // TODO opposite boolean flag
        this._default = true;
        throw new Error('not implemented');
    }

    if (this._plus.length) {
        // TODO +/- difference converter
        throw new Error('not implemented');
    }

    if (this._long.length || this._short.length) {
        this._setupFlags(parser, collectors);
        return;
    }

    if (this._name === null) {
        throw new Error('Term missing name'); // TODO
    }

};

Command.prototype._setupCommand = function setupCommand(parser, commands, commandCollector) {
    if (this._argumentName !== null) {
        commands[this._argumentName] = this;
    }
    // TODO option-style commands, e.g., -h, --help
    // TODO command is optional
    // TODO no command given fallback
};

Command.prototype._setupFlags = function setupFlags(parser, collectors) {
    if (this._argumentName === null && this._default === null) {
        this._default = false;
    }

    var collector;
    if (this._collectorType === 'array') {
        collector = new ArrayCollector(this._name, this._argumentName, this._minLength, this._maxLength);
    } else {
        collector = new ValueCollector(this._name, this._default, this._required);
    }

    var converter = Converter.lift(this._converter);
    var validator = Validator.lift(this._validator);

    var termParser;
    if (this._argumentName === null) {
        termParser = new FlagParser(!this._default, collector);
    } else {
        termParser = new ValueParser(this._argumentName, converter, validator, collector);
    }

    for (var index = 0; index < this._short.length; index++) {
        parser.options[this._short[index]] = termParser;
    }
    for (var index = 0; index < this._long.length; index++) {
        parser.options[this._long[index]] = termParser;
    }

    collectors.push(collector);
};

function CommandParser(commands, collector) {
    this.commands = commands;
    this.collector = collector;
}

CommandParser.prototype.parse = function parse(iterator, delegate) {
    if (iterator.hasArgument()) {
        var command = iterator.nextArgument();

        if (!(command in this.commands)) {
            delegate.error('Unrecognized command: ' + command);
            return null;
        }

        var options = this.commands[command]._parse(iterator, delegate);

        this.collector.collect({
            name: command,
            options: options
        });

    } else {
        delegate.error('Expected a command');
        delegate.cursor(iterator.cursor);
        // TODO one of
        return null;
    }
};

module.exports = Command;
