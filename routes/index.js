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

'use strict';

const express = require('express');
const router = express.Router();
const _ = require('lodash');

const  config = require('../config/config');
const  logger = require('../utils/log')(module);
const  orion = require('../app/orion').instance;
const  adapter = require('../app/ngsi2vicinity');

router.get('/', function (req, res, next) {  
  return res.json({});
});

/**
 * Get all context elements registered on the Orion CB 
 */
router.get('/objects', function (req, res, next) {
  logger.info("Get objects method called --- ");

  orion.getEntities().then(
    (response) => {
      // logger.info(response.data)
      let output = adapter.Ngsi2Vicinity.translate2Td(response.data);
      // console.log(output);
      return res.json(output);
    },
    (error) => {
      logger.error('Something happened ' + error)
    }
  )  
});

/**
 * Get the info of a single context element
 */
router.get('/objects/:oid/properties/:pid', function (req, res, next) {  

  orion.getEntity(req.params.oid).then(
    (response) => {           

      console.log(response.data)

      const hit_oid = _.find(response.data, {id: req.params.oid});

      if (hit_oid) {
        const hit_pid = _.find(hit_oid, (value, key) => {              
          return _.toLower(req.params.pid) === _.lowerCase(key.replace(/[_0-9]/g, ''));
        })

        if (hit_pid) {

          // ToDo: Timestamp handling (non-unique option)
          let timestamp = '';
          if (_.has(hit_pid.metadata, 'TimeInstant')) {            
            timestamp = hit_pid.metadata.TimeInstant.value;
          }
          else if (_.has(hit_oid, 'TimeInstant')) {
            timestamp = hit_oid.TimeInstant.value;
          }
          else if (_.has(hit_oid, 'dateModified')) {
            timestamp = hit_oid.dateModified.value;
          }
          else if (_.has(hit_oid, 'dateObserved')) {
            timestamp = hit_oid.dateObserved.value;
          }

          logger.debug('/objects/' + req.params.oid + '/properties/' + req.params.pid + ' - 200');

          return res.json({
            timestamp: hit_pid.metadata.TimeInstant.value,
            value: hit_pid.value
          })
        }
        else {
          logger.error('/objects/' + req.params.oid + '/properties/' + req.params.pid + ' - 404');
          return res.status(404).send('Property ' + req.params.pid + ' not found');  
        }               
      }
      else {
        logger.error('/objects/' + req.params.oid + '/properties/' + req.params.pid + ' - 404');
        return res.status(404).send('Entity ' + req.params.oid + ' not found');
      }
    },
    (error) => {
      logger.error("Something happened " + error)
      
    }
  )
});


module.exports = router;