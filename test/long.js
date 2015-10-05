'use strict';

var test = require('tape');
var Schema = require('../schema');
var Delegate = require('./delegate');

test('long option, not provided', function t(assert) {
    var schema = new Schema();
    schema.option('--long');
    var delegate = new Delegate(assert, {});
    var options = schema.parse([], 0, delegate);
    assert.deepEqual(options, {long: undefined});
    delegate.end();
});

test('long option, provided', function t(assert) {
    var schema = new Schema();
    schema.option('--long');
    var delegate = new Delegate(assert, {});
    var options = schema.parse(['--long', 'is long'], 0, delegate);
    assert.deepEqual(options, {long: 'is long'});
    delegate.end();
});

test('long option, provided in key=value form', function t(assert) {
    var schema = new Schema();
    schema.option('--long');
    var delegate = new Delegate(assert, {});
    var options = schema.parse(['--long=is long'], 0, delegate);
    assert.deepEqual(options, {long: 'is long'});
    delegate.end();
});

test('long option, provided but without value', function t(assert) {
    var schema = new Schema();
    schema.option('--long');
    var delegate = new Delegate(assert, {
        error0: 'Expected value for: long'
    });
    var options = schema.parse(['--long'], 0, delegate);
    assert.deepEqual(options, {long: undefined});
    delegate.end();
});

test('long options, redudnantly provided, last overrides', function t(assert) {
    var schema = new Schema();
    schema.option('--long');
    var delegate = new Delegate(assert, {});
    var options = schema.parse(['--long', 'first', '--long', 'last'], 0, delegate);
    assert.deepEqual(options, {long: 'last'});
    delegate.end();
});

test('long option with escape for value followed by escape and option-like args', function t(assert) {
    var schema = new Schema();
    schema.option('--long');
    var delegate = new Delegate(assert, {
        error0: 'Unexpected argument: --long'
    });
    var options = schema.parse(['--long', '--', '--', '--long'], 0, delegate);
    assert.deepEqual(options, {long: '--'});
    delegate.end();
});
