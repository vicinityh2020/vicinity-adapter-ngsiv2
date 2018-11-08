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
const moment = require('moment');
const Promise = require('bluebird');
const prettyHrtime = require('pretty-hrtime');

const config = require('../config/config.js');
const logger = require('../utils/log.js')(module);

class OrionSubscriptions {

  constructor() {
    // Object that manages all the subscription stuff (including last observations)
    this.activeSubscriptions = new Array;
    // Callback to Orion's updateContext method
    this.updateContext = {}
  };

  /**
   * Subscribe to all entities gathered from the ORION(s) CB(s)
   * @param {String} endpoint 
   * @param {Object} devices List of devices (NGSIv2) retrieved from Orion CB
   */
  start(endpoint, devices) {

    _.forEach(config.contextBroker.subscription_info, item => {
      const body = {
        "description": "",
        "subject": {
          "entities": [{
            "idPattern": ".*",
            "type": item.type
          }],
          "condition": {
            "attrs": item.condition_attrs
          }
        },
        "notification": {
          "http": {
            "url": config.contextBroker.subscription_listener
          },
          "attrs": item.notification_attrs
        },
        "expires": moment().add(7, 'd').toISOString(),
        "throttling": 5
      };

      axios({
          method: 'post',
          url: endpoint + '/subscriptions',
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            'X-Auth-Token': _.find(config.orion.brokers, {
                orion_host: endpoint.split('/v2')[0]
              }).auth ?
              auth.orion[_.find(config.orion.brokers, {
                orion_host: endpoint.split('/v2')[0]
              }).rz]['X-Auth-Token'] : ''
          },
          data: body
        })
        .then(
          (response) => {
            this.activeSubscriptions.push({
              "endpoint": endpoint,
              "id": response.headers.location.split('/').pop()
            });
            logger.info('Subscription successful with ID ' + response.headers.location.split('/').pop())
          },
          (error) => {
            logger.error('Orion POST subscription error - ' + JSON.stringify(error));
          });
    })
  };

  /**
   * Method called when a new notification message is received
   * @param {*} subscriptionId 
   * @param {*} data 
   */
  manageNotification(subscriptionId, data) {
    logger.info('Subscription ID - ' + subscriptionId + ' Input received - ' + JSON.stringify(data));
    const self = this;

    const start = process.hrtime();
    const hit = _.find(this.activeSubscriptions, {
      'id': subscriptionId
    });

    if (!_.has(hit, 'data')) { //First access, same as a query to Orion (nothing to update)
      hit['data'] = data;      
    } else { // Update new measurements and send to Keras       
      
      _.forEach(data, o => {
        self.updateContext(o);
      });

      // (Non-generic cdode) Forward data to Keras
      try {
        axios({
            method: 'post',
            url: config.keras.endpoint + '/newdata',
            headers: {
              "Content-Type": "text/csv",
            },
            data: Papa.unparse(_.map(data, o => {
              return {
                id: o.id,
                timestamp: o.dateModified.value,
                availableSpotNumber: o.availableSpotNumber.value
              }
            }))
          })
          .then(
            (response) => {
              const end = process.hrtime(start);
              const latency = prettyHrtime(end, {
                precise: true,
                verbose: false
              });
              logger.info('New observation sent to Keras and added to training dataset [' + latency + ']')
            },
            (error) => {
              logger.error('Orion POST subscription error - ' + (error));
            });
      } catch (err) {
        logger.error("Error on mapping to CSV " - (error))
      }
    }
  }


  /**
   * Send Unsubscribe message to ORION CB
   * @param {String} endpoint 
   * @param {String} subscriptionId 
   */
  unsubscribe(endpoint, subscriptionId) {

    return axios({
      method: 'delete',
      url: endpoint + '/subscriptions/' + subscriptionId,
      headers: {
        'Accept': "application/json",
        'X-Auth-Token': _.find(config.orion.brokers, {
            orion_host: endpoint.split('/v2')[0]
          }).auth ?
          auth.orion[_.find(config.orion.brokers, {
            orion_host: endpoint.split('/v2')[0]
          }).rz]['X-Auth-Token'] : ''
      }
    })
  }

  /**
   * Close all subscriptions (NOTE: This method is called upon a SIGINT signal)
   */
  close() {
    const self = this;
    return new Promise(function (resolve, reject) {
      if (self.activeSubscriptions.length) {
        axios.all(_.map(self.activeSubscriptions, o => self.unsubscribe(o.endpoint, o.id)))
          .then(
            (response) => {
              logger.info('Suscription cancelled (ID - ' + _.head(response).config.url.split('/').pop() + ')');
              resolve(_.head(response).status);
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
  }
}

exports.OrionSubscriptions = OrionSubscriptions