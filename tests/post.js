let listUsers = [];
const faker = require('faker');
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const PostLike = require('../models/PostLike');
const PostComment = require('../models/PostComment');
const kue = require('kue');
faker.locale = "vi";

const queue = kue.createQueue();
queue.process('test', async (job, done) => {
    try{
        const {userId, friendId} = job.data;
        for(let i = 0; i < faker.random.number(1, 20); i++){
            const post = await Post.create({
                userId,
                title: faker.lorem.sentences(2),
                content: faker.lorem.paragraphs(5)
            });
            for(let j = 0; j < friendId.length; j++){
                const comment = await PostComment.create({
                    userId: friendId[j],
                    postId: post.id,
                    reply: 1,
                    content: faker.lorem.paragraphs(5)
                });
                await PostComment.create({
                    userId,
                    postId: post.id,
                    parentId: comment.id,
                    type: "REPLY",
                    content: faker.lorem.paragraphs(5)
                });
                await PostLike.create({
                    userId: friendId[j],
                    postId: post.id,
                    emojiType: faker.random.number(1, 5)
                });
                console.log("J nè", j);
            };
        }
    }catch(e){
        console.log(e);
    }
    done();
});

const run = async () => {
    try {
        const users = await User.find({});
        users.map((user) => {
            User.find({_id: {$ne: user._id}}).skip(faker.random.number(1900)).limit(50).exec((err, docs) => {
                if(!err){
                    queue.create('test', {
                        userId: user.id,
                        friendId: docs.map((obj) => obj.id)
                    }).save();
                }
            });
        });
    } catch (e) {
        console.log(e);
    }
}

run();
mongoose.connect(
    `mongodb://localhost:27017/mxh`,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    }
);