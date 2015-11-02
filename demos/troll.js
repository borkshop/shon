'use strict';

var Command = require('..');

var command = new Command('troll\n' +
    'Answer me these questions three, ere the other side ye see.', {
    name: '[-n|--name] <name> What is your name?',
    color: '[-c|--color] <color> What is your favorite colour?',
    airspeed: '[-a|--airspeed] <airspeed> :number What is the average ' +
        'airspeed velocity of an unladen swallow?'
});

var config = command.exec();

console.log('Name:', config.name);
console.log('Color:', config.color);
console.log('Airpseed:', config.airspeed);
