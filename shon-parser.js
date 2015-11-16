'use strict';

function ShonParser(name, collector, optional, json) {
    this.name = name;
    this.collector = collector;
    this.optional = optional;
    this.json = json;
}

ShonParser.prototype.parse = function parse(iterator, delegate) {
    if (this.collector.collected) {
        return true;
    }
    var value = this.parseValue(iterator.cursor, delegate, true);
    if (delegate.isDone() || value === null) {
        return true;
    }
    return this.collector.collect(value, iterator, delegate);
};

ShonParser.prototype.parseValue = function parseValue(cursor, delegate, root) {
    if (this.collector.collected) {
        return null;
    }
    if (!cursor.done()) {
        var arg = cursor.shift();
        return this.parseRemainingValue(arg, cursor, delegate);
    } else if (!this.optional || !root) {
        delegate.error('Expected value');
        delegate.cursor(cursor);
    }
    return null;
};

ShonParser.prototype.parseRemainingValue = function parseRemainingValue(arg, cursor, delegate) {
    if (arg === '[') {
        return this.parseRemainingArrayOrObject(cursor, delegate);
    } else if (arg === ']') {
        delegate.error('Expected value');
        delegate.cursor(cursor, -1);
        return null;
    } else if (arg === '[]') {
        return [];
    } else if (arg === '[--]') {
        return {};
    } else if (arg === '-t') {
        return true;
    } else if (arg === '-f') {
        return false;
    } else if (arg === '-n') {
        return null;
    } else if (arg === '-u') {
        return undefined;
    } else if (arg === '--') {
        return this.parseString(cursor, delegate);
    } else if (this.json && arg.lastIndexOf('{', 0) === 0) {
        return this.parseJSON(arg, cursor, delegate);
    } else if (+arg === +arg) {
        return +arg;
    } else if (arg.lastIndexOf('-', 0) === 0) {
        delegate.error('Unexpected flag');
        delegate.cursor(cursor, -1);
        return null;
    } else {
        return arg;
    }
};

ShonParser.prototype.parseRemainingArrayOrObject = function parseRemainingArrayOrObject(cursor, delegate) {
    if (cursor.done()) {
        delegate.error('Expected remaining array or object');
        delegate.cursor(cursor);
        return null;
    }
    var arg = cursor.peek();
    if (arg === ']') {
        cursor.shift();
        return [];
    } else if (arg !== '--' && arg.lastIndexOf('--', 0) === 0) {
        return this.parseRemainingObject({}, cursor, delegate);
    } else {
        return this.parseRemainingArray([], cursor, delegate);
    }
};

ShonParser.prototype.parseRemainingArray = function parseRemainingArray(array, cursor, delegate) {
    for (;;) {
        if (cursor.done()) {
            delegate.error('Expected remaining array');
            delegate.cursor(cursor);
            return null;
        }
        var arg = cursor.shift();
        if (arg === ']') {
            return array;
        } else {
            var value = this.parseRemainingValue(arg, cursor, delegate);
            if (delegate.isDone()) {
                return null;
            }
            array.push(value);
        }
    }
};

ShonParser.prototype.parseRemainingObject = function parseRemainingObject(object, cursor, delegate) {
    for (;;) {
        if (cursor.done()) {
            delegate.error('Expected key for remaining object');
            delegate.cursor(cursor, -1);
            return null;
        }
        var arg = cursor.shift();
        if (arg === ']') {
            break;
        } else if (arg === '--') {
            delegate.error('Expected key for remaining object');
            delegate.cursor(cursor, -1);
            return null;
        } else if (arg.lastIndexOf('--', 0) === 0) {
            var index = arg.indexOf('=', 2);
            if (index >= 0) {
                var key = arg.slice(2, index);
                var value = arg.slice(index + 1);
                value = this.parseRemainingValue(value, cursor, delegate);
                if (delegate.isDone()) {
                    return null;
                }
            } else {
                var key = arg.slice(2);
                var value = this.parseValue(cursor, delegate);
                if (delegate.isDone()) {
                    return null;
                }
            }
            object[key] = value;
        } else {
            delegate.error('Expected key for remaining object');
            delegate.cursor(cursor, -1);
            return null;
        }
    }
    return object;
};

ShonParser.prototype.parseString = function parseString(cursor, delegate) {
    if (cursor.done()) {
        delegate.error('Expected string');
        delegate.cursor(cursor);
        return null;
    }
    return cursor.shift();
};

ShonParser.prototype.parseJSON = function parseJSON(arg, cursor, delegate) {
    try {
        return JSON.parse(arg);
    } catch (error) {
        delegate.error(error.message);
        delegate.cursor(cursor);
        return null;
    }
};

module.exports = ShonParser;
