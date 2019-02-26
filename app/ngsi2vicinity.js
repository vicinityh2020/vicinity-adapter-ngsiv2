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
         // "thing-descriptions": []
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


         // Work around for the semantic interoperability demo
         const located_info = [{
               location_type: "s4bldg:Building",
               label: "ATOS Office Santander",
               location_id: "https://atos.net/es/spain"
            },
            {
               location_type: "s4bldg:BuildingSpace",
               label: "Office"
            },
            {
               location_type: "s4city:City",
               label: "Santander",
               location_id: "http://dbpedia.org/page/Santander,_Spain"
            },
            {
               location_type: "s4city:Country",
               label: "Spain",
               location_id: "http://dbpedia.org/resource/Spain"
            }
         ]

         // Static GPS coordinates

         properties.push({
            pid: "longitude",
            monitors: "adapters:GPSLongitude",
            read_link: {
               href: "/objects/{oid}/properties/{pid}",
               'static-value': {                  
                  longitude_value: -3.874887
               },
               output: {
                  type: "object",
                  field: [{
                     name: "longitude_value",
                     predicate: "core:value",
                     schema: {
                        "type": "double"
                     }
                  }]
               }
            }
         });

         properties.push({
            pid: "latitude",
            monitors: "adapters:GPSLatitude",
            read_link: {
               href: "/objects/{oid}/properties/{pid}",
               'static-value': {                  
                  latitude_value: 43.452192
               },
               output: {
                  type: "object",
                  field: [{
                     name: "latitude_value",
                     predicate: "core:value",
                     schema: {
                        type: "double"
                     }
                  }]
               }
            }
         })

         // End of workaround

         return {
            name: 'NGSI-' + o.id,
            oid: 'NGSI-' + o.id,
            // type: 'core:Device',
            type: 'adapters:Thermostat',
            version: '0.6',
            'located-in': located_info,
            actions: [],
            events: [],
            properties: properties,
         }
      })

      // output["thing-descriptions"].push(_.head(aux));
      output["thing-descriptions"] = aux;

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
               href: "/objects/{oid}/properties/{pid}",
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
                        predicate: "core:value",
                        schema: {
                           type: Ngsi2Vicinity.CheckType(attribute.type, attribute.value)
                        }
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
            // Possible bug: The validator does not pass the "float" value type
            // _.isInteger(value) ? out = "integer" : out = "float";
            _.isInteger(value) ? out = "integer" : out = "double";
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