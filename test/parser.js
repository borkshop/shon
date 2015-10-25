'use strict';

var test = require('tape');
var Delegate = require('./delegate');
var Cursor = require('../cursor');
var Iterator = require('../iterator');
var Parser = require('../parser');
var FlagParser = require('../flag-parser');
var ValueParser = require('../value-parser');
var ValueCollector = require('../value-collector');
var ArrayCollector = require('../array-collector');
var DifferenceCollector = require('../difference-collector');
var Converter = require('../converter');
var Validator = require('../validator');

function createCase(test) {
    return function t(assert) {
        var cursor = new Cursor(test.args, 0);
        var iterator = new Iterator(cursor);
        var parser = new Parser();

        var scaffold;
        if (test.setup) {
            scaffold = test.setup(parser, iterator);
        }

        var delegate = new Delegate(assert, test.logs);
        parser.parse(iterator, delegate);

        if (test.check && delegate.exitCode === 0) {
            test.check(assert, iterator, delegate, scaffold);
        }

        delegate.end();
        assert.end();
    }
}

test('empty parser accepts empty args', createCase({
    args: []
}));

test('empty parser does not recognize dash arg', createCase({
    args: ['-'],
    logs: {
        error0: 'Unexpected argument: "-"'
    }
}));

test('empty parser accepts escape in lieu of args', createCase({
    args: ['--']
}));

test('empty parser fails to recognize arg that looks like flag after escape', createCase({
    args: ['--', '-a'],
    logs: {
        error0: 'Unexpected argument: "-a"'
    }
}));

function setupFlagParser(parser) {
    var flagCollector = new ValueCollector('x', false, false);
    var flagParser = new FlagParser(true, flagCollector);
    parser.flags['-x'] = flagParser;
    parser.flags['--x'] = flagParser;
    return flagCollector;
}

function checkCapturedFlag(assert, iterator, delegate, flagCollector) {
    assert.equals(flagCollector.capture(iterator, delegate), true, 'flag captured');
}

function checkDefaultedFlag(assert, iterator, delegate, flagCollector) {
    assert.equals(flagCollector.capture(iterator, delegate), false, 'default fell through');
}

test('flag parser captures default', createCase({
    args: [],
    logs: {},
    setup: setupFlagParser
}));

test('flag parser captures set flag', createCase({
    args: ['-x'],
    logs: {},
    setup: setupFlagParser
}));

test('flag parser recognizes redudnant flag', createCase({
    args: ['-x', '-x'],
    logs: {
        warn0: 'Redundant: x'
    },
    setup: setupFlagParser
}));

test('flag parser recognizes redudnant flag in compact form', createCase({
    args: ['-xx'],
    logs: {
        warn0: 'Redundant: x'
    },
    setup: setupFlagParser
}));

test('flag parser recognizes long flag', createCase({
    args: ['--x'],
    logs: {},
    setup: setupFlagParser
}));

test('flag parser recognizes redundant long flag', createCase({
    args: ['--x', '--x'],
    logs: {
        warn0: 'Redundant: x'
    },
    setup: setupFlagParser
}));

test('flag parser recognizes superfluous argument on long flag', createCase({
    args: ['--x=y'],
    logs: {
        error0: 'Unexpected argument for flag: "y"'
    },
    setup: setupFlagParser
}));

test('flag parser recognizes superfluous empty string argument on long flag', createCase({
    args: ['--x='],
    logs: {
        error0: 'Unexpected argument for flag: ""'
    },
    setup: setupFlagParser
}));

test('flag parser recognizes superfluous argument after flag', createCase({
    args: ['--x', 'y'],
    logs: {
        error0: 'Unexpected argument: "y"'
    },
    setup: setupFlagParser
}));

test('flag parser recognizes superfluous escaped argument after flag', createCase({
    args: ['--x', '--', 'y'],
    logs: {
        error0: 'Unexpected argument: "y"'
    },
    setup: setupFlagParser
}));

