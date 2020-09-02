const { baseResponse, getFileType } = require("../../utils/helper");
const os = require('os');
const formidable = require('formidable');
const { isArray } = require("util");
const { MEDIA_TYPE } = require("../../utils/constant");

const uploadImage = async (req, res, next) => {
    try{
        const form = formidable({maxFileSize: 1024 * 1024, multiples: true, uploadDir: os.tmpdir()});
        form.parse(req, async (err, fields, files) => {
            if(err) throw Error();
            const listFiles = isArray(fields.file) ? files.file : [files.file];
            if(!listFiles.length){
                baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin.', [
                    {
                        "location": "body",
                        "param": "file",
                        "msg": "Vui lòng chọn file upload."
                    }
                ]);
                return;
            }
            let valid = true;
            listFiles.map((file, index) => {
                if(!file || !file.size){
                    baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin.', [
                        {
                            "location": "body",
                            "param": "file."+index,
                            "msg": "Vui lòng chọn file upload."
                        }
                    ]);
                    valid = false;
                    return false;
                }
                if(getFileType(file) !== MEDIA_TYPE.IMAGE){
                    baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin.', [
                        {
                            "location": "body",
                            "param": "file."+index,
                            "msg": "Vui lòng chọn file đúng định dạng."
                        }
                    ]);
                    valid = false;
                    return false;
                }
            });
            if(valid){
                baseResponse.success(res, 200, 'Thành công', listFiles);
            }
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(e);
    }
}

module.exports = {
    uploadImage
}