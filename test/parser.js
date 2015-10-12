'use strict';

var test = require('tape');

var Delegate = require('./delegate');
var Cursor = require('../cursor');
var Iterator = require('../iterator');
var Parser = require('../parser');
var ValueParser = require('../value-parser');
var ArrayParser = require('../array-parser');
var BooleanParser = require('../boolean-parser');
var CounterParser = require('../counter-parser');

test('one unrecognized flag', Delegate.case(['-a'], {
    error0: 'Unexpected option: -a'
}));

test('multiple unrecognized flags combined', Delegate.case(['-ab'], {
    error0: 'Unexpected option: -a',
    error1: 'Unexpected option: -b'
}));

test('one unrecognized option', Delegate.case(['--a'], {
    error0: 'Unexpected option: --a'
}));

test('two unrecognized options', Delegate.case(['--a', '--b'], {
    error0: 'Unexpected option: --a',
    error1: 'Unexpected option: --b'
}));

test('just an escape', Delegate.case(['--'], {
}));

test('double escape', Delegate.case(['--', '--'], {
    error0: 'Unexpected argument: --'
}));

test('extraneous argument', Delegate.case(['arg'], {
    error0: 'Unexpected argument: arg'
}));

test('extraneous argument after escape', Delegate.case(['--', 'arg'], {
    error0: 'Unexpected argument: arg'
}));

test('grabs a non-optional argument', function t(assert) {
    var parser = new Parser();
    var cursor = new Cursor(['bar'], 0);
    var iterator = new Iterator(cursor);
    var delegate = new Delegate(assert, {});
    parser.args.push(new ValueParser('foo'));
    var context = {};
    parser.parse(iterator, delegate, context);
    assert.deepEquals(context, {'foo': 'bar'}, 'produces context');
    delegate.end();
});

test('complains of a missing argument', function t(assert) {
    var parser = new Parser();
    var cursor = new Cursor([], 0);
    var iterator = new Iterator(cursor);
    var delegate = new Delegate(assert, {
        error0: 'Expected value for: foo'
    });
    parser.args.push(new ValueParser('foo'));
    var context = {foo: 'baz'};
    parser.parse(iterator, delegate, context);
    assert.deepEquals(context, {foo: 'baz'}, 'context contains default');
    delegate.end();
});

test('takes a default for a missing option', function t(assert) {
    var parser = new Parser();
    var cursor = new Cursor([], 0);
    var iterator = new Iterator(cursor);
    var delegate = new Delegate(assert, {});
    parser.options.foo = new ValueParser('foo');
    var context = {foo: 'baz'};
    parser.parse(iterator, delegate, context);
    assert.deepEquals(context, {'foo': 'baz'}, 'context contains default');
    delegate.end();
});

test('accepts an option', function t(assert) {
    var parser = new Parser();
    var cursor = new Cursor(['--foo', 'bar'], 0);
    var iterator = new Iterator(cursor);
    var delegate = new Delegate(assert, {});
    parser.options['--foo'] = new ValueParser('foo');
    var context = {};
    parser.parse(iterator, delegate, context);
    assert.deepEquals(context, {'foo': 'bar'}, 'context contains default');
    delegate.end();
});

test('accepts a sequence of boolean flags', function t(assert) {
    var parser = new Parser();
    parser.options['-a'] = new BooleanParser('alpha');
    parser.options['-b'] = new BooleanParser('beta');
    parser.options['-c'] = new BooleanParser('gamma');
    var cursor = new Cursor(['-abc'], 0);
    var iterator = new Iterator(cursor);
    var delegate = new Delegate(assert, {});
    var context = {};
    parser.parse(iterator, delegate, context);
    assert.deepEquals(context, {alpha: true, beta: true, gamma: true}, 'context contains flags');
    delegate.end();
});

test('counts flags', function t(assert) {
    var parser = new Parser();
    parser.options['-v'] = new CounterParser('verbose');
    var cursor = new Cursor(['-vvv'], 0);
    var iterator = new Iterator(cursor);
    var delegate = new Delegate(assert, {});
    var context = {verbose: 0};
    parser.parse(iterator, delegate, context);
    assert.deepEquals(context, {verbose: 3}, 'elevates verbosity');
    delegate.end();
});

test('up and down counter', function t(assert) {
    var parser = new Parser();
    parser.options['-v'] = new CounterParser('verbose');
    parser.options['-q'] = new CounterParser('verbose', -1);
    var cursor = new Cursor(['-vvvq'], 0);
    var iterator = new Iterator(cursor);
    var delegate = new Delegate(assert, {});
    var context = {verbose: 0};
    parser.parse(iterator, delegate, context);
    assert.deepEquals(context, {verbose: 2}, 'zeros in on verbosity');
    delegate.end();
});

test('plus or minus', function t(assert) {
    var parser = new Parser();
    parser.options['+n'] = new CounterParser('number');
    parser.options['-n'] = new CounterParser('number', -1);
    parser.plusOptions = true;
    var cursor = new Cursor(['+nnn', '-nn'], 0);
    var iterator = new Iterator(cursor);
    var delegate = new Delegate(assert, {});
    var context = {number: 0};
    parser.parse(iterator, delegate, context);
    assert.deepEquals(context, {number: 1}, 'finds number');
    delegate.end();
});

test('no pluses', function t(assert) {
    var parser = new Parser();
    parser.options['+n'] = new CounterParser('number');
    parser.options['-n'] = new CounterParser('number', -1);
    var cursor = new Cursor(['-nn', '+nnn'], 0);
    var iterator = new Iterator(cursor);
    var delegate = new Delegate(assert, {
        error0: 'Unexpected argument: +nnn'
    });
    var context = {number: 0};
    parser.parse(iterator, delegate, context);
    assert.deepEquals(context, {number: -2}, 'finds number');
    delegate.end();
});

test('--key=value style', function t(assert) {
    var parser = new Parser();
    var cursor = new Cursor(['-x', '--key=value'], 0);
    var iterator = new Iterator(cursor);
    var delegate = new Delegate(assert, {});
    parser.options['--key'] = new ValueParser('key');
    parser.options['-x'] = new BooleanParser('excalibur');
    var context = {};
    parser.parse(iterator, delegate, context);
    assert.deepEquals(context, {key: 'value', excalibur: true}, 'parses --key=value style long option');
    delegate.end();
});

test('option-like values', function t(assert) {
    var parser = new Parser();
    var cursor = new Cursor(['-x', '--key', '--value'], 0);
    var iterator = new Iterator(cursor);
    var delegate = new Delegate(assert, {});
    parser.options['--key'] = new ValueParser('key');
    parser.options['-x'] = new BooleanParser('excalibur');
    var context = {};
    parser.parse(iterator, delegate, context);
    assert.deepEquals(context, {key: '--value', excalibur: true}, 'parses option value that looks like option');
    delegate.end();
});

test('push long options onto an array', function t(assert) {
    var parser = new Parser();
    var cursor = new Cursor(['--letter', 'a', '--letter', 'b', '--letter', 'c'], 0);
    var iterator = new Iterator(cursor);
    var delegate = new Delegate(assert, {});
    parser.options['--letter'] = new ArrayParser('letters');
    var context = {letters: []};
    parser.parse(iterator, delegate, context);
    assert.deepEquals(context, {letters: ['a', 'b', 'c']}, 'parses repeated long options');
    delegate.end();
});

test('push short cut-like options onto an array', function t(assert) {
    var parser = new Parser();
    parser.shortArguments = true;
    var cursor = new Cursor(['-la', '-lb', '-lc'], 0);
    var iterator = new Iterator(cursor);
    var delegate = new Delegate(assert, {});
    parser.options['-l'] = new ArrayParser('letters');
    var context = {letters: []};
    parser.parse(iterator, delegate, context);
    assert.deepEquals(context, {letters: ['a', 'b', 'c']}, 'parses like cut');
    delegate.end();
});

test('push short options onto an array', function t(assert) {
    var parser = new Parser();
    var cursor = new Cursor(['-l', 'a', '-l', 'b', '-l', 'c'], 0);
    var iterator = new Iterator(cursor);
    var delegate = new Delegate(assert, {});
    parser.options['-l'] = new ArrayParser('letters');
    var context = {letters: []};
    parser.parse(iterator, delegate, context);
    assert.deepEquals(context, {letters: ['a', 'b', 'c']}, 'parses each -l');
    delegate.end();
});

test('push joined short options onto an array', function t(assert) {
    var parser = new Parser();
    var cursor = new Cursor(['-lll', 'a', 'b', 'c'], 0);
    var iterator = new Iterator(cursor);
    var delegate = new Delegate(assert, {});
    parser.options['-l'] = new ArrayParser('letters');
    var context = {letters: []};
    parser.parse(iterator, delegate, context);
    assert.deepEquals(context, {letters: ['a', 'b', 'c']}, 'parses each flag after -lll');
    delegate.end();
});

test('tail parser for vargs', function t(assert) {
    var parser = new Parser();
    var cursor = new Cursor(['a', 'b', 'c'], 0);
    var iterator = new Iterator(cursor);
    var delegate = new Delegate(assert, {});
    parser.tail = new ArrayParser('vargs');
    var context = {vargs: []};
    parser.parse(iterator, delegate, context);
    assert.deepEquals(context, {vargs: ['a', 'b', 'c']}, 'parses variable trailing args');
    delegate.end();
});

// TODO test('complains but deals with redundancy', function t(assert) {
// TODO     assert.end();
// TODO });
