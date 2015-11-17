#!/usr/bin/env node
'use strict';
var exec = require('../exec');
var config = exec(require('./shon.json'));
console.log(JSON.stringify(config.value, null, config.tabs));
