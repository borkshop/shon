'use strict';

var Cursor = require('./cursor');
var Iterator = require('./iterator');
var Parser = require('./parser');
var Delegate = require('./delegate');
var ValueCollector = require('./value-collector');
var ArrayCollector = require('./array-collector');
// TODO var DifferenceCollector = require('./difference-collector');
// TODO SetCollector
var Converter = require('./converter');
var Validator = require('./validator');
var FlagParser = require('./flag-parser');
var ValueParser = require('./value-parser');
var ShonParser = require('./shon-parser');
var CommandParser = require('./command-parser');
var TrumpParser = require('./trump-parser');

var usage = require('./usage');

function Command(name, terms) {
    if (typeof name !== 'string') {
        throw new Error('Command(name, terms) name must be a string');
    }
    if (!terms || typeof terms !== 'object') {
        throw new Error('Command(name, terms) terms must be an object');
    }
    this._name = name;
    this._terms = [];
    this._usage = [];
    var names = Object.keys(terms);
    for (var index = 0; index < names.length; index++) {
        name = names[index];
        var term = terms[name];
        if (typeof term === 'object') {
            this._terms.push(subcommand(name, term));
        } else if (typeof term === 'string') {
            var result = usage.parse(terms[name]);
            if (result.err) {
                throw result.err;
            }
            this[name] = result.value;
            this[name].name = name;
            this._terms.push(this[name]);
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
        commands: choices,
        collectorType: null,
        validatorType: 'options',
        required: true,
        help: null,
    };
}

Command.prototype.exec = function exec(args, index, delegate) {
    delegate = delegate || new Delegate();
    if (!args) {
        args = process.argv;
        index = 2;
    }
    var config = this.parse(args, index, delegate);
    if (delegate.trumped) {
        return delegate.trumped;
    }
    if (config === null) {
        this._logUsage();
        return delegate.end();
    }
    return config;
};

Command.prototype._logUsage = function usage() {
    console.error('usage: ' + this._name);
    for (var index = 0; index < this._usage.length; index++) {
        console.log('  ' + this._usage[index]);
    }
};

Command.prototype.parse = function parse(args, index, delegate) {
    var cursor = new Cursor(args, index);
    var iterator = new Iterator(cursor);
    delegate = delegate || new Delegate();
    return this._parse(iterator, delegate);
};

Command.prototype._parse = function parse(iterator, delegate) {
    var parser = new Parser();
    var collectors = [];
    if (!this._setup(parser, collectors, iterator, delegate)) {
        return null;
    }
    if (!parser.parse(iterator, delegate)) {
        return null;
    }
    return this._capture(collectors, iterator, delegate);
};

Command.prototype._setup = function setup(parser, collectors, iterator, delegate) {

    for (var index = 0; index < this._terms.length; index++) {
        var term = this._terms[index];

        // scan for whether any flag has a specified value
        var def = null;
        var isBoolean = term.arg === null;
        for (var findex = 0; findex < term.flags.length && isBoolean; findex++) {
            var flag = term.flags[findex];
            if (flag.value != null) {
                isBoolean = false;
            }
        }

        var converter = setupConverter(term, isBoolean);
        var validator = setupValidator(term);

        // scan for a flag that has a default value
        for (var findex = 0; findex < term.flags.length; findex++) {
            var flag = term.flags[findex];
            if (flag.default) {
                def = converter.convert(flag.value, iterator, delegate);
                if (delegate.isDone()) {
                    return false;
                }
                if (!validator.validate(def, iterator, delegate)) {
                    delegate.error('Invalid default: ' + def);
                    return false;
                }
                break;
            }
        }

        // boolean flags are false by default, unless otherwise specified
        if (def === null && term.arg === null) {
            def = false;
        }

        var collector = setupCollector(term, def);

        // if there are flags, set up parsers for each flag
        for (var findex = 0; findex < term.flags.length; findex++) {
            var flag = term.flags[findex];
            var termParser = setupTermParser(term, flag, def, converter, validator, collector, delegate);
            if (delegate.isDone()) {
                return false;
            }
            parser.flags[flag.flag] = termParser;
        }

        // if there are no flags or if the flags are optional, this can be purely an argument
        if (term.flags.length === 0 || term.optionalFlag) {
            var termParser = setupTermParser(term, null, def, converter, validator, collector, delegate);
            if (delegate.isDone()) {
                return false;
            }
            if (term.collectorType === null) {
                // assert parser.tail === null
                parser.args.push(termParser);
            } else if (parser.tail === null) {
                parser.tail = termParser;
            } else {
                // assert this cannot be
            }
        }

        if (!term.trump) {
            collectors.push(collector);
        }
    }

    return true;
};

Command.prototype._capture = function capture(collectors, iterator, delegate) {
    var context = {};
    for (var index = 0; index < collectors.length; index++) {
        var collector = collectors[index];
        context[collector.name] = collector.capture(iterator, delegate);
    }
    if (delegate.isDone()) {
        return null;
    }
    return context;
};

function setupCollector(term, def) {
    var collector;
    if (term.collectorType === 'array') {
        collector = new ArrayCollector(term.name, term.arg, term.minLength, term.maxLength);
    } else {
        collector = new ValueCollector(term.name, def, term.required);
    }
    return collector;
}

function setupValidator(term) {
    var validator;
    if (term.validator) {
        validator = term.validator;
    } else if (term.validatorType === 'number') {
        validator = isNumber;
    } else if (term.validatorType === 'positive') {
        validator = isPositive;
    } else if (term.validatorType === 'options') {
        // TODO
    } else if (term.validator) {
        validator = term.validator;
    }
    return Validator.lift(validator);
}

function setupConverter(term, isBoolean) {
    var converter;
    if (term.converter) {
        converter = term.converter;
    } else if (isBoolean || term.converterType === 'boolean') {
        converter = convertBoolean;
    } else if (term.converterType === 'number') {
        converter = Number;
    }
    return Converter.lift(converter);
}

function setupTermParser(term, flag, value, converter, validator, collector, delegate) {
    if (term.trump) {
        return new TrumpParser(term.name, collector);
    } else if (term.commands) {
        return new CommandParser(term.commands, collector);
    } else if (term.arg === null) {
        // Establish the value for flags
        if (flag && flag.value != null) {
            value = converter.convert(flag.value);
            if (!validator.validate(value)) {
                delegate.error('Invalid flag value: ' + flag.value + ' for ' + term.name); // TODO
            }
        } else {
            value = !value;
        }

        return new FlagParser(value, collector);
    } else if (term.converterType === 'shon') {
        return new ShonParser(term.arg, collector, false);
    } else if (term.converterType === 'jshon') {
        return new ShonParser(term.arg, collector, true);
    } else if (term.converterType === 'json') {
        converter = Converter.lift(convertJson);
    }

    return new ValueParser(term.arg, converter, validator, collector, !term.required);
}

function isPositive(number) {
    return number === number && number >= 0;
}

function isNumber(number) {
    return number === number;
}

function convertBoolean(string, iterator, delegate) {
    if (string === 'true') {
        return true;
    } else if (string === 'false') {
        return false;
    } else {
        delegate.error('Must be true or false');
        delegate.cursor(iterator.cursor);
    }
}

function convertJson(string, iterator, delegate) {
    try {
        return JSON.parse(string);
    } catch (error) {
        delegate.error(error.message);
        delegate.cursor(iterator.cursor, -1);
        return null;
    }
}

module.exports = Command;
