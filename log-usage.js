'use strict';

var Delegate = require('./delegate');

function logUsage(command, delegate) {
    delegate = delegate || new Delegate();
    var name = command._name || command.name;
    var description = command._description || command.description;
    var usage = command._usage || command.usage;
    if (description) {
        console.log('usage: ' + description[0]);
        for (var index = 1; index < description.length; index++) {
            console.log(description[index]);
        }
    } else {
        delegate.log('usage: ' + name);
    }
    for (var index = 0; index < usage.length; index++) {
        delegate.log('  ' + usage[index]);
    }
}

module.exports = logUsage;
