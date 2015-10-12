'use strict';

var Cursor = require('./cursor');
var Iterator = require('./iterator');
var Delegate = require('./delegate');
var Parser = require('./parser');
var ValueParser = require('./value-parser');
var BooleanParser = require('./boolean-parser');
var CounterParser = require('./counter-parser');
var ArrayParser = require('./array-parser');

function Schema() {
    this._options = [];
    this._def = {};
    this._long = {};
    this._short = {};
    this._commands = {};
    this._args = [];
    this._tail = null;
    this._interleaved = false;
    this._shortArguments = false;
    this._plusOptions = false;
}

Schema.prototype.parse = function parse(args, index, delegate) {
    var cursor = new Cursor(args, index);
    var parser = new Parser();
    var iterator = new Iterator(cursor);
    delegate = delegate || new Delegate();

    parser.plusOptions = this._plusOptions;
    parser.shortArguments = this._shortArguments;
    // TODO parser.interleaved

    // setup parser and context
    var context = {};
    for (var index = 0; index < this._args.length; index++) {
        this._args[index]._setup(parser, context);
    }
    for (var index = 0; index < this._options.length; index++) {
        this._options[index]._setup(parser, context);
    }

    parser.parse(iterator, delegate, context);
    return context;
};

Schema.prototype.option = function option(/* args */) {
    var option = new this.Option(this, arguments);
    this._options.push(option);
    return option;
};

Schema.prototype.arg = function arg(name) {
    var arg = new this.Argument(this, name);
    this._args.push(arg);
    return arg;
};

Schema.prototype.default = function (name, value) {
    this._def[name] = value;
};

Schema.prototype.shortArguments = function shortArguments() {
    this._shortArguments = true;
};

Schema.prototype.Argument = Argument;
Schema.prototype.Option = Option;

function Argument(schema, name, def) {
    this._schema = schema;
    this._name = name;
    this._help = null;
};

Argument.prototype._Parser = ValueParser;

Argument.prototype._setup = function setup(parser, context) {
    context[this._name] = this._def;
    var argumentParser = new this._Parser(this._name);
    parser.args.push(argumentParser);
};

// TODO Argument.prototype.optional = function optional() {
// TODO };

Argument.prototype.help = function help(text) {
    this._help = text;
};

function Option(schema, args) {
    var self = this;
    this._schema = schema;
    this._name = null;
    this._displayName = null;
    this._help = null;
    this._validate = function (value) {
        return value;
    };
    this._long = [];
    this._short = [];
    this._inverse = false;
    for (var index = 0; index < args.length; index++) {
        var arg = args[index];
        if (typeof arg !== 'string') {
            for (var name in arg) {
                var value = arg[name];
                self[name](value);
            }
        } else if (/ /.test(arg)) {
            self.help(arg);
        } else if (/^--no-/.test(arg)) {
            arg = arg.match(/^--(no-.*)/)[1];
            self.__(arg);
            self._inverse = true;
        } else if (/^--/.test(arg)) {
            arg = arg.match(/^--(.*)/)[1];
            self.__(arg);
        } else if (/^-.$/.test(arg)) {
            arg = arg.match(/^-(.)/)[1];
            self._(arg);
        } else if (/^-/.test(arg)) {
            throw new Error('Option names with one dash may only have one letter.');
        } else {
            if (!self._name) {
                self.name(arg);
                self.displayName(arg);
            } else {
                self.name(arg);
            }
        }
    }
    if (!(self._short.length || self._long.length || self._name))
        throw new Error('Option has no name.');
};

Option.prototype._Parser = ValueParser;

Option.prototype._setup = function setup(parser, context) {
    var name = this.getName();
    context[name] = this._def; // TODO construct default, rather than referentially identical
    var optionParser = new this._Parser(name, this._def);
    for (var index = 0; index < this._short.length; index++) {
        parser.options['-' + this._short[index]] = optionParser;
    }
    for (var index = 0; index < this._long.length; index++) {
        parser.options['--' + this._long[index]] = optionParser;
    }
};

Option.prototype._ = function shortName(letter) {
    this._short.push(letter);
    this._schema._short[letter] = this;
};

Option.prototype.__ = function longName(word) {
    this._long.push(word);
    this._schema._long[word] = this;
};

Option.prototype.name = function name(name) {
    this._name = name;
    return this;
};

Option.prototype.displayName = function displayName(name) {
    this._displayName = name;
    return this;
};

Option.prototype.getDisplayName = function getDisplayName() {
    if (this._displayName)
        return this._displayName;
    return this.getName();
};

Option.prototype.getName = function getName() {
    if (this._name) {
        return this._name;
    }
    if (this._long.length > 0) {
        return this._long[0];
    }
    if (this._short.length > 0) {
        return this._short[0];
    }
    throw new Error('Can\'t get name of option');
};

Option.prototype.default = function _default(value) {
    if (this._def === undefined)
        this._def = value;
    return this;
};

Option.prototype.bool = function bool(def) {
    if (def === undefined)
        def = true;
    if (this._inverse) {
        def = !def;
    }
    this._Parser = BooleanParser;
    return this.default(!def);
};

Option.prototype.push = function push() {
    this._def = [];
    this._Parser = ArrayParser;
    return this;
};

Option.prototype.command = function command() {
    this._Parser = Parser;
    return this;
};

// TODO Option.prototype.num = function num() {
// TODO };

// TODO Option.prototype.inc = function inc() {
// TODO };
// TODO 
// TODO Option.prototype.dec = function dec() {
// TODO };

// TODO Option.prototype.incdec = function incdec() {
// TODO };

module.exports = Schema;
