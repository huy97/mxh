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
const v2Router = require('./routes/v2');
const { baseResponse, logRequest } = require('./utils/helper');
app.use(cors({credentials: true, origin: ['http://localhost:3001', 'http://192.168.2.8:3001']}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan('common'));
app.use(express.static('static'));

app.use(function(req, res, next) {
  logRequest(req);
  next();
});

global.privateKey = fs.readFileSync('private.key');

app.use('/v1', v1Router);
app.use('/v2', v2Router);

app.use(function(req, res, next) {
  baseResponse.json(res, 404, 'Địa chỉ không tồn tại.');
});

app.use(function(err, req, res, next) {
  baseResponse.error(res, err.status || 500, err.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
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
