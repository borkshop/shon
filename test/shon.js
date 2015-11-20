'use strict';

var test = require('tape');
var ShonParser = require('../shon-parser');
var Delegate = require('./delegate');
var Cursor = require('../cursor');
var ValueCollector = require('../value-collector');

function cases(cases) {
    return function t(assert) {
        for (var index = 0; index < cases.length; index++) {
            var test = cases[index];
            assert.comment(JSON.stringify(test.input));
            var logs = {};
            if (test.error) {
                logs.error0 = test.error;
                test.output = null;
            }
            var delegate = new Delegate(assert, logs);
            var cursor = new Cursor(test.input);
            var collector = new ValueCollector({});
            var parser = new ShonParser({collector: collector, required: false, json: test.json});
            var output = parser.parseValue(cursor, delegate);
            assert.deepEquals(output, test.output, 'output matches');
        }
        assert.end();
    };
}

test('shon', cases([
    {
        input: [],
        error: 'Expected value'
    },
    {
        input: [']'],
        error: 'Expected value'
    },
    {
        input: ['['],
        error: 'Expected remaining array or object'
    },
    {
        input: ['[', '--key'],
        error: 'Expected value'
    },
    {
        input: ['[', '--key', 'value'],
        error: 'Expected key for remaining object'
    },
    {
        input: ['[', '--key', 'value', 'value'],
        error: 'Expected key for remaining object'
    },
    {
        input: ['[', '--key=--value'],
        error: 'Unexpected flag'
    },
    {
        input: ['[', '--key', '--value'],
        error: 'Unexpected flag'
    },
    {
        input: [''],
        output: ''
    },
    {
        input: ['+10'],
        output: 10
    },
    {
        input: ['-10'],
        output: -10
    },
    {
        input: ['10'],
        output: 10
    },
    {
        input: ['--', '10'],
        output: '10'
    },
    {
        input: ['a'],
        output: 'a'
    },
    {
        input: ['-t'],
        output: true
    },
    {
        input: ['-f'],
        output: false
    },
    {
        input: ['-n'],
        output: null
    },
    {
        input: ['-u'],
        output: undefined
    },
    {
        input: ['[', ']'],
        output: []
    },
    {
        input: ['[]'],
        output: []
    },
    {
        input: ['[', '[]', ']'],
        output: [[]]
    },
    {
        input: ['[', '[', 'hello', 'world', ']', ']'],
        output: [['hello', 'world']]
    },
    {
        input: ['[', '[', '[--]', '[--]', ']', ']'],
        output: [[{}, {}]]
    },
    {
        input: ['[', '[', '--key', '10', ']', ']'],
        output: [{key: 10}]
    },
    {
        input: ['[', '[', '--key=10', ']', ']'],
        output: [{key: 10}]
    },
    {
        input: ['[', '[', '--key=-10', ']', ']'],
        output: [{key: -10}]
    },
    {
        input: ['[', '[', '--key=--', '--', ']', ']'],
        output: [{key: '--'}]
    },
    {
        input: ['[--]'],
        output: {}
    },
    {
        input: ['[', '--', ']'],
        error: 'Expected remaining array'
    },
    {
        input: ['[', '--', '--', ']'],
        output: ['--']
    },
    {
        input: ['[', '+10', ']'],
        output: [10]
    },
    {
        input: ['[', '--a', '+10', ']'],
        output: {a: 10}
    },
    {
        input: ['[', '--foo', '+10', '--bar', '20', ']'],
        output: {foo: 10, bar: 20}
    },
    {
        input: ['[', '--foo=+10', '--bar=20', ']'],
        output: {foo: 10, bar: 20}
    },
    {
        input: ['[', '--foo=+10', '--bar=--', '20', ']'],
        output: {foo: 10, bar: '20'}
    },
    {
        input: ['[', '--foo=+10', '--bar', '--', '20', ']'],
        output: {foo: 10, bar: '20'}
    },
    {
        input: ['[', '[', 'hi', ']', ']'],
        output: [['hi']]
    },
    {
        input: ['[', '--xs', '[', '--ys', 'y', ']', ']'],
        output: {xs: {ys: 'y'}}
    },
    {
        input: ['--', '['],
        output: '['
    },
    {
        input: ['--', ']'],
        output: ']'
    },
    {
        input: ['--', '[a'],
        output: '[a'
    },
    {
        input: ['--' , ']b'],
        output: ']b'
    },
    {
        input: ['[', '-a', '+10', ']'],
        error: 'Unexpected flag',
        index: 1
    },
    {
        input: ['[', '--a', '10', '--', ']'],
        error: 'Expected key for remaining object',
        index: 3
    },
    {
        input: ['--'],
        error: 'Expected string'
    },

    {
        input: ['{}'],
        output: '{}',
        json: false
    },

    {
        input: ['{}'],
        output: {},
        json: true
    },

    {
        input: ['--', '{}'],
        output: '{}',
        json: true
    },

    {
        input: ['{"a": 10}'],
        output: {a: 10},
        json: true
    },

    {
        input: ['{a: 10}'],
        error: 'Unexpected token a',
        json: true
    },

]));
