// Copyright (C) 2018 ATOS Spain S.A.
// 
// This file is part of VICINITY.
// 
// VICINITY is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// VICINITY is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with VICINITY.  If not, see <http://www.gnu.org/licenses/>.

const config = require('../config/config.js');
const winston = require('winston');
require('winston-daily-rotate-file');
const appRoot = require('app-root-path');
const _ = require('lodash');

winston.setLevels({
    debug: 0,
    info: 1,
    silly: 2,
    warn: 3,
    error: 4,
});
winston.addColors({
    debug: 'green',
    info: 'cyan',
    silly: 'magenta',
    warn: 'yellow',
    error: 'red'
});

var getLogger = function (module) {

    let transports = [new winston.transports.Console({
            level: config.logging.logLevel,
            colorize: true,
            timestamp: true,
            handleExceptions: true,
            humanReadableUnhandledException: true,
            prettyPrint: true,
            label: module.filename.split('/').slice(-2).join('/')
        }),
        new winston.transports.DailyRotateFile({
            // filename:  `${appRoot}/logs/` + 'app2.log',
            filename: `${appRoot}/logs/adapter-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            prepend: true,
            label: module.filename.split('/').slice(-2).join('/'),
            json: true,
            maxsize: 5242880, // 5MB
            handleExceptions: true,
            humanReadableUnhandledException: true,
            colorize: true,
            level: config.logging.logLevel
        })

    ];

    return new winston.Logger({
        transports: transports
    })
};

module.exports = getLogger;