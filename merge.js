'use strict';

function merge(/*arg...*/) {
    var types = {};
    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        if (!arg) {
            continue;
        }
        var names = Object.keys(arg);
        for (var j = 0; j < names.length; j++) {
            var name = names[j];
            types[name] = arg[name];
        }
    }
    return types;
}

module.exports = merge;
