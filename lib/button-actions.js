const config = require('../config');

const actions = Object.freeze({
    // Main menu
    'thenuva:menu': 'menu',
    'thenuva:all': 'menuall',
    'thenuva:alive': 'alive',
    'thenuva:ping': 'ping',
    'thenuva:about': 'about',
    'thenuva:calendar': 'calendar',
    'thenuva:jid': 'jid',
    'thenuva:calc': 'calc',

    // Menu categories
    'thenuva:owner': 'ownermenu',
    'thenuva:group': 'groupmenu',
    'thenuva:downloads': 'downloadmenu',
    'thenuva:tools': 'toolsmenu',
    'thenuva:search': 'searchmenu',

    // Downloads
    'thenuva:apk': 'apk',
    'thenuva:fb': 'fb',
    'thenuva:video': 'video',
    'thenuva:videoaudio': 'videoaudio',
    'thenuva:videoplay': 'videoplay',
    'thenuva:videodoc': 'videodoc',
    'thenuva:playvideo': 'playvideo',
    'thenuva:song': 'song',

    // MP3 selection
    'thenuva_song_mp3': 'thenuva_song_mp3',
    'thenuva_song_doc': 'thenuva_song_doc',
    'thenuva:mp3search': 'mp3search',
    'thenuva:mp3url': 'mp3url',

    // Video formats
    'ytformat_mp3': 'ytformat_mp3',
    'ytformat_mp4': 'ytformat_mp4',
    'ytformat_doc': 'ytformat_doc',

    // Group
    'thenuva:tagall': 'tagall',
    'thenuva:admins': 'admins',
    'thenuva:groupinfo': 'groupinfo',
    'thenuva:setting': 'setting',
    'thenuva:restart': 'restart',

    // Owner
    'thenuva:ownercontact': 'ownercontact',
    'thenuva:ownerchannel': 'ownerchannel',

    // Tools
    'thenuva:sticker': 'sticker',
    'thenuva:tts': 'tts',
    'thenuva:translate': 'translate',
    'thenuva:ytsearch': 'ytsearch',
    'thenuva:google': 'google',

    // Feedback
    'thenuva:feedback-good': 'feedback_good',
    'thenuva:feedback-average': 'feedback_average',
    'thenuva:feedback-bad': 'feedback_bad'
});

function unwrapMessage(message) {
    let msg = message?.message || message;

    while (msg) {
        if (msg.ephemeralMessage?.message) {
            msg = msg.ephemeralMessage.message;
        } else if (msg.viewOnceMessage?.message) {
            msg = msg.viewOnceMessage.message;
        } else if (msg.viewOnceMessageV2?.message) {
            msg = msg.viewOnceMessageV2.message;
        } else if (msg.documentWithCaptionMessage?.message) {
            msg = msg.documentWithCaptionMessage.message;
        } else {
            break;
        }
    }

    return msg || {};
}

function getButtonId(message) {
    const msg = unwrapMessage(message);

    // Native-flow list/button response
    const nativeFlow =
        msg.interactiveResponseMessage?.nativeFlowResponseMessage;

    if (nativeFlow?.paramsJson) {
        try {
            const params = JSON.parse(nativeFlow.paramsJson);

            if (typeof params.id === 'string') {
                return params.id;
            }

            if (typeof params.row_id === 'string') {
                return params.row_id;
            }

            if (params.params && typeof params.params.id === 'string') {
                return params.params.id;
            }
        } catch (error) {
            // Continue checking other response formats.
        }
    }

    // Legacy button response
    const buttonResponse = msg.buttonsResponseMessage;

    if (buttonResponse?.selectedButtonId) {
        return buttonResponse.selectedButtonId;
    }

    // Legacy list response
    const listResponse = msg.listResponseMessage;

    if (listResponse?.singleSelectReply?.selectedRowId) {
        return listResponse.singleSelectReply.selectedRowId;
    }

    // Template button response
    const templateResponse = msg.templateButtonReplyMessage;

    if (templateResponse?.selectedId) {
        return templateResponse.selectedId;
    }

    return null;
}

function getCommandBody(message) {
    const msg = unwrapMessage(message);
    const prefix = config?.PREFIX || config?.prefix || '.';
    const id = getButtonId(message);

    if (id) {
        // Dynamic YouTube MP3 song selection.
        // Example: thenuva:mp3pick:ZSKNl5eniyeAPcPkf
        const songMatch = /^thenuva:mp3pick:([\w-]{11})$/.exec(id);

        if (songMatch) {
            return `${prefix}mp3pick ${songMatch[1]}`;
        }

        // Known button IDs
        if (Object.prototype.hasOwnProperty.call(actions, id)) {
            return prefix + actions[id];
        }

        // Allow ordinary command IDs without a namespace.
        if (/^[a-zA-Z0-9_-]+$/.test(id)) {
            return prefix + id;
        }
    }

    // Text message fallback
    const conversation =
        msg.conversation ||
        msg.extendedTextMessage?.text ||
        msg.imageMessage?.caption ||
        msg.videoMessage?.caption ||
        msg.documentMessage?.caption ||
        '';

    return typeof conversation === 'string' ? conversation : '';
}

module.exports = {
    actions,
    unwrapMessage,
    getButtonId,
    getCommandBody
};
