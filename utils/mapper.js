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
const mapper = {

   Temperature: {

      properties: {
         pid: "Temperature",
         monitors: "adapters:DeviceTemperature",
         
      },
      actions: {

      },
      events: {
         eid: "get-temperature",
         monitors: "adapters:DeviceTemperature"

      }
   },

   RelativeHumidity: {
      properties: {
         pid: "RelativeHumidity",
         monitors: "adapters:RelativeHumidity",
         
      },
      actions: {

      },
      events: {

      }

   },


};

module.exports = mapper;