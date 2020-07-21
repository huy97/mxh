const { baseResponse, logger } = require("../../utils/helper")

const createPost = async (req, res, next) => {
    try{
        
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

module.exports = {
    createPost
}