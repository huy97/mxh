const winston = require('winston');
const moment = require('moment');
const {isNullOrUndefined} = require('util');

const {MEDIA_TYPE} = require('./constant');

const logger = winston.createLogger({
    format: winston.format.simple(),
    transports: [
        new winston.transports.File({ filename: `logs/${moment().format('DD-MM-YYYY')}.log`}),
    ],
});

const logRequest = (req) => {
    logger.info(`${moment().format('DD-MM-YYYY HH:mm:ss')} | ${req.method} | ${req.path} | params: ${JSON.stringify(req.params)} | query: ${JSON.stringify(req.query)}`);
    logger.info(`${moment().format('DD-MM-YYYY HH:mm:ss')} | ${req.method} | ${req.path} | body: ${JSON.stringify(req.body)}`);
    logger.info(`${moment().format('DD-MM-YYYY HH:mm:ss')} | ${req.method} | ${req.path} | header: ${JSON.stringify(req.headers)}`);
}

const baseResponse = {
    json: (response, status = 200, message = 'Thành công', json = {}) => {
        response.status(status).json({
            status: status,
            message: message,
            ...json
        });
    },
    error: (response, status = 500, message = 'Có lỗi xảy ra, vui lòng thử lại sau', errors = [], json = {}) => {
        response.status(status).json({
            status: status,
            message: message,
            errors,
            ...json
        });
    },
    success: (response, status = 200, message = 'Thành công', data = [], json = {}) => {
        response.status(status).json({
            status: status,
            message: message,
            data,
            ...json
        });
    },
}

const getFileType = file => {
    try{
        if(file.type.match('image.*'))
        return MEDIA_TYPE.IMAGE;
        if(file.type.match('video.*'))
            return MEDIA_TYPE.VIDEO;
        if(file.type.match('audio.*'))
            return MEDIA_TYPE.AUDIO;
        return MEDIA_TYPE.OTHER;
    }catch(e){
        return false;
    }
};

const getBaseUrl = () => {
    return process.env.NODE_ENV === "development" ? ("http://127.0.0.1:" + process.env.PORT) : process.env.API_HOST;
}

const getStaticUrl = (url = "") => {
    return getBaseUrl() + '/' + url.replace('static/', '');
}

const projectUserField = (prefix = "") => {
    let object = {};
    object[`${prefix}address`] = 0;
    object[`${prefix}accessToken`] = 0;
    object[`${prefix}refreshToken`] = 0;
    object[`${prefix}password`] = 0;
    return object;
}

const defaultStartLimit = (req) => {
    let start = parseInt(req.params.start || req.query.start || req.body.start || 0);
    let limit = parseInt(req.params.limit || req.query.limit || req.body.limit || 50);
    return {start, limit};
}

const isEmpty = (string) => {
    return !isNullOrUndefined(string) && !string.length;
}

module.exports = {
    baseResponse,
    logger,
    logRequest,
    getFileType,
    getBaseUrl,
    getStaticUrl,
    projectUserField,
    defaultStartLimit,
    isEmpty
}