'use strict';

var Cursor = require('./cursor');
var Iterator = require('./iterator');
var Delegate = require('./delegate');
var Parser = require('./parser');
var ValueCollector = require('./value-collector');
var ArrayCollector = require('./array-collector');
// TODO var DifferenceCollector = require('./difference-collector');
// TODO SetCollector
var Converter = require('./converter');
var Validator = require('./validator');
var FlagParser = require('./flag-parser');
var ValueParser = require('./value-parser');
var ShonParser = require('./shon-parser');
var TrumpParser = require('./trump-parser');

function parse(command, iterator, delegate) {
    var parser = new Parser();
    var collectors = [];
    if (!setup(command, parser, collectors, iterator, delegate)) {
        return null;
    }
    if (!parser.parse(iterator, delegate)) {
        return null;
    }
    return capture(command, collectors, iterator, delegate);
}

function setup(command, parser, collectors, iterator, delegate) {
    var terms = command._terms || command.terms;

    var names = Object.keys(terms);
    for (var index = 0; index < names.length; index++) {
        var name = names[index];
        var term = terms[name];
        term.name = term.name || name;

        // scan for whether any flag has a specified value
        var def = term.default;

        // terms with a default value are not required
        if (def != null) {
            term.required = false;
        }

        // a flag is boolean
        var isBoolean = term.arg == null;
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
        if (def == null && term.arg == null) {
            def = false;
        }

        var collector = setupCollector(term, def);

        // if there are flags, set up parsers for each flag
        for (var findex = 0; findex < term.flags.length; findex++) {
            var flag = term.flags[findex];
            var termParser = setupTermParser(
                term,
                flag,
                def,
                converter,
                validator,
                collector,
                delegate
            );
            if (delegate.isDone()) {
                return false;
            }
            parser.flags[flag.flag] = termParser;
        }

        // if the term has no flags (like <arg>)
        // or if the flags are optional (like [--flag] <arg>)
        // or if the term is required and consumes an argument (unlike --flag)
        // but (implicitly) not optional flags (like [--flag] or [--flag <arg>])
        if (
            term.flags.length === 0 ||
            term.optionalFlag ||
            (term.required && term.arg != null)
        ) {
            var termParser = setupTermParser(
                term,
                null,
                def,
                converter,
                validator,
                collector,
                delegate
            );
            if (delegate.isDone()) {
                return false;
            }
            if (term.collectorType == null) {
                // assert parser.tail == null
                parser.args.push(termParser);
            } else if (parser.tail == null) {
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

function capture(command, collectors, iterator, delegate) {
    var context = {};
    for (var index = 0; index < collectors.length; index++) {
        var collector = collectors[index];
        var value = collector.capture(iterator, delegate);
        if (value != null) {
            context[collector.name] = value;
        }
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
    } else if (term.arg == null) {
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
        return new ShonParser(term.arg, collector, !term.required, false);
    } else if (term.converterType === 'jshon') {
        return new ShonParser(term.arg, collector, !term.required, true);
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

function CommandParser(commands, collector) {
    this.commands = commands;
    this.collector = collector;
}

CommandParser.prototype.parse = function _parse(iterator, delegate) {
    if (iterator.hasArgument()) {
        var command = iterator.shiftArgument();

        if (!(command in this.commands)) {
            delegate.error('Unknown command: ' + command);
            delegate.cursor(iterator.cursor, -1);
            return false;
        }

        var config = parse(this.commands[command], iterator, delegate);

        if (config == null) {
            return false;
        }

        return this.collector.collect({
            name: command,
            config: config
        });

    } else {
        delegate.error('Expected a command');
        delegate.cursor(iterator.cursor);
        // TODO one of
        return false;
    }
};

module.exports = parse;
