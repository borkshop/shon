'use strict';

var test = require('tape');
var Cursor = require('../cursor');
var Iterator = require('../iterator');

test('empty', function t(assert) {
    var cursor = new Cursor([], 0);
    var iterator = new Iterator(cursor);

    assert.equals(iterator.hasFlag(), false, 'no flags');
    assert.equals(iterator.hasArgument(), false, 'no arguments');
    assert.end();
});

test('lone short flag', function t(assert) {
    var cursor = new Cursor(['-a'], 0);
    var iterator = new Iterator(cursor);
    assert.ok(iterator.hasFlag(), 'has short flag');

    assert.equals(iterator.shiftFlag(), '-a', 'got short flag');
    assert.equals(iterator.hasFlag(), false, 'no further flags');
    assert.equals(iterator.hasArgument(), false, 'no further arguments');
    assert.end();
});

test('lone long flag', function t(assert) {
    var cursor = new Cursor(['--a'], 0);
    var iterator = new Iterator(cursor);
    assert.ok(iterator.hasFlag(), 'has long flag');

    assert.equals(iterator.shiftFlag(), '--a', 'gets long flag');
    assert.ok(!iterator.hasFlag(), 'no more flags after long flag');

    assert.equals(iterator.hasArgument(), false, 'no further arguments');
    assert.end();
});

test('lone escape', function t(assert) {
    var cursor = new Cursor(['--'], 0);
    var iterator = new Iterator(cursor);
    assert.equals(iterator.hasFlag(), false, 'escape is not an flag');
    assert.equals(iterator.shiftEscape(), true, 'escape consumed');
    assert.equals(iterator.hasArgument(), false, 'no further arguments');
    assert.end();
});

test('lone hyphen', function t(assert) {
    var cursor = new Cursor(['-'], 0);
    var iterator = new Iterator(cursor);
    assert.ok(!iterator.hasFlag(), 'hyphen is not an flag');
    assert.equal(iterator.shiftArgument(), '-', 'hyphen is an argument');
    assert.equals(iterator.hasArgument(), false, 'no further arguments');
    assert.end();
});

test('short flags', function t(assert) {
    var cursor = new Cursor(['-a', '-b'], 0);
    var iterator = new Iterator(cursor);

    assert.equals(iterator.hasFlag(), true, 'has short flag 1');
    assert.equals(iterator.shiftFlag(), '-a', 'got short flag 1');

    assert.equals(iterator.hasFlag(), true, 'has short flag 2');
    assert.equals(iterator.shiftFlag(), '-b', 'got short flag 2');

    assert.equals(iterator.hasFlag(), false, 'no further flags');
    assert.equals(iterator.hasArgument(), false, 'no further arguments');
    assert.end();
});

test('escape then flag', function t(assert) {
    var cursor = new Cursor(['--', '-a'], 0);
    var iterator = new Iterator(cursor);
    assert.equals(iterator.hasFlag(), false, 'escape is not an flag, nor that after');
    assert.equals(iterator.shiftEscape(), true, 'escape is consumed');
    assert.equals(iterator.shiftArgument(), '-a', 'argument after escape');
    assert.equals(iterator.hasArgument(), false, 'no further arguments');
    assert.end();
});

test('escape then escape', function t(assert) {
    var cursor = new Cursor(['--', '--'], 0);
    var iterator = new Iterator(cursor);
    assert.equals(iterator.hasFlag(), false, 'escape is not an flag, nor that after');
    assert.equals(iterator.shiftEscape(), true, 'escape consumed');
    assert.equals(iterator.shiftEscape(), false, 'second escape not consumed');
    assert.equals(iterator.shiftArgument(), '--', 'escape after escape');
    assert.equals(iterator.hasArgument(), false, 'no further arguments');
    assert.end();
});

test('read flags as arguments', function t(assert) {
    var cursor = new Cursor(['-a', '-b'], 0);
    var iterator = new Iterator(cursor);

    assert.equals(iterator.shiftArgument(), '-a', 'can consume flag as plain arg1');
    assert.equals(iterator.shiftArgument(), '-b', 'can consume flag as plain arg2');

    assert.equals(iterator.hasArgument(), false, 'no further arguments');
    assert.end();
});

test('short flags with arguments', function t(assert) {
    var cursor = new Cursor(['-abc'], 0);
    var iterator = new Iterator(cursor);

    assert.equals(iterator.hasFlag(), true, 'has -a flag');
    assert.equals(iterator.shiftFlag(), '-a', 'shift one flag');
    assert.equals(iterator.reserveFlag, '-', 'reserves - flag');
    assert.equals(iterator.reserve, 'bc', 'reserves bc');

    assert.equals(iterator.hasFlag(), true, 'has -b flag');
    assert.equals(iterator.shiftFlag(), '-b', 'shift second flag');
    assert.equals(iterator.reserveFlag, '-', 'reserves - flag');
    assert.equals(iterator.reserve, 'c', 'reserves c');

    assert.equals(iterator.hasFlag(), true, 'has -c flag');
    assert.equals(iterator.shiftFlag(), '-c', 'shift third flag');
    assert.equals(iterator.reserveFlag, null, 'no reserved flag');
    assert.equals(iterator.reserve, null, 'no more reserve');

    assert.equals(iterator.hasArgument(), false, 'no further arguments');
    assert.end();
});