test('flag parser does not recognize unknown flag', createCase({
    args: ['-y'],
    logs: {
        error0: 'Unexpected flag: "-y"'
    },
    setup: setupFlagParser
}));

function setupValueParser(parser) {
    var xConverter = new Converter();
    var xValidator = new Validator();
    var xCollector = new ValueCollector('x', null, false);
    var xParser = new ValueParser('x', xConverter, xValidator, xCollector);
    parser.flags['-x'] = xParser;
    parser.flags['--x'] = xParser;
    return xCollector;
}

function checkDefaultedValue(assert, iterator, delegate, valueCollector) {
    assert.equals(valueCollector.capture(iterator, delegate), null, 'default captured');
}

function checkGivenValue(assert, iterator, delegate, valueCollector) {
    assert.equals(valueCollector.capture(iterator, delegate), 'y', 'value captured');
}

test('value parser recognizes missing argument', createCase({
    args: ['-x'],
    logs: {
        error0: 'Expected: x'
    },
    setup: setupValueParser
}));

test('value parser recognizes missing argument in long form', createCase({
    args: ['--x'],
    logs: {
        error0: 'Expected: x'
    },
    setup: setupValueParser
}));

test('value parser captures value in short form', createCase({
    args: ['-x', 'y'],
    logs: {
    },
    setup: setupValueParser,
    check: checkGivenValue
}));

test('value parser captures value in compact short form', createCase({
    args: ['-xy'],
    logs: {
    },
    setup: setupValueParser,
    check: checkGivenValue
}));

test('value parser captures value in long form', createCase({
    args: ['--x', 'y'],
    logs: {
    },
    setup: setupValueParser,
    check: checkGivenValue
}));

test('value parser captures value in compact long form', createCase({
    args: ['--x=y'],
    logs: {
    },
    setup: setupValueParser,
    check: checkGivenValue
}));

function setupRequiredValueParser(parser) {
    var xConverter = new Converter();
    var xValidator = new Validator();
    var xCollector = new ValueCollector('x', null, true);
    var xParser = new ValueParser('x', xConverter, xValidator, xCollector);
    parser.flags['-x'] = xParser;
    parser.flags['--x'] = xParser;
    return xCollector;
}

test('required value parser requires value for flag', createCase({
    args: [],
    logs: {
        error0: 'Required: x'
    },
    setup: setupRequiredValueParser,
    check: checkDefaultedValue
}));

function setupRequiredArgumentParser(parser) {
    var xConverter = new Converter();
    var xValidator = new Validator();
    var xCollector = new ValueCollector('x', null, true);
    var xParser = new ValueParser('x', xConverter, xValidator, xCollector);
    parser.args.push(xParser);
    return xCollector;
}

test('required value parser requires value for argument', createCase({
    args: [],
    logs: {
        error0: 'Expected: x'
    },
    setup: setupRequiredArgumentParser
}));

function setupMultiArgumentParser(parser) {
    var converter = new Converter();
    var validator = new Validator();
    var xCollector = new ValueCollector('x', null, true);
    var yCollector = new ValueCollector('y', null, true);
    var zCollector = new ValueCollector('z', null, true);
    var xParser = new ValueParser('x', converter, validator, xCollector);
    var yParser = new ValueParser('y', converter, validator, yCollector);
    var zParser = new ValueParser('z', converter, validator, zCollector);
    parser.args.push(xParser);
    parser.args.push(yParser);
    parser.args.push(zParser);
    return {x: xCollector, y: yCollector, z: zCollector};
}

function checkMultipleArgumentCollectors(assert, iterator, delegate, collectors) {
    assert.equals(collectors.x.capture(iterator, delegate), '1', 'x captured');
    assert.equals(collectors.y.capture(iterator, delegate), '2', 'y captured');
    assert.equals(collectors.z.capture(iterator, delegate), '3', 'z captured');
}

test('multiple required argument parser collects all values', createCase({
    args: ['1', '2', '3'],
    logs: {
    },
    setup: setupMultiArgumentParser,
    check: checkMultipleArgumentCollectors
}));

