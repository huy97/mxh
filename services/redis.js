const redis = require('redis');
const {promisify} = require('util');
const redisClient = redis.createClient(process.env.REDIS_PORT);

const get = promisify(redisClient.get).bind(redisClient);

const set = promisify(redisClient.set).bind(redisClient);

module.exports = {
    redisClient,
    get,
    set
};