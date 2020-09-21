const SALT_ROUND = 10;

const DEFAULT_COVER = "static/images/default/default.jpg";
const DEFAULT_AVATAR = "static/images/default/default.jpg";

const GENDER = {
    MALE: 1,
    FEMALE: 2,
    UNKNOWN: 3
}

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

const NOTIFICATION_TYPE = {
    DEFAULT: "DEFAULT",
    POST: "POST",
    COMMENT: "COMMENT",
    REPLY: "REPLY"
}

module.exports = {
    SALT_ROUND,
    DEFAULT_AVATAR,
    DEFAULT_COVER,
    MEDIA_TYPE,
    EMOJI_TYPE,
    COMMENT_TYPE,
    MESSAGE_STATUS,
    MESSAGE_EVENT,
    GENDER,
    NOTIFICATION_TYPE
};