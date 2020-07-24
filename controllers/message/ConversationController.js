const { logger, baseResponse } = require("../../utils/helper");
const { validationResult } = require("express-validator");
const { error } = require("winston");
const ConversationUser = require("../../models/ConversationUser");
const Conversation = require("../../models/Conversation");

const getList = async (req, res, next) =>{

}

const createConversation = async (req, res, next) => {
    try{
        const {users, title, color, isGroup, message = ""} = req.body;
        const erorrs = validationResult(req);
        if(!erorrs.isEmpty()){
            baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin.', erorrs.array());
            return;
        }
        const conversation = await Conversation.create({
            title,
            color,
            isGroup
        });
        const conversationUsers = users.map((userId) => {
            return {
                conversationId: "",
                userId
            }
        });
        conversationUsers.push({
            conversationId: "",
            userId: req.user.id,
            isManager: true
        });
    }catch(e){
        logger(e),
        baseResponse.error(res);
    }
}

module.exports = {
    getList,
    createConversation
}