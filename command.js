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

function Command(displayName) {
    this._name = null;
    this._displayName = displayName;
    this._terms = [];
    this._help = [];
    this._shortArguments = false;
    this._plusOptions = false;
}

Command.prototype.help = function help(line) {
    this._help.push(line);
};

Command.prototype.option = function option() {
    var term = Object.create(Term.prototype);
    Term.apply(term, arguments);
    this._terms.push(term);
    return term;
};

Command.prototype.argument = function argument() {
    var term = Object.create(Term.prototype);
    Term.apply(term, arguments);
    term._required = true;
    this._terms.push(term);
    return term;
};

Command.prototype.command = function command() {
    var term = Object.create(Term.prototype);
    Term.apply(term, arguments);
    term._command = true;
    this._terms.push(term);
    return term;
};

Command.prototype.shortArguments = function shortArguments() {
    this._shortArguments = true;
    return this;
};

Command.prototype.parse = function parse(args, index, delegate) {
    var cursor = new Cursor(args, index);
    var iterator = new Iterator(cursor);
    delegate = delegate || new Delegate();
    var parser = new Parser();
    parser.shortArguments = this._shortArguments;
    var collectors = [];
    this._setup(parser, collectors);
    parser.parse(iterator, delegate);
    return this._collect(collectors, delegate, cursor);
};

Command.prototype._setup = function setup(parser, collectors) {
    for (var index = 0; index < this._terms.length; index++) {
        this._terms[index]._setup(parser, collectors, this);
    }
};

Command.prototype._collect = function collect(collectors, delegate, cursor) {
    var context = {};
    for (var index = 0; index < collectors.length; index++) {
        var collector = collectors[index];
        context[collector.name] = collector.capture(delegate, cursor);
    }
    return context;
};

Command.prototype.logUsage = function logUsage(delegate) {
};

Command.prototype.logHelp = function logHelp(delegate) {
};

function Term(/* ...args */) {
    Command.call(this);
    this._long = [];
    this._no = [];
    this._short = [];
    this._plus = [];
    this._required = false;
    this._minLength = 0;
    this._maxLength = Infinity;
    this._command = false;
    this._argument = null;
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
            this._displayName = this._long[0];
            this._name = camelcase(this._long[0]);
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
            this._argument = arg;
        }
    }
}

Term.prototype = Object.create(Command.prototype);
Term.prototype.constructor = Term;

Term.prototype.name = function name(name) {
    this._name = name;
    return this;
};

Term.prototype.int = function int() {
    this._converterType = 'number';
    this._validatorType = 'int';
    return this;
};

Term.prototype.number = function int() {
    this._converterType = 'number';
    return this;
};

Term.prototype.push = function push(min, max) {
    this._collectorType = 'array';
    this._minLength = min || 0;
    this._maxLength = max || Infinity;
    return this;
};

Term.prototype.add = function add() {
    this._collectorType = 'set';
    return this;
};

Term.prototype.validate = function validate(validator) {
    this._validator = Validator.lift(validator);
    return this;
};

Term.prototype.convert = function convert(converter) {
    this._converter = Converter.lift(converter);
    return this;
};

Term.prototype.required = function required() {
    this._required = true;
    this._minLength = Math.max(this._minLength, 1);
    return this;
};

Term.prototype.optional = function optional() {
    this._required = false;
    this._minLength = 0;
    return this;
};

Term.prototype.default = function _default(value) {
    this._required = false;
    this._default = value;
    return this;
};

Term.prototype.logUsage = function logUsage(delegate) {
};

Term.prototype.logHelp = function logHelp(delegate) {
};

Term.prototype._setup = function setup(parser, collectors) {
    if (this._no.length) {
    } else if (this._plus.length) {
    } else if (this._long.length || this._short.length) {
    } else if (this._name !== null) {
    } else {
    }

    if (this._command) {
        // TODO
        return;
    }

    if (this._argument === null && this._default === null) {
        this._default = false;
    }

    if (this._name === null) {
        throw new Error('Term missing name'); // TODO
    }

    var collector;
    if (this._collectorType === 'array') {
        collector = new ArrayCollector(this._name, this._minLength, this._maxLength);
    } else {
        collector = new ValueCollector(this._name, this._default, this._required);
    }

    var converter = this._converter || new Converter();
    var validator = this._validator || new Validator();

    var termParser;
    if (this._argument === null) {
        termParser = new FlagParser(!this._default, collector);
    } else {
        termParser = new ValueParser(this._argument, converter, validator, collector);
    }

    for (var index = 0; index < this._short.length; index++) {
        parser.options[this._short[index]] = termParser;
    }
    for (var index = 0; index < this._long.length; index++) {
        parser.options[this._long[index]] = termParser;
    }

    collectors.push(collector);
};

module.exports = Command;

