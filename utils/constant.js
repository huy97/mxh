const SALT_ROUND = 10;

const DEFAULT_COVER = "";
const DEFAULT_AVATAR = "";

const MEDIA_TYPE = {
    AUDIO: "AUDIO",
    VIDEO: "VIDEO",
    IMAGE: "IMAGE",
    OTHER: "OTHER",
};

const EMOJI_TYPE = {
    LIKE: 1,
    HAHA: 2,
    ANGRY: 3,
    SAD: 4,
    HAPPY: 5
}

const COMMENT_TYPE = {
    COMMENT: "COMMENT",
    REPLY: "REPLY"
}

const MESSAGE_STATUS = {
    SENDING: "SENDING",
    SENT: "SENT",
    READ: "READ"
}

const MESSAGE_EVENT = {

}

module.exports = {
    SALT_ROUND,
    DEFAULT_AVATAR,
    DEFAULT_COVER,
    MEDIA_TYPE,
    EMOJI_TYPE,
    COMMENT_TYPE,
    MESSAGE_STATUS,
    MESSAGE_EVENT
};