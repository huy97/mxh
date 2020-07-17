'use strict';
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');

const v1Router = require('./routes/v1');
const v1RouterAuth = require('./routes/v1/auth');

const app = express();

const expressSwagger = require('express-swagger-generator')(app);

let options = {
  swaggerDefinition: {
    info: {
      description: '',
      title: 'Swagger',
      version: '1.0.0',
    },
    host: 'localhost:3000',
    basePath: '/api/v1',
    produces: [
      "application/json"
    ],
    schemes: ['http', 'https'],
  },
  basedir: __dirname,
  files: ['./controllers/**/*.js']
};
expressSwagger(options);

app.use(logger('short'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use('/api/v1', v1Router);
app.use('/api/v1', v1RouterAuth);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).json({
    status: 404,
    message: 'Trang không tồn tại'
  });
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.json({
    status: err.status || 500,
    message: err.message
  });
});

mongoose.connect(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`, {
  auth: {
    user: process.env.DB_USER,
    pass: process.env.DB_PASS
  },
  useNewUrlParser: true
});

module.exports = app;
