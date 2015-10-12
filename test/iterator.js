'use strict';

var test = require('tape');
var Cursor = require('../cursor');
var Iterator = require('../iterator');

test('empty', function t(assert) {
    var cursor = new Cursor([], 0);
    var iterator = new Iterator(cursor);

    assert.equals(iterator.hasOption(), false, 'no options');
    assert.equals(iterator.nextArgument(), null, 'no arguments');
    assert.end();
});

test('lone short option', function t(assert) {
    var cursor = new Cursor(['-a'], 0);
    var iterator = new Iterator(cursor);
    assert.ok(iterator.hasOption(), 'has short option');

    assert.equals(iterator.nextOption(), '-a', 'got short option');
    assert.equals(iterator.hasOption(), false, 'no further options');
    assert.equals(iterator.nextArgument(), null, 'no further arguments');
    assert.end();
});

test('lone long option', function t(assert) {
    var cursor = new Cursor(['--a'], 0);
    var iterator = new Iterator(cursor);
    assert.ok(iterator.hasOption(), 'has long option');

    assert.equals(iterator.nextOption(), '--a', 'gets long option');
    assert.ok(!iterator.hasOption(), 'no more options after long option');

    assert.equals(iterator.nextArgument(), null, 'no further arguments');
    assert.end();
});

test('lone escape', function t(assert) {
    var cursor = new Cursor(['--'], 0);
    var iterator = new Iterator(cursor);
    assert.equals(iterator.hasOption(), false, 'escape is not an option');
    assert.equals(iterator.nextArgument(), null, 'escape is not an argument');
    assert.end();
});

test('lone hyphen', function t(assert) {
    var cursor = new Cursor(['-'], 0);
    var iterator = new Iterator(cursor);
    assert.ok(!iterator.hasOption(), 'hyphen is not an option');
    assert.equal(iterator.nextArgument(), '-', 'hyphen is an argument');
    assert.equal(iterator.nextArgument(), null, 'no further arguments');
    assert.end();
});

test('short options', function t(assert) {
    var cursor = new Cursor(['-a', '-b'], 0);
    var iterator = new Iterator(cursor);

    assert.equals(iterator.hasOption(), true, 'has short option 1');
    assert.equals(iterator.nextOption(), '-a', 'got short option 1');

    assert.equals(iterator.hasOption(), true, 'has short option 2');
    assert.equals(iterator.nextOption(), '-b', 'got short option 2');

    assert.equals(iterator.hasOption(), false, 'no further options');
    assert.equals(iterator.nextArgument(), null, 'no further arguments');
    assert.end();
});

test('escape then option', function t(assert) {
    var cursor = new Cursor(['--', '-a'], 0);
    var iterator = new Iterator(cursor);
    assert.equals(iterator.hasOption(), false, 'escape is not an option, nor that after');
    assert.equals(iterator.nextArgument(), '-a', 'argument after escape');
    assert.equals(iterator.nextArgument(), null, 'no further arguments');
    assert.end();
});

test('escape then escape', function t(assert) {
    var cursor = new Cursor(['--', '--'], 0);
    var iterator = new Iterator(cursor);
    assert.equals(iterator.hasOption(), false, 'escape is not an option, nor that after');
    assert.equals(iterator.nextArgument(), '--', 'escape after escape');
    assert.equals(iterator.nextArgument(), null, 'no further arguments');
    assert.end();
});

test('read options as arguments', function t(assert) {
    var cursor = new Cursor(['-a', '-b'], 0);
    var iterator = new Iterator(cursor);

    assert.equals(iterator.nextArgument(), '-a', 'can consume option as plain arg1');
    assert.equals(iterator.nextArgument(), '-b', 'can consume option as plain arg2');
    assert.equals(iterator.nextArgument(), null, 'no further arguments');

    assert.end();
});

test('cut-like arguments', function t(assert) {
    var cursor = new Cursor(['-d, ', '-f:'], 0);
    var iterator = new Iterator(cursor);
    iterator.shortArguments = true;

    assert.equals(iterator.hasOption(), true, 'has an option');
    assert.equals(iterator.hasArgument(), true, 'could be used as an argument');
    assert.equals(iterator.nextOption(), '-d', 'gets -d option');
    assert.equals(iterator.hasArgument(), true, 'has argument');
    assert.equals(iterator.nextArgument(), ', ', 'gets ", " value for option');

    assert.equals(iterator.hasOption(), true, '-f is up next');
    assert.equals(iterator.hasArgument(), true, 'it could be used as an argument');
    assert.equals(iterator.nextOption(), '-f', 'gets -f option');
    assert.equals(iterator.hasArgument(), true, 'has argument');
    assert.equals(iterator.nextArgument(), ':', 'gets ":" value for option');

    assert.equals(iterator.hasOption(), false, 'no further options');
    assert.equals(iterator.hasArgument(), false, 'no further arguments');

    assert.end();
});
