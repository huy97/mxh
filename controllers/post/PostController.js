const fs = require('fs');
const slugify = require('slugify');
const { validationResult } = require("express-validator");
const Post = require('../../models/Post');
const PostMedia = require('../../models/PostMedia');
const { baseResponse, logger, defaultStartLimit, getStaticUrl, projectUserField } = require("../../utils/helper");
const { Types } = require('mongoose');
const { NOTIFICATION_TYPE } = require('../../utils/constant');
const { queue } = require('../../services/queue');

const show = async (req, res, next) => {
    try{
        const {postId} = req.params;
        const postDetail = await Post.aggregate([
            {
                $match: {_id: Types.ObjectId(postId)}
            },
            {
                $skip: 0
            },
            {
                $limit: 1
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
                $lookup: {
                    from: "post_likes",
                    let: {
                        postId: "$_id"
                    },
                    pipeline: [{
                        "$match": {
                            $expr: {
                                $and: [
                                    { $eq: [ "$postId",  "$$postId" ] },
                                ]
                            },
                            "userId": req.user._id
                        }
                    }],
                    as: "likeInfo"
                }
            },
            {
                $unwind: {
                    "path": "$likeInfo",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                $lookup: {
                    from: "post_likes",
                    let: {
                        postId: "$_id"
                    },
                    pipeline: [
                        {
                            "$match": {
                                $expr: {
                                    $and: [
                                        { $eq: [ "$postId",  "$$postId" ] },
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: "$emojiType",
                                count: {$sum: 1}
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                emojiType: "$_id",
                                total: "$count"
                            }
                        }
                    ],
                    as: "likeStats"
                }
            },
            {
                $project: {
                    ...projectUserField('user.')
                }
            }
        ]);
        if(!postDetail.length){
            baseResponse.json(res, 404, "Bài viết không tồn tại.");
            return;
        }
        baseResponse.json(res, 200, 'Thành công', {
            post: postDetail[0]
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const getList = async (req, res, next) => {
    try{
        const {userId} = req.params;
        const {start, limit} = defaultStartLimit(req);
        const match = {};
        if(userId && Types.ObjectId(userId)){
            match.userId = Types.ObjectId(userId);
            if(Types.ObjectId(userId) !== req.user._id){
                match.isShow = true;
            }
        } else {
            match.isShow = true
        }
        const postQuery = Post.aggregate([
            {
                $match: match
            },
            {
                $sort: {
                    updatedAt: -1
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
                $lookup: {
                    from: "post_likes",
                    let: {
                        postId: "$_id"
                    },
                    pipeline: [{
                        "$match": {
                            $expr: {
                                $and: [
                                    { $eq: [ "$postId",  "$$postId" ] },
                                ]
                            },
                            "userId": req.user._id
                        }
                    }],
                    as: "likeInfo"
                }
            },
            {
                $unwind: {
                    "path": "$likeInfo",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                $lookup: {
                    from: "post_likes",
                    let: {
                        postId: "$_id"
                    },
                    pipeline: [
                        {
                            "$match": {
                                $expr: {
                                    $and: [
                                        { $eq: [ "$postId",  "$$postId" ] },
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: "$emojiType",
                                count: {$sum: 1}
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                emojiType: "$_id",
                                total: "$count"
                            }
                        }
                    ],
                    as: "likeStats"
                }
            },
            {
                $project: {
                    ...projectUserField('user.')
                }
            }
        ]);
        const totalQuery = Post.countDocuments(match);
        const [post, total] = await Promise.all([postQuery, totalQuery]);
        baseResponse.success(res, 200, 'Thành công', post, {
            total
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const createPost = async (req, res, next) => {
    try{
        const {title, content, medias = []} = req.body;
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin', errors.array());
        }
        const post = await Post.create({
            userId: req.user.id,
            title,
            content
        });
        const uploadDir = "static/images/posts";
        const listMedias = [];
        if(medias.length){
            medias.map((mediaObj) => {
                let newPath = uploadDir + '/' + Date.now() + '_' + post.id + '_' + slugify(mediaObj.name);
                let source = getStaticUrl(newPath);
                if(fs.existsSync(mediaObj.path)){
                    fs.renameSync(mediaObj.path, newPath);
                    listMedias.push({
                        ...mediaObj,
                        postId: post.id,
                        path: newPath,
                        source
                    });
                }
            });
        }
        const [createdMedias] = await Promise.all([PostMedia.create(listMedias)]);
        queue.create('notification', {type: NOTIFICATION_TYPE.POST, params: {user: req.user, post}}).save();
        baseResponse.json(res, 200, 'Thành công', {
            post: {
                ...post.toJSON(),
                medias: createdMedias
            }
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const updatePost = async (req, res, next) => {
    try{
        const {postId} = req.params;
        const {title, content, medias = []} = req.body;
        const post = await Post.findById(postId);
        if(!post){
            baseResponse.json(res, 404, "Bài viết không tồn tại.");
            return;
        }
        if(req.user.id != post.userId){
            baseResponse.json(res, 403, "Bạn không có quyền thao tác chức năng này.");
            return;
        }
        const listMedias = [];
        const uploadDir = "static/images/posts";
        if(medias.length){
            medias.map((mediaObj) => {
                let newPath = uploadDir + '/' + Date.now() + '_' + post.id + '_' + slugify(mediaObj.name);
                let source = `https://${req.get('host')}${newPath.replace('static', '')}`;
                if(!mediaObj._id && fs.existsSync(mediaObj.path)){
                    fs.renameSync(mediaObj.path, newPath);
                    listMedias.push({
                        ...mediaObj,
                        postId: post.id,
                        path: newPath,
                        source
                    });
                }
            });
        }
        const query = [
            Post.findByIdAndUpdate(postId, {
                title,
                content
            }, {
                new: true
            }),
            PostMedia.create(listMedias)
        ];
        const [updated, createdMedias] = await Promise.all(query);
        baseResponse.json(res, 200, 'Thành công', {
            post: {
                ...updated.toJSON(),
                medias: createdMedias
            }
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const deletePost = async (req, res, next) => {
    try{
        const {postId} = req.params;
        const post = await Post.findById(postId);
        if(!post){
            baseResponse.json(res, 404, "Bài viết không tồn tại.");
            return;
        }
        if(req.user.id != post.userId){
            baseResponse.json(res, 403, "Bạn không có quyền thao tác chức năng này.");
            return;
        }
        await post.delete();
        baseResponse.json(res, 200, "Thành công", {
            deleted: post
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const getListByAdmin = async (req, res, next) => {
    try{
        const {start, limit} = defaultStartLimit(req);
        const postQuery = Post.aggregate([
            {
                $sort: {
                    createAt: -1
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
                $lookup: {
                    from: "post_likes",
                    let: {
                        postId: "$_id"
                    },
                    pipeline: [{
                        "$match": {
                            $expr: {
                                $and: [
                                    { $eq: [ "$postId",  "$$postId" ] },
                                ]
                            },
                        }
                    }],
                    as: "likeInfo"
                }
            },
            {
                $unwind: {
                    "path": "$likeInfo",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                $lookup: {
                    from: "post_likes",
                    let: {
                        postId: "$_id"
                    },
                    pipeline: [
                        {
                            "$match": {
                                $expr: {
                                    $and: [
                                        { $eq: [ "$postId",  "$$postId" ] },
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: "$emojiType",
                                count: {$sum: 1}
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                emojiType: "$_id",
                                total: "$count"
                            }
                        }
                    ],
                    as: "likeStats"
                }
            },
            {
                $project: {
                    ...projectUserField('user.')
                }
            }
        ]);
        const totalQuery = Post.countDocuments();
        const [post, total] = await Promise.all([postQuery, totalQuery]);
        logger.info('total' + total);
        baseResponse.success(res, 200, 'Thành công', post, {
            total
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const togglePost = async (req, res, next) => {
    try {
        const {postId, isShow} = req.body;
        let post = await Post.findById({_id: postId});
        if(!post) {
            return baseResponse.error(res, 422, 'Không tìm thấy bài post');
        }
        post.isShow = isShow;
        await post.save();
        const postDetail = await Post.aggregate([
            {
                $match: {_id: Types.ObjectId(postId)}
            },
            {
                $skip: 0
            },
            {
                $limit: 1
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
                $lookup: {
                    from: "post_likes",
                    let: {
                        postId: "$_id"
                    },
                    pipeline: [
                        {
                            "$match": {
                                $expr: {
                                    $and: [
                                        { $eq: [ "$postId",  "$$postId" ] },
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: "$emojiType",
                                count: {$sum: 1}
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                emojiType: "$_id",
                                total: "$count"
                            }
                        }
                    ],
                    as: "likeStats"
                }
            },
            {
                $project: {
                    ...projectUserField('user.')
                }
            }
        ]);
        return baseResponse.success(res, 200, 'Thành công', postDetail[0]);
    }catch(e) {
        logger.error(e);
        baseResponse.error(res);
    }
}

module.exports = {
    show,
    getList,
    createPost,
    updatePost,
    deletePost,
    getListByAdmin,
    togglePost,
}