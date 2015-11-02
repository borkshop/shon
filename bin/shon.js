'use strict';

var Command = require('..');

var command = new Command('shon\n' +
    'Converts shell object notation to JSON.', {
    value: '<shon> :shon Shell Object Notation',
    tabs: '[-t <tab>] :quantity tab stops'
});

var config = command.exec();

console.log(JSON.stringify(config.value, null, config.tabs));
