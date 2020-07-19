'use strict';
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const fs = require('fs');
const app = express();

const v1Router = require('./routes/v1');
const v1RouterAuth = require('./routes/v1/authenticated');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan('common'));
app.use(express.static('static'));
app.use('/v1', v1Router);
app.use('/v1', v1RouterAuth);

global.privateKey = fs.readFileSync('private.key');

app.use(function(req, res, next) {
  res.status(404).json({
    status: 404,
    message: 'Địa chỉ không tồn tại.'
  });
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    status: err.status || 500,
    message: err.message
  });
});

if(process.env.NODE_ENV === "development"){
  mongoose.connect(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  });
}else{
  mongoose.connect(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`, {
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  });
}

module.exports = app;
