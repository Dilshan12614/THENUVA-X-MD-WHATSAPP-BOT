const fs = require('fs');
const path = require('path');

// Load config.env if it exists
const configPath = path.join(__dirname, 'config.env');

if (fs.existsSync(configPath)) {
    require('dotenv').config({ path: configPath });
}

function convertToBool(text, fault = 'true') {
    return String(text).toLowerCase() === fault.toLowerCase();
}

module.exports = {

    // ==============================
    // SESSION
    // ==============================
    SESSION_ID: process.env.SESSION_ID || "THENUVA-XMD=1AkySZxI#pUhkS5mAbr8ejv3CLuKR23NmtbnD8cVHjQva2T6kw1s",

    // ==============================
    // STATUS SETTINGS
    // ==============================
    AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || "true",

    AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || "false",

    AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || "true",

    AUTO_STATUS_MSG:
        process.env.AUTO_STATUS_MSG ||
        "*SEEN YOUR STATUS BY THENUVA X MD 🤍*",

    // ==============================
    // BOT SETTINGS
    // ==============================
    PREFIX: process.env.PREFIX || ".",

    BOT_NAME:
        process.env.BOT_NAME ||
        "THENUVA X MD",

    STICKER_NAME:
        process.env.STICKER_NAME ||
        "THENUVA X MD",

    DESCRIPTION:
        process.env.DESCRIPTION ||
        "*© POWERED BY THENUVA X MD*",

    // ==============================
    // REACTION SETTINGS
    // ==============================
    CUSTOM_REACT:
        process.env.CUSTOM_REACT || "false",

    CUSTOM_REACT_EMOJIS:
        process.env.CUSTOM_REACT_EMOJIS ||
        "💝,💖,💗,❤️‍🩹,❤️,🧡,💛,💚,💙,💜,🤎,🖤,🤍",

    AUTO_REACT:
        process.env.AUTO_REACT || "false",

    // ==============================
    // OWNER SETTINGS
    // ==============================
    OWNER_NUMBER:
        process.env.OWNER_NUMBER ||
        "94773416478",

    OWNER_NAME:
        process.env.OWNER_NAME ||
        "THENUVA",

    DEV:
        process.env.DEV ||
        "94773416478",

    // ==============================
    // ALIVE MESSAGE
    // ==============================
    ALIVE_IMG:
        process.env.ALIVE_IMG ||
        "https://telegra.ph/file/1ece2e0281513c05d20ee.jpg",

    LIVE_MSG:
        process.env.LIVE_MSG ||
        "> HELLO I AM *THENUVA X MD* ⚡",

    // ==============================
    // MESSAGE SETTINGS
    // ==============================
    READ_MESSAGE:
        process.env.READ_MESSAGE || "false",

    READ_CMD:
        process.env.READ_CMD || "false",

    AUTO_TYPING:
        process.env.AUTO_TYPING || "false",

    AUTO_RECORDING:
        process.env.AUTO_RECORDING || "false",

    // ==============================
    // SECURITY / GROUP SETTINGS
    // ==============================
    DELETE_LINKS:
        process.env.DELETE_LINKS || "false",

    ANTI_BAD:
        process.env.ANTI_BAD || "false",

    ANTI_LINK:
        process.env.ANTI_LINK || "false",

    ANTI_VV:
        process.env.ANTI_VV || "true",

    ANTI_DEL_PATH:
        process.env.ANTI_DEL_PATH || "log",

    // ==============================
    // MODE
    // ==============================
    MODE:
        process.env.MODE || "public",

    PUBLIC_MODE:
        process.env.PUBLIC_MODE || "true",

    // ==============================
    // AUTOMATIC FEATURES
    // ==============================
    AUTO_VOICE:
        process.env.AUTO_VOICE || "false",

    AUTO_STICKER:
        process.env.AUTO_STICKER || "false",

    AUTO_REPLY:
        process.env.AUTO_REPLY || "false",

    ALWAYS_ONLINE:
        process.env.ALWAYS_ONLINE || "false",

    // ==============================
    // MR THINUZZ API
    // ==============================
    MR_THINUZZ_API_KEY:
        process.env.MR_THINUZZ_API_KEY || "key_62cb6c23a4c8cca270dd510983b195b9",

};
