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
const prettyHrtime = require('pretty-hrtime');

const config = require('../config/config.js');
const subscriptions = require('./orion-subscriptions.js');
const logger = require('../utils/log.js')(module);

class Orion {
  constructor() {
    // Singleton class
    if (!Orion.instance) {
      this.devices = new Array;
      // If flag is set to true, subscribe to all discovered entities
      // if (config.contextBroker.suscribe_context) {
      //   this.subs = new subscriptions.OrionSubscriptions();
      //   this.subs.updateContext = this.updateContext;
      // }      
            
      Orion.instance = this;
    }
    return Orion.instance;
  }

  /**
   * Return the list of context entities
   * @returns List of context entities registered in the various Context Brokers
   */
  getDevices() {
    return this.devices;
  }

  /**
   * Return the context information of a particular device
   * @param {String} id Device ID
   * @returns Context information about the entity "id"
   */
  getDevice(id) {
    return _.find(this.devices, {
      id: id
    });
  }

  /**
   * Update the current values
   * @param {Object} published_data Context information received from the subscription sink
   */
  updateContext(published_data) {
    const hit = _.find(Orion.instance.devices, {
      id: published_data.id
    });
    if (hit) {
      _.merge(hit, published_data);
    }
  }



  /**
   * Get all entities of type X
   * @param {Object} host_info Information about the host (extracted from file config.js)
   * @param {String} type Entity type
   * @returns Array with all the context entities that belong to the specified typ
   */
  getEntities(host_info, type) {
    const endpoint = host_info.orion_host +
      '/v2/entities?limit=250&type=' + type

    const headers = {
      'Accept': 'application/json',
      // 'X-Auth-Token': host_info.auth ? auth.orion[host_info.rz]['X-Auth-Token'] : '',
      'fiware-service': _.has(host_info, 'fiware_service') ? host_info['fiware_service'] : ''
    }
    return axios({
      method: 'get',
      url: endpoint,
      headers: headers
    })
  }


  start() {
    const self = this;


    logger.info ("Starting interaction with ORION module");

   
  };

  /**
   * Close all active subscriptions
   */
  close() {
    const self = this;
    return new Promise(function (resolve, reject) {
      if (self.subs) {
        self.subs.close().then(response => resolve());
      } else {
        resolve();
      }
    })
  };

}

const instance = new Orion();
Object.freeze(instance);

// exports.Orion = Orion
exports.instance = instance;