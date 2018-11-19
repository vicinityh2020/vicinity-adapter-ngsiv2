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
const axios = require('axios');
const _ = require('lodash');
const Promise = require('bluebird');
const moment = require('moment');
const prettyHrtime = require('pretty-hrtime');

const config = require('../config/config.js');
const logger = require('../utils/log.js')(module);

class Orion {
  constructor() {
    // Singleton class
    if (!Orion.instance) {     

      /**
       * In case a new device is registered and the active discovery is enabled, 
       * the Adapter automatically sends the proper registration message to the Agent
       */
      this.knownDevices = [];

      /**
       * Subscription ID handler
       */
      this.subscriptionId = '';

      Orion.instance = this;
    }
    return Orion.instance;
  }

  start() {
    
    logger.info('Starting interaction with ORION module');

      this.initSubscriptions();
  };


  initSubscriptions () {

    const self = this;

    const body = {
      description: 'Subscription to VICINITY Adapter',
      subject: {
        entities: [{
          idPattern: '.*'
        }]
      },
      notification: {
        'http': {
          'url': config.server[config.server.mode].subscription_endpoint
        }
      },
      expires: moment().add(7, 'd').toISOString(),
      throttling: 5
    };   

    axios({
        method: 'post',
        url: config.orion.endpoint + 'subscriptions',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'fiware-service': config.orion['fiware-service'],
          'fiware-servicepath': config.orion['fiware-servicepath']
        },
        data: body
      })
      .then(
        (response) => {          
          self.subscriptionId = response.headers.location.split('/').pop();
          logger.info('Subscription successful with ID ' + self.subscriptionId)
        },
        (error) => {
          logger.error('Orion POST subscription error - ' + JSON.stringify(error));
        });

  };
  
  /**
   * Get all entities stored at Orion CB (with particular fiware-service and fiware-servicepth)   
   * @returns Array with all the context entities that belong to the specified typ
   */
  getEntities() {
    const headers = {
      'Accept': 'application/json',
      'fiware-service': config.orion['fiware-service'],
      'fiware-servicepath': config.orion['fiware-servicepath']
    }
    return axios({
      method: 'get',
      url: config.orion.endpoint + 'entities',
      headers: headers
    })
  }

  /**
   * Get the information of a particular context element
   * @param {String} id Context element ID
   */
  getEntity(id) {
    const headers = {
      'Accept': 'application/json',
      'fiware-service': config.orion['fiware-service'],
      'fiware-servicepath': config.orion['fiware-servicepath']
    }
    return axios({
      method: 'get',
      url: config.orion.endpoint + 'entities',
      headers: headers
    })
  }

  /**
   * Close all subscriptions (NOTE: This method is called upon a SIGINT signal)
   */
  close() {
    const self = this;   

    return new Promise(function (resolve, reject) {      
      if (self.subscriptionId) {       

        axios({
          method: 'delete',
          url: config.orion.endpoint + 'subscriptions/' + self.subscriptionId,
          headers: {
            'Accept': 'application/json',   
            'fiware-service': config.orion['fiware-service'],
            'fiware-servicepath': config.orion['fiware-servicepath']         
          }
        }).then(
            (response) => {
              logger.info('Suscription cancelled (ID - ' + self.subscriptionId + ')');              
              resolve(response.status);
            },
            (error) => {
              logger.error('Orion DELETE subscription error - ' + error);
              reject(error);
            }
          );
      } else {
        resolve();
      }
    })
  };
}
const instance = new Orion();
exports.instance = instance;