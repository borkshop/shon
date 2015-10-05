'use strict';

var test = require('tape');
var Schema = require('../schema');
var Delegate = require('./delegate');

test('one arg schema, no args given', function t(assert) {
    var schema = new Schema();
    schema.arg('foo');
    var delegate = new Delegate(assert, {
        error0: 'Expected value for: foo'
    });
    var options = schema.parse([], 0, delegate);
    assert.deepEqual(options, {foo: undefined});
    delegate.end();
});

test('two arg schema, no args given', function t(assert) {
    var schema = new Schema();
    schema.arg('foo');
    schema.arg('bar');
    var delegate = new Delegate(assert, {
        error0: 'Expected value for: foo',
        error1: 'Expected value for: bar'
    });
    var options = schema.parse([], 0, delegate);
    assert.deepEqual(options, {
        foo: undefined,
        bar: undefined
    });
    delegate.end();
});

test('two arg schema, one arg given', function t(assert) {
    var schema = new Schema();
    schema.arg('foo');
    schema.arg('bar');
    var delegate = new Delegate(assert, {
        error0: 'Expected value for: bar'
    });
    var options = schema.parse(['foo'], 0, delegate);
    assert.deepEqual(options, {
        foo: 'foo',
        bar: undefined
    });
    delegate.end();
});

test('two arg schema, two args given', function t(assert) {
    var schema = new Schema();
    schema.arg('foo');
    schema.arg('bar');
    var delegate = new Delegate(assert, {});
    var options = schema.parse(['foo', 'bar'], 0, delegate);
    assert.deepEqual(options, {
        foo: 'foo',
        bar: 'bar'
    });
    delegate.end();
});

// TODO args and options interleaved
