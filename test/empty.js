'use strict';

var test = require('tape');
var Schema = require('../schema');
var Delegate = require('./delegate');

test('empty schema, empty args', function t(assert) {
    var schema = new Schema();
    var delegate = new Delegate(assert, {});
    var options = schema.parse([], 0, delegate);
    assert.deepEqual(options, {});
    delegate.end();
});

test('empty schema, unexpected args', function t(assert) {
    var schema = new Schema();
    var delegate = new Delegate(assert, {
        error0: 'Unexpected argument: foo'
    });
    var options = schema.parse(['foo'], 0, delegate);
    assert.deepEqual(options, {});
    delegate.end();
});

test('empty schema, no args but escape', function t(assert) {
    var schema = new Schema();
    var delegate = new Delegate(assert, {});
    var options = schema.parse(['--'], 0, delegate);
    assert.deepEqual(options, {});
    delegate.end();
});

test('empty schema, double escape', function t(assert) {
    var schema = new Schema();
    var delegate = new Delegate(assert, {
        error0: 'Unexpected argument: --'
    });
    var options = schema.parse(['--', '--'], 0, delegate);
    assert.deepEqual(options, {});
    delegate.end();
});

test('empty schema, unrecognized long option', function t(assert) {
    var schema = new Schema();
    var delegate = new Delegate(assert, {
        error0: 'Unexpected option: --foo'
    });
    var options = schema.parse(['--foo'], 0, delegate);
    assert.deepEqual(options, {});
    delegate.end();
});

test('empty schema, unrecognized short option', function t(assert) {
    var schema = new Schema();
    var delegate = new Delegate(assert, {
        error0: 'Unexpected option: -f'
    });
    var options = schema.parse(['-f'], 0, delegate);
    assert.deepEqual(options, {});
    delegate.end();
});

test('empty schema, unrecognized short options', function t(assert) {
    var schema = new Schema();
    var delegate = new Delegate(assert, {
        error0: 'Unexpected option: -f',
        error1: 'Unexpected option: -b'
    });
    var options = schema.parse(['-f', '-b'], 0, delegate);
    assert.deepEqual(options, {});
    delegate.end();
});

test('empty schema, unrecognized combined short options', function t(assert) {
    var schema = new Schema();
    var delegate = new Delegate(assert, {
        error0: 'Unexpected option: -f',
        error1: 'Unexpected option: -b'
    });
    var options = schema.parse(['-fb'], 0, delegate);
    assert.deepEqual(options, {});
    delegate.end();
});
