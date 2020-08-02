let listUsers = [];
const faker = require('faker');
const mongoose = require('mongoose');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const ConversationUser = require('../models/ConversationUser');
const Message = require('../models/Message');
const kue = require('kue');
faker.locale = "vi";

const queue = kue.createQueue();
queue.process('test', async (job, done) => {
    const {from, to} = job.data;
    for(let i = 0; i < to.length; i++){
        const conversation = await Conversation.create({
            isGroup: false
        });
        await ConversationUser.create([
            {
                conversationId: conversation.id,
                userId: from,
                isManager: true
            },
            {
                conversationId: conversation.id,
                userId: to[i],
                isManager: false
            }
        ]);
        await Message.create([
            {
                conversationId: conversation.id,
                from: from,
                to: to[i],
                message: faker.lorem.sentences(2)
            },
            {
                conversationId: conversation.id,
                from: from,
                to: to[i],
                message: faker.lorem.sentences(2)
            },
            {
                conversationId: conversation.id,
                from: from,
                to: to[i],
                message: faker.lorem.sentences(2)
            },
            {
                conversationId: conversation.id,
                from: to[i],
                to: from,
                message: faker.lorem.sentences(2)
            },
            {
                conversationId: conversation.id,
                from: to[i],
                to: from,
                message: faker.lorem.sentences(2)
            },
            {
                conversationId: conversation.id,
                from: from,
                to: to[i],
                message: faker.lorem.sentences(2)
            }
        ]);
        console.log(i);
    }
    done();
});

const run = async () => {
    try {
        const users = await User.find({});
        users.map((user) => {
            User.find({_id: {$ne: user._id}}).skip(faker.random.number(1900)).limit(100).exec((err, docs) => {
                if(!err){
                    queue.create('test', {
                        from: user.id,
                        to: docs.map((obj) => obj.id)
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