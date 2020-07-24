const { baseResponse, logger, defaultStartLimit, projectUserField } = require("../../utils/helper");
const Post = require('../../models/Post');
const PostComment = require('../../models/PostComment');
const { validationResult } = require("express-validator");
const { Types } = require("mongoose");
const { COMMENT_TYPE } = require("../../utils/constant");

const getList = async (req, res, next) => {
    try{
        const {postId} = req.params;
        const {start, limit} = defaultStartLimit(req);
        const match = {
            postId: Types.ObjectId(postId),
            type: COMMENT_TYPE.COMMENT
        };
        const commentQuery = PostComment.aggregate([
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
                $lookup: {
                    from: "postcomments",
                    let: {
                        commentId: "$_id"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: [ "$parentId",  "$$commentId" ] },
                                    ]
                                }
                            }
                        },
                        {
                            $sort: {_id: -1}
                        },
                        {
                            $limit: 2
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

                    ],
                    as: "replies"
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
        const totalQuery = PostComment.countDocuments(match);
        const [comments, total] = await Promise.all([commentQuery, totalQuery]);
        baseResponse.success(res, 200, 'Thành công', comments, {
            total
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const getListReply = async (req, res, next) => {
    try{
        const {commentId} = req.params;
        const {start, limit} = defaultStartLimit(req);
        const match = {
            parentId: Types.ObjectId(commentId)
        };
        const commentQuery = PostComment.aggregate([
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
        const totalQuery = PostComment.countDocuments(match);
        const [comments, total] = await Promise.all([commentQuery, totalQuery]);
        baseResponse.success(res, 200, 'Thành công', comments, {
            total
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const createComment = async (req, res, next) => {
    try{
        const {postId} = req.params;
        const {content} = req.body;
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
        post.comment += 1;
        const comment = await PostComment.create({
            userId: req.user.id,
            postId,
            type: COMMENT_TYPE.COMMENT,
            content
        });
        baseResponse.json(res, 200, 'Thành công', {
            comment
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const createReplyComment = async (req, res, next) => {
    try{
        const {commentId} = req.params;
        const {content} = req.body;
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin.', errors.array());
            return;
        };
        const comment = await PostComment.findById(commentId);
        if(!comment){
            baseResponse.json(res, 404, "Bình luận không tồn tại.");
            return;
        }
        if(comment.type !== COMMENT_TYPE.COMMENT){
            baseResponse.json(res, 403, "Bình luận không được phép trả lời.");
            return;
        }
        comment.reply += 1;
        await comment.save();
        const reply = await PostComment.create({
            userId: req.user.id,
            postId: comment.postId,
            type: COMMENT_TYPE.REPLY,
            parentId: comment.id,
            content
        });
        baseResponse.json(res, 200, 'Thành công', {
            reply
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const updateComment = async (req, res, next) => {
    try{
        const {commentId} = req.params;
        const {content} = req.body;
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin.', errors.array());
            return;
        };
        const comment = await PostComment.findById(commentId);
        if(!comment){
            baseResponse.json(res, 404, "Bình luận không tồn tại.");
            return;
        }
        if(req.user.id != comment.userId){
            baseResponse.json(res, 403, "Bạn không có quyền thực hiện chức năng này.");
            return;
        }
        comment.content = content;
        await comment.save();
        baseResponse.json(res, 200, "Thành công", {
            comment
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const deleteComment = async (req, res, next) => {
    try{
        const {commentId} = req.params;
        const comment = await PostComment.findById(commentId);
        if(!comment){
            baseResponse.json(res, 404, "Bình luận không tồn tại.");
            return;
        }
        if(req.user.id != comment.userId){
            baseResponse.json(res, 403, "Bạn không có quyền thực hiện chức năng này.");
            return;
        }
        const commentQuery = [comment.remove(), PostComment.findByIdAndUpdate(comment.postId, {
            $inc: {
                comment: -1
            }
        })];
        if(comment.type === COMMENT_TYPE.COMMENT){
            commentQuery.push(
                PostComment.deleteMany({parentId: comment._id})
            );
        }
        const [] = await Promise.all(commentQuery);
        baseResponse.json(res, 200, "Thành công", {
            deleted: comment
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

module.exports = {
    getList,
    getListReply,
    createComment,
    createReplyComment,
    updateComment,
    deleteComment
}