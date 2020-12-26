'use strict';

(require('dotenv')).config();
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const fs = require('fs');
const morgan = require('morgan');
const nunjucks = require('nunjucks');
const path = require('path');

const app = express();

nunjucks.configure('./templates', {
  express: app,
  autoescape: true,
});

app.set('trust proxy', 'loopback');

app.use(morgan('combined'));
app.use(cors());
app.use(bodyParser.json());

// load all the route files from routes/
fs.readdir(path.join(__dirname, 'routes'), function(err, files) {
  files.forEach(function(file) {
    if (file.match(/.js$/)) {
      const routePrefix = file.split('.')[0];
      app.use(`/api/${routePrefix}`, require(path.join(__dirname, 'routes', file)));
      console.log(`Mounting routes from ${file} at /api/${routePrefix}`);
    }
  });

  // mount the error handler at the very last point
  app.use(function(err, req, res, next) {
    if (err.routine && err.routine === 'string_to_uuid') { // usually a postgres error
      res.status(401).json({err: 'invalid_uuid'});
    } else {
      console.error(err);
      res.status(500).json({err: 'internal_error'});
    }
  });
});

app.use('/static', express.static('./static'));

const port = process.env.OSIRIS_PORT || 5143;
app.listen(port, function() {
  console.log(`Listening on ${port}`);
});
