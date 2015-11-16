'use strict';

var exec = require('../exec');
var logUsage = require('../log-usage');
var command = require('./troll.json')
var config = exec(command);

if (config === 'help') {
    return logUsage(command);
}

console.log('Name:', config.name);
console.log('Color:', config.color);
console.log('Airpseed:', config.airspeed);