test('multiple required argument parser observes missing values', createCase({
    args: [],
    logs: {
        error0: 'Expected: x'
    },
    setup: setupMultiArgumentParser
}));

function setupArgumentsAndFlagsParsers(parser) {
    var converter = Converter.lift({
        convert: String
    });
    var validator = Validator.lift({
        validate: True
    });
    var xCollector = new ValueCollector('x', null, true);
    var yCollector = new ValueCollector('y', null, true);
    var zCollector = new ValueCollector('z', null, true);
    var xParser = new ValueParser('x', converter, validator, xCollector, true);
    var yParser = new ValueParser('y', converter, validator, yCollector, true);
    var zParser = new ValueParser('z', converter, validator, zCollector, true);
    parser.args.push(xParser);
    parser.args.push(yParser);
    parser.args.push(zParser);
    parser.flags['-x'] = xParser;
    parser.flags['-y'] = yParser;
    parser.flags['-z'] = zParser;
    return {x: xCollector, y: yCollector, z: zCollector};
}

function True() {
    return true;
}

test('parser accepts interleaved combination of positional and flag arguments', createCase({
    args: ['1', '-z', '3', '2'],
    setup: setupArgumentsAndFlagsParsers,
    check: checkMultipleArgumentCollectors
}));

test('parser accepts interleaved combination of positional and compact flag arguments', createCase({
    args: ['-y2', '1', '-z3'],
    setup: setupArgumentsAndFlagsParsers,
    check: checkMultipleArgumentCollectors
}));

function setupConverterValidatorParser(commandParser) {
    var converter = Converter.lift(Number);
    var validator = Validator.lift(isEven);
    var collector = new ValueCollector('x', null, true);
    var parser = new ValueParser('x', converter, validator, collector, true);
    commandParser.args.push(parser);
    commandParser.flags['-x'] = parser;
    return collector;
}

function checkConvertedValue(assert, iterator, delegate, collector) {
    assert.equals(collector.capture(iterator, delegate), 10, 'captures valid value');
}

function isEven(n) {
    return n % 2 === 0;
}

test('parser converts argument', createCase({
    args: ['10'],
    logs: {
    },
    setup: setupConverterValidatorParser,
    check: checkConvertedValue
}));

test('parser fails to validate argument', createCase({
    args: ['a'],
    logs: {
        error0: 'Invalid: x'
    },
    setup: setupConverterValidatorParser,
    check: checkDefaultedValue
}));

test('parser converts flag', createCase({
    args: ['-x10'],
    logs: {
    },
    setup: setupConverterValidatorParser,
    check: checkConvertedValue
}));

test('parser fails to validate flag', createCase({
    args: ['-xa'],
    logs: {
        error0: 'Invalid: x'
    },
    setup: setupConverterValidatorParser,
    check: checkDefaultedValue
}));

function setupArrayCollectorParser(commandParser) {
    var converter = Converter.lift(Number);
    var validator = Validator.lift(isEven);
    var collector = new ArrayCollector('x', 'x', 3, 4);
    var parser = new ValueParser('x', converter, validator, collector, true);
    commandParser.tail = parser;
    commandParser.flags['-x'] = parser;
    return collector;
}

function checkArray(assert, iterator, delegate, collector) {
    assert.deepEquals(collector.capture(iterator, delegate), [2, 4, 6], 'captures array of values');
}

function checkEmptyArray(assert, iterator, delegate, collector) {
    assert.deepEquals(collector.capture(iterator, delegate), [], 'captures empty array');
}

test('parser collects array of arguments', createCase({
    args: ['2', '4', '6'],
    logs: {
    },
    setup: setupArrayCollectorParser,
    check: checkArray
}));

test('parser collects array from tail arguments and flags', createCase({
    args: ['2', '-x4', '6'],
    logs: {
    },
    setup: setupArrayCollectorParser,
    check: checkArray
}));

