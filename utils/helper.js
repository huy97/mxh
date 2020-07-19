const {MEDIA_TYPE} = require('./constant');

const baseResponse = {
    json: (response, status = 200, message = 'Thành công', json = {}) => {
        response.status(status).json({
            status: status,
            message: message,
            ...json
        });
    },
    error: (response, status = 500, message = 'Có lỗi xảy ra, vui lòng thử lại sau', errors = []) => {
        response.status(status).json({
            status: status,
            message: message,
            errors
        });
    },
    success: (response, status = 200, message = 'Thành công', data = []) => {
        response.status(status).json({
            status: status,
            message: message,
            data
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

const isEmail = (str) => {
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(String(str).toLowerCase());
}
module.exports = {
    baseResponse,
    getFileType,
    isEmail
}