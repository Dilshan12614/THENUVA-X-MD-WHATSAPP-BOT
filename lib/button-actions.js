const actions = Object.freeze({
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

    // Song format selections
    'thenuva_song_mp3': 'thenuva_song_mp3',
    'thenuva_song_doc': 'thenuva_song_doc',

    // MP3 select options
    'thenuva:mp3search': 'mp3search',
    'thenuva:mp3url': 'mp3url',

    // Video format selections
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
    for (let i = 0; i < 8 && message; i++) {
        const wrapped =
            message.ephemeralMessage ||
            message.viewOnceMessage ||
            message.viewOnceMessageV2 ||
            message.viewOnceMessageV2Extension ||
            message.documentWithCaptionMessage;

        if (!wrapped?.message) break;

        message = wrapped.message;
    }

    return message || {};
}

function getButtonId(message) {
    message = unwrapMessage(message);

    // Native-flow interactive response
    const native =
        message.interactiveResponseMessage?.nativeFlowResponseMessage;

    if (native && typeof native.paramsJson === 'string') {
        try {
            const data = JSON.parse(native.paramsJson);

            if (typeof data?.id === 'string' && data.id) {
                return data.id;
            }

            if (typeof data?.params === 'string') {
                try {
                    const nested = JSON.parse(data.params);

                    if (typeof nested?.id === 'string' && nested.id) {
                        return nested.id;
                    }
                } catch {}
            }
        } catch {}
    }

    // Legacy button response
    const oldButton =
        message.buttonsResponseMessage?.selectedButtonId;

    if (typeof oldButton === 'string' && oldButton) {
        return oldButton;
    }

    // Template button response
    const templateButton =
        message.templateButtonReplyMessage?.selectedId;

    if (typeof templateButton === 'string' && templateButton) {
        return templateButton;
    }

    // List menu response
    const listButton =
        message.listResponseMessage?.singleSelectReply?.selectedRowId;

    if (typeof listButton === 'string' && listButton) {
        return listButton;
    }

    return '';
}

function getCommandBody(message, prefix = '.') {
    message = unwrapMessage(message);

    const id = getButtonId(message);

    if (id) {
        console.log('[BUTTON ACTION]', id);

        // Known button IDs → bot commands
        if (Object.prototype.hasOwnProperty.call(actions, id)) {
            return prefix + actions[id];
        }

        // IDs that already contain a command prefix
        if (id.startsWith(prefix)) {
            return id;
        }

        // Fallback for unregistered IDs
        if (/^[a-zA-Z0-9_-]+$/.test(id)) {
            return prefix + id;
        }
    }

    // Normal text messages
    return (
        message.conversation ||
        message.extendedTextMessage?.text ||
        message.imageMessage?.caption ||
        message.videoMessage?.caption ||
        message.documentMessage?.caption ||
        ''
    );
}

module.exports = {
    actions,
    unwrapMessage,
    getButtonId,
    getCommandBody
};
