const kue = require('kue');
const queue = kue.createQueue({});

queue.process('message', function(job, done){
    setTimeout(() => {
        done();
    }, job.data.timeout);
});

module.exports = {
    queue
}