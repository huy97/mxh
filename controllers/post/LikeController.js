const { baseResponse, logger, defaultStartLimit, projectUserField } = require("../../utils/helper");
const Post = require('../../models/Post');
const PostLike = require('../../models/PostLike');
const { validationResult } = require("express-validator");
const { Types } = require("mongoose");
const { NOTIFICATION_TYPE } = require("../../utils/constant");
const { queue } = require("../../services/queue");

const getList = async (req, res, next) => {
    try{
        const {postId} = req.params;
        const {emojiType} = req.query;
        const {start, limit} = defaultStartLimit(req);
        const match = {
            postId: Types.ObjectId(postId)
        };
        if(emojiType){
            match.emojiType = parseInt(emojiType);
        }
        const likeQuery = PostLike.aggregate([
            {
                $match: match
            },
            {
                $sort: {
                    _id: -1
                }
            },
            {
                $skip: start
            },
            {
                $limit: limit
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $project: {
                    ...projectUserField('user.')
                }
            }
        ]);
        const totalQuery = PostLike.countDocuments(match);
        const [likes, total] = await Promise.all([likeQuery, totalQuery]);
        baseResponse.success(res, 200, 'Thành công', likes, {
            total
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(e);
    }
}
const likePost = async (req, res, next) => {
    try{
        const {postId} = req.params;
        const {emojiType} = req.body;
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin.', errors.array());
            return;
        };
        const post = await Post.findById(postId);
        if(!post){
            baseResponse.json(res, 404, "Bài viết không tồn tại.");
            return;
        }
        let like = await PostLike.findOne({userId: req.user.id, postId});
        if(like){
            like.emojiType = emojiType;
            await like.save();
        }else{
            like = await PostLike.create({
                postId,
                userId: req.user.id,
                emojiType
            });
        }
        if(post.userId != req.user.id){
            queue.create('notification', {type: NOTIFICATION_TYPE.LIKE, params: {user: req.user, post}, like}).save();
        }
        baseResponse.json(res, 200, 'Thành công', {
            like
        });
    }catch(e){
        logger.error(e),
        baseResponse.error(res);
    }
}
const dislikePost = async (req, res, next) => {
    try{
        const {postId} = req.params;
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin.', errors.array());
            return;
        };
        const post = await Post.findById(postId);
        if(!post){
            baseResponse.json(res, 404, "Bài viết không tồn tại.");
            return;
        }
        let like = await PostLike.findOne({userId: req.user.id, postId});
        if(like){
            await like.delete();
            baseResponse.json(res, 200, 'Thành công', {
                deleted: like
            });
            return;
        }
        baseResponse.success(res);
    }catch(e){
        logger.error(e),
        baseResponse.error(res);
    }
}

module.exports = {
    getList,
    likePost,
    dislikePost
}