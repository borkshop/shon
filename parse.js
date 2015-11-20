'use strict';

var Cursor = require('./cursor');
var Iterator = require('./iterator');
var Delegate = require('./delegate');
var Parser = require('./parser');
var ValueCollector = require('./value-collector');
var Converter = require('./converter');
var Validator = require('./validator');
var Defaulter = require('./defaulter');
var FlagParser = require('./flag-parser');
var ValueParser = require('./value-parser');
var TrumpParser = require('./trump-parser');
var types = require('./types');
var merge = require('./merge');

function parse(command, iterator, delegate) {
    var parser = new Parser();
    var collectors = [];
    if (!setup(command, parser, collectors, iterator, delegate)) {
        return null;
    }
    if (!parser.parse(iterator, delegate)) {
        return delegate.trumped;
    }
    return capture(command, collectors, iterator, delegate);
}

function setup(command, parser, collectors, iterator, delegate) {
    var terms = command._terms || command.terms;

    var Parsers = merge(types.parsers, command._parsers || command.parsers);
    var Converters = merge(types.converters, command._converters || command.converters);
    var Validators = merge(types.validators, command._validators || command.validators);
    var Collectors = merge(types.collectors, command._collectors || command.collectors);
    var Defaulters = merge(types.defaults, command.defaults || command.defaults);

    var names = Object.keys(terms);
    for (var index = 0; index < names.length; index++) {
        var name = names[index];
        var term = terms[name];
        term.name = term.name || name;
        term.converter = Converter.lift(term.converter || Converters[term.type], term);
        term.validator = Validator.lift(term.validator || Validators[term.type], term);
        term.defaulter = Defaulter.lift(term.defaulter || Defaulters[term.type], term);
        setupTerm(term, Parsers, Collectors, parser, collectors, iterator, delegate);
    }

    return true;
}

function setupTerm(term, Parsers, Collectors, parser, collectors, iterator, delegate) {

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

    if (isBoolean) {
        term.type = 'boolean';
    }

    // scan for a flag that has a default value
    for (var findex = 0; findex < term.flags.length; findex++) {
        var flag = term.flags[findex];
        if (flag.default) {
            def = term.converter.convert(flag.value, iterator, delegate);
            if (delegate.isDone()) {
                return false;
            }
            if (!term.validator.validate(def, iterator, delegate)) {
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

    term.default = def;

    var Collector = Collectors[term.type] || Collectors[term.collectorType] || ValueCollector;
    term.collector = new Collector(term);

    // if there are flags, set up parsers for each flag
    for (var findex = 0; findex < term.flags.length; findex++) {
        var flag = term.flags[findex];
        var termParser = setupTermParser(Parsers, term, flag, iterator, delegate);
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
        var termParser = setupTermParser(Parsers, term, null, iterator, delegate);
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
        collectors.push(term.collector);
    }
}

function setupTermParser(Parsers, term, flag, iterator, delegate) {
    if (term.trump) {
        return new TrumpParser(term);
    } else if (term.type === 'command') {
        return new CommandParser(term);
    } else if (term.arg == null) {
        var value = term.default;
        // Establish the value for flags
        if (flag && flag.value != null) {
            value = term.converter.convert(flag.value, iterator, delegate);
            if (!term.validator.validate(value)) {
                delegate.error('Invalid flag value: ' + flag.value + ' for ' + term.name); // TODO
            }
        } else {
            value = !value;
        }
        return new FlagParser({value: value, collector: term.collector});
    }

    var TermParser = term.parser || Parsers[term.type] || ValueParser;
    return new TermParser(term);
}

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

function CommandParser(args) {
    this.commands = args.commands;
    this.collector = args.collector;
}

CommandParser.prototype.parse = function _parse(iterator, delegate) {
    if (iterator.hasArgument()) {
        var command = iterator.shiftArgument();

        if (!(command in this.commands)) {
            delegate.error('Unknown command: ' + command);
            delegate.cursor(-1);
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
        delegate.cursor();
        // TODO one of
        return false;
    }
};

module.exports = parse;
