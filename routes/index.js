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

// Test
// const axios = require('axios');

router.get('/objects', function (req, res, next) {
  logger.info(req);
  return res.json({});
});



module.exports = router;