'use strict';

var test = require('tape');

var Delegate = require('./delegate');
var Cursor = require('../cursor');
var Parser = require('../parser');
var ValueParser = require('../value-parser');
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
    error0: 'Expected no further arguments'
}));

test('extraneous argument', Delegate.case(['arg'], {
    error0: 'Expected no further arguments'
}));

test('extraneous argument after escape', Delegate.case(['--', 'arg'], {
    error0: 'Expected no further arguments'
}));

test('grabs a non-optional argument', function t(assert) {
    var parser = new Parser();
    var cursor = new Cursor(['bar'], 0);
    var delegate = new Delegate(assert, {});
    parser.args.push(new ValueParser('foo'));
    var context = {};
    parser.parse(cursor, delegate, context);
    assert.deepEquals(context, {'foo': 'bar'}, 'produces context');
});

test('complains of a missing argument', function t(assert) {
    var parser = new Parser();
    var cursor = new Cursor([], 0);
    var delegate = new Delegate(assert, {
        error0: 'Expected value for: foo'
    });
    parser.args.push(new ValueParser('foo'));
    var context = {foo: 'baz'};
    parser.parse(cursor, delegate, context);
    assert.deepEquals(context, {foo: 'baz'}, 'context contains default');
});

test('takes a default for a missing option', function t(assert) {
    var parser = new Parser();
    var cursor = new Cursor([], 0);
    var delegate = new Delegate(assert, {});
    parser.options.foo = new ValueParser('foo');
    var context = {foo: 'baz'};
    parser.parse(cursor, delegate, context);
    assert.deepEquals(context, {'foo': 'baz'}, 'context contains default');
});

test('accepts an option', function t(assert) {
    var parser = new Parser();
    var cursor = new Cursor(['--foo', 'bar'], 0);
    var delegate = new Delegate(assert, {});
    parser.options['--foo'] = new ValueParser('foo');
    var context = {};
    parser.parse(cursor, delegate, context);
    assert.deepEquals(context, {'foo': 'bar'}, 'context contains default');
});

test('accepts a sequence of boolean flags', function t(assert) {
    var parser = new Parser();
    parser.options['-a'] = new BooleanParser('alpha');
    parser.options['-b'] = new BooleanParser('beta');
    parser.options['-c'] = new BooleanParser('gamma');
    var cursor = new Cursor(['-abc'], 0);
    var delegate = new Delegate(assert, {});
    var context = {};
    parser.parse(cursor, delegate, context);
    assert.deepEquals(context, {alpha: true, beta: true, gamma: true}, 'context contains flags');
});

test('counts flags', function t(assert) {
    var parser = new Parser();
    parser.options['-v'] = new CounterParser('verbose');
    var cursor = new Cursor(['-vvv'], 0);
    var delegate = new Delegate(assert, {});
    var context = {verbose: 0};
    parser.parse(cursor, delegate, context);
    assert.deepEquals(context, {verbose: 3}, 'elevates verbosity');
});

test('up and down counter', function t(assert) {
    var parser = new Parser();
    parser.options['-v'] = new CounterParser('verbose');
    parser.options['-q'] = new CounterParser('verbose', -1);
    var cursor = new Cursor(['-vvvq'], 0);
    var delegate = new Delegate(assert, {});
    var context = {verbose: 0};
    parser.parse(cursor, delegate, context);
    assert.deepEquals(context, {verbose: 2}, 'zeros in on verbosity');
});

test('plus or minus', function t(assert) {
    var parser = new Parser();
    parser.options['+n'] = new CounterParser('number');
    parser.options['-n'] = new CounterParser('number', -1);
    parser.pluses = true;
    var cursor = new Cursor(['+nnn', '-nn'], 0);
    var delegate = new Delegate(assert, {});
    var context = {number: 0};
    parser.parse(cursor, delegate, context);
    assert.deepEquals(context, {number: 1}, 'finds number');
});

test('no pluses', function t(assert) {
    var parser = new Parser();
    parser.options['+n'] = new CounterParser('number');
    parser.options['-n'] = new CounterParser('number', -1);
    var cursor = new Cursor(['-nn', '+nnn'], 0);
    var delegate = new Delegate(assert, {
        error0: 'Expected no further arguments'
    });
    var context = {number: 0};
    parser.parse(cursor, delegate, context);
    assert.deepEquals(context, {number: -2}, 'finds number');
});

test('complains but deals with redundancy', function t(assert) {
    assert.end();
});
