'use strict';

var Command = require('..');

var command = new Command('db\n' +
    'A simple key-value store', {
    action: {
        get: {
            key: '<key>'
        },
        set: {
            key: '<key>',
            value: '<value>'
        },
        rm: {
            key: '<key>',
            force: '[-f|--force]'
        },
        ls: {
        }
    }
});

var config = command.exec();
var subconfig = config.action.config;

var store = {a: 10, b: 20, c: 30};

switch (config.action.name) {
    case 'ls':
        console.log(Object.keys(store));
        break;
    case 'get':
        console.log(store[subconfig.key]);
        break;
    case 'set':
        store[subconfig.key] = subconfig.value;
        break;
    case 'rm':
        delete store[subconfig.key];
        break;
}
