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
const _ = require('lodash');
const Promise = require('bluebird');
const prettyHrtime = require('pretty-hrtime');

const config = require('../config/config.js');
const logger = require('../utils/log.js')(module);
const mapper = require('../utils/mapper.js');

class Ngsi2Vicinity {

   static translate2Td(input) {
      logger.info("Mapping to VICINITY Thing Description");

      let aux = {}

      let output = {
         "adapter-id": config.adapter["adapter-id"],
         "thing-descriptions": []
      }

      aux = _.map(input, o => {

         let properties = [];
         const temp = _.omit(o, ['id', 'type', 'TimeInstant']);

         if (!_.isEmpty(temp)) {
            _.map(temp, (value, key) => {
               const aux = Ngsi2Vicinity.AddProperty(o.id, key, value)
               if (!_.isEmpty(aux)) {
                  properties.push(aux);
               }
            })
         }

         return {
            name: 'NGSI-' + o.id,
            oid: o.id,
            type: "core:Device",
            actions: [],
            events: [],
            properties: properties,
         }
      })

      output["thing-descriptions"].push(aux);

      return output;
   }

   static AddProperty(oid, pid, attribute) {

      const aux = _.find(mapper, (value, key) => {
         return _.toLower(key) === _.lowerCase(pid.replace(/[_0-9]/g, ''));
      });

      if (!_.isEmpty(aux)) {
         return {
            pid: aux.properties.pid,
            monitors: aux.properties.monitors,
            read_link: {
               href: "/device/" + oid + "/property/" + aux.properties.pid,
               output: {
                  type: "object",
                  field: [{
                        name: "timestamp",
                        schema: {
                           type: "string"
                        },
                     },
                     {
                        name: "value",
                        type: Ngsi2Vicinity.CheckType(attribute.type, attribute.value)
                     }
                  ]
               }
            }
         };
      }
   }


   static AddAction(oid, aid, attribute) {

   }

   static AddEvent(oid, eid, attribute) {

   }

   static CheckType(datatype, value) {     

      let out;

      // ToDo: Update the list of types 
      switch (datatype) {
         case "Number":
            _.isInteger(value) ? out = "integer" : out = "float";
            break;
         case "String":
            out = "string";
            break;
         default:
            out = "integer";
            break;
      }

      return out;
   }

}


exports.Ngsi2Vicinity = Ngsi2Vicinity