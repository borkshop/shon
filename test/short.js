'use strict';

var test = require('tape');
var Schema = require('../schema');
var Delegate = require('./delegate');

test('short option, not provided', function t(assert) {
    var schema = new Schema();
    schema.option('-x');
    var delegate = new Delegate(assert, {});
    var options = schema.parse([], 0, delegate);
    assert.deepEqual(options, {x: undefined});
    delegate.end();
});

test('short option, provided', function t(assert) {
    var schema = new Schema();
    schema.option('-x');
    var delegate = new Delegate(assert, {});
    var options = schema.parse(['-x', 'value'], 0, delegate);
    assert.deepEqual(options, {x: 'value'});
    delegate.end();
});

test('short option, missing value', function t(assert) {
    var schema = new Schema();
    schema.option('-x');
    var delegate = new Delegate(assert, {
        error0: 'Expected value for: x'
    });
    var options = schema.parse(['-x'], 0, delegate);
    assert.deepEqual(options, {x: undefined});
    delegate.end();
});

test('short option, provided, extra argument', function t(assert) {
    var schema = new Schema();
    schema.option('-x');
    var delegate = new Delegate(assert, {
        error0: 'Unexpected argument: extra'
    });
    var options = schema.parse(['-x', 'X', 'extra'], 0, delegate);
    assert.deepEqual(options, {x: 'X'});
    delegate.end();
});

// TODO consider redundancy error
test('short option, provided multiple times, final overrides', function t(assert) {
    var schema = new Schema();
    schema.option('-x');
    var delegate = new Delegate(assert, {});
    var options = schema.parse(['-x', 'X', '-x', 'Y'], 0, delegate);
    assert.deepEqual(options, {x: 'Y'});
    delegate.end();
});

test('short options, aggregated, final overrides', function t(assert) {
    var schema = new Schema();
    schema.option('-x');
    var delegate = new Delegate(assert, {});
    var options = schema.parse(['-xx', 'X', 'Y'], 0, delegate);
    assert.deepEqual(options, {x: 'Y'});
    delegate.end();
});

test('short option, provided with shortArgument', function t(assert) {
    var schema = new Schema();
    schema.shortArguments();
    schema.option('-x');
    var delegate = new Delegate(assert, {});
    var options = schema.parse(['-x', 'value'], 0, delegate);
    assert.deepEqual(options, {x: 'value'});
    delegate.end();
});

test('boolean option, not provided', function t(assert) {
    var schema = new Schema();
    schema.option('-x').bool();
    var delegate = new Delegate(assert, {});
    var options = schema.parse([], 0, delegate);
    assert.deepEqual(options, {x: false});
    delegate.end();
});

test('boolean option, provided', function t(assert) {
    var schema = new Schema();
    schema.option('-x').bool();
    var delegate = new Delegate(assert, {});
    var options = schema.parse(['-x'], 0, delegate);
    assert.deepEqual(options, {x: true});
    delegate.end();
});

test('push option, provided', function t(assert) {
    var schema = new Schema();
    schema.option('-x').push();
    var delegate = new Delegate(assert, {});
    var options = schema.parse([], 0, delegate);
    assert.deepEqual(options, {x: []});
    delegate.end();
});

test('push option, multiple provided', function t(assert) {
    var schema = new Schema();
    schema.option('-x').push();
    var delegate = new Delegate(assert, {});
    var options = schema.parse(['-x', '1', '-x', '2'], 0, delegate);
    assert.deepEqual(options, {x: ['1', '2']});
    delegate.end();
});

test('push option, multiple provided compactly', function t(assert) {
    var schema = new Schema();
    schema.option('-x').push();
    var delegate = new Delegate(assert, {});
    var options = schema.parse(['-xx', '1', '2'], 0, delegate);
    assert.deepEqual(options, {x: ['1', '2']});
    delegate.end();
});

// TODO compose push and int or other coerce or parse
