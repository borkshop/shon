'use strict';

exports.parseValue = parseValue;
function parseValue(cursor, delegate) {
    if (cursor.done()) {
        delegate.error('Expected value');
        delegate.cursor(cursor);
        return null;
    }
    var arg = cursor.shift();
    return parseRemainingValue(arg, cursor, delegate);
}

function parseRemainingValue(arg, cursor, delegate) {
    if (arg === '[') {
        return parseRemainingArrayOrObject(cursor, delegate);
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
        return parseString(cursor, delegate);
    } else if (+arg === +arg) {
        return +arg;
    } else if (arg.lastIndexOf('-', 0) === 0) {
        delegate.error('Unexpected flag');
        delegate.cursor(cursor, -1);
        return null;
    } else {
        return arg;
    }
}

function parseRemainingArrayOrObject(cursor, delegate) {
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
        return parseRemainingObject({}, cursor, delegate);
    } else {
        return parseRemainingArray([], cursor, delegate);
    }
}

function parseRemainingArray(array, cursor, delegate) {
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
            var value = parseRemainingValue(arg, cursor, delegate);
            if (delegate.isDone()) {
                return null;
            }
            array.push(value);
        }
    }
}

function parseRemainingObject(object, cursor, delegate) {
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
                value = parseRemainingValue(value, cursor, delegate);
                if (delegate.isDone()) {
                    return null;
                }
            } else {
                var key = arg.slice(2);
                var value = parseValue(cursor, delegate);
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
}

function parseString(cursor, delegate) {
    if (cursor.done()) {
        delegate.error('Expected string');
        delegate.cursor(cursor);
        return null;
    }
    return cursor.shift();
}
