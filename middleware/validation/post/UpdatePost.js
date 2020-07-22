const { body } = require("express-validator");

const UpdatePost = [
    body('title').notEmpty().withMessage("Vui lòng nhập tiêu đề."),
    body('content').notEmpty().withMessage("Vui lòng nhập nội dung."),
    body('medias').optional().isArray().withMessage('Tham số không hợp lệ.'),
    body('medias.*').custom(async (mediaObject, {req}) => {
        if(mediaObject){
            if(!mediaObject.size || !mediaObject.path || !mediaObject.name || !mediaObject.type)
                return Promise.reject('Tham số không hợp lệ.');
        }
        return true;
    })
];

module.exports = UpdatePost;