'use strict';

var test = require('tape');
var Schema = require('../schema');
var Delegate = require('./delegate');

test('long and short forms unraveled do not interfere', function t(assert) {
    var schema = new Schema();
    schema.option('-s');
    schema.option('--long');
    var delegate = new Delegate(assert, {});
    var options = schema.parse([
        '-s', '--long=is long',
    ], 0, delegate);
    assert.deepEqual(options, {s: '--long=is long', long: undefined});
    delegate.end();
});

test('long and short forms unraveled do not interfere', function t(assert) {
    var schema = new Schema();
    schema.shortArguments();
    schema.option('-s');
    schema.option('--long');
    var delegate = new Delegate(assert, {});
    var options = schema.parse([
        '-sshort', '--long=is long',
    ], 0, delegate);
    assert.deepEqual(options, {s: 'short', long: 'is long'});
    delegate.end();
});
