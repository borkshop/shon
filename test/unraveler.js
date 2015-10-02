'use strict';

var test = require('tape');
var Cursor = require('../cursor');
var Unraveler = require('../unraveler');

test('empty', function t(assert) {
    var cursor = new Cursor([], 0);
    var unraveler = new Unraveler(cursor);

    assert.equals(unraveler.hasOption(), false, 'no options');
    assert.equals(unraveler.nextArgument(), null, 'no arguments');
    assert.end();
});

test('lone short option', function t(assert) {
    var cursor = new Cursor(['-a'], 0);
    var unraveler = new Unraveler(cursor);
    assert.ok(unraveler.hasOption(), 'has short option');

    assert.equals(unraveler.nextOption(), '-a', 'got short option');
    assert.equals(unraveler.hasOption(), false, 'no further options');
    assert.equals(unraveler.nextArgument(), null, 'no further arguments');
    assert.end();
});

test('lone long option', function t(assert) {
    var cursor = new Cursor(['--a'], 0);
    var unraveler = new Unraveler(cursor);
    assert.ok(unraveler.hasOption(), 'has long option');

    assert.equals(unraveler.nextOption(), '--a', 'gets long option');
    assert.ok(!unraveler.hasOption(), 'no more options after long option');

    assert.equals(unraveler.nextArgument(), null, 'no further arguments');
    assert.end();
});

test('lone escape', function t(assert) {
    var cursor = new Cursor(['--'], 0);
    var unraveler = new Unraveler(cursor);
    assert.equals(unraveler.hasOption(), false, 'escape is not an option');
    assert.equals(unraveler.nextArgument(), null, 'escape is not an argument');
    assert.end();
});

test('lone hyphen', function t(assert) {
    var cursor = new Cursor(['-'], 0);
    var unraveler = new Unraveler(cursor);
    assert.ok(!unraveler.hasOption(), 'hyphen is not an option');
    assert.equal(unraveler.nextArgument(), '-', 'hyphen is an argument');
    assert.equal(unraveler.nextArgument(), null, 'no further arguments');
    assert.end();
});

test('short options', function t(assert) {
    var cursor = new Cursor(['-a', '-b'], 0);
    var unraveler = new Unraveler(cursor);

    assert.equals(unraveler.hasOption(), true, 'has short option 1');
    assert.equals(unraveler.nextOption(), '-a', 'got short option 1');

    assert.equals(unraveler.hasOption(), true, 'has short option 2');
    assert.equals(unraveler.nextOption(), '-b', 'got short option 2');

    assert.equals(unraveler.hasOption(), false, 'no further options');
    assert.equals(unraveler.nextArgument(), null, 'no further arguments');
    assert.end();
});

test('escape then option', function t(assert) {
    var cursor = new Cursor(['--', '-a'], 0);
    var unraveler = new Unraveler(cursor);
    assert.equals(unraveler.hasOption(), false, 'escape is not an option, nor that after');
    assert.equals(unraveler.nextArgument(), '-a', 'argument after escape');
    assert.equals(unraveler.nextArgument(), null, 'no further arguments');
    assert.end();
});

test('escape then escape', function t(assert) {
    var cursor = new Cursor(['--', '--'], 0);
    var unraveler = new Unraveler(cursor);
    assert.equals(unraveler.hasOption(), false, 'escape is not an option, nor that after');
    assert.equals(unraveler.nextArgument(), '--', 'escape after escape');
    assert.equals(unraveler.nextArgument(), null, 'no further arguments');
    assert.end();
});

test('read options as arguments', function t(assert) {
    var cursor = new Cursor(['-a', '-b'], 0);
    var unraveler = new Unraveler(cursor);

    assert.equals(unraveler.nextArgument(), '-a', 'can consume option as plain arg1');
    assert.equals(unraveler.nextArgument(), '-b', 'can consume option as plain arg2');
    assert.equals(unraveler.nextArgument(), null, 'no further arguments');

    assert.end();
});