test('parser collects array of arguments dispite one invalid value', createCase({
    args: ['2', '4', '6', 'not like the others'],
    logs: {
        error0: 'Invalid: x'
    },
    setup: setupArrayCollectorParser,
    check: checkArray
}));

test('parser stops parsing at the first invalid value', createCase({
    args: ['2', '4', '6', 'not like the others', '8'],
    logs: {
        error0: 'Invalid: x'
    },
    setup: setupArrayCollectorParser,
    check: checkArray
}));

test('parser recognizes too few arguments', createCase({
    args: [],
    logs: {
        error0: 'Too few: x'
    },
    setup: setupArrayCollectorParser,
    check: checkEmptyArray
}));

test('parser recognizes too many arguments', createCase({
    args: ['0', '2', '4', '8'],
    logs: {
        error0: 'Too many: x'
    },
    setup: setupArrayCollectorParser,
    check: checkArray
}));

function setupDifferenceCollectorParser(parser, iterator) {
    iterator.plusFlags = true;
    var converter = Converter.lift(Number);
    var validator = Validator.lift(True);
    var collector = new DifferenceCollector('n', 5);
    parser.plus = new ValueParser('n', converter, validator, collector);
    parser.minus = new ValueParser('n', converter, validator, collector);
    return collector;
}

function makeValueChecker(value) {
    return function checkValue(assert, iterator, delegate, collector) {
        assert.equals(collector.capture(iterator, delegate), value, 'captured expected value');
    };
}

test('parser finds no difference with no args', createCase({
    args: [],
    logs: {},
    setup: setupDifferenceCollectorParser,
    check: makeValueChecker(5)
}));

test('parser takes difference one step forward, two steps back', createCase({
    args: ['+1', '-2'],
    logs: {},
    setup: setupDifferenceCollectorParser,
    check: makeValueChecker(4)
}));

function setupVerbosityParser(parser, iterator) {
    var collector = new DifferenceCollector('verbosity', 0, -5, 5);
    parser.flags['-v'] = new FlagParser(1, collector);
    parser.flags['-q'] = new FlagParser(-1, collector);
    return collector;
}

test('parser finds increased verbosity', createCase({
    args: ['-vv'],
    logs: {},
    setup: setupVerbosityParser,
    check: makeValueChecker(2)
}));

test('parser finds decreased verbosity', createCase({
    args: ['-qqqqq'],
    logs: {},
    setup: setupVerbosityParser,
    check: makeValueChecker(-5)
}));

test('parser finds too much verbosity', createCase({
    args: ['-vvvvvv'],
    logs: {
        error0: 'Too much: verbosity (maximum is 5)'
    },
    setup: setupVerbosityParser,
    check: makeValueChecker(6)
}));

test('parser finds too little verbosity', createCase({
    args: ['-qqqqqq'],
    logs: {
        error0: 'Too little: verbosity (minimum is -5)'
    },
    setup: setupVerbosityParser,
    check: makeValueChecker(-6)
}));

function setupEscapedExpressionParser(parser) {
    var subParser = new Parser();
    parser.escape = subParser;
    var valueCollector = new ValueCollector('x', null, true);
    var valueParser = new ValueParser('x', new Converter(), new Validator(), valueCollector);
    subParser.args.push(valueParser);
    return valueCollector;
}

test('escaped expression subparser captures arguments', createCase({
    args: ['--', '10'],
    logs: {
    },
    setup: setupEscapedExpressionParser,
    check: makeValueChecker('10')
}));

function setupInitialFlagsParser(parser, iterator) {
    iterator.initialFlag();
    var collector = new ValueCollector('x', false, true);
    parser.flags['-x'] = new FlagParser(true, collector);
    return collector;
}

test('initial flag parser recognizes first argument as flag', createCase({
    args: ['x'],
    logs: {},
    setup: setupInitialFlagsParser,
    check: makeValueChecker(true)
}));

test('initial flag parser recognizes first flag', createCase({
    args: ['-x'],
    logs: {},
    setup: setupInitialFlagsParser,
    check: makeValueChecker(true)
}));
