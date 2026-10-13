const actions = Object.freeze({
    'thenuva:menu': 'menu',
    'thenuva:all': 'menuall',
    'thenuva:alive': 'alive',
    'thenuva:ping': 'ping',
    'thenuva:about': 'about',
    'thenuva:calendar': 'calendar',
    'thenuva:jid': 'jid',
    'thenuva:calc': 'calc',

    'thenuva:owner': 'ownermenu',
    'thenuva:group': 'groupmenu',
    'thenuva:downloads': 'downloadmenu',
    'thenuva:tools': 'toolsmenu',
    'thenuva:search': 'searchmenu',

    'thenuva:apk': 'apk',
    'thenuva:fb': 'fb',
    'thenuva:video': 'video',
    'thenuva:videoaudio': 'videoaudio',
    'thenuva:videoplay': 'videoplay',
    'thenuva:videodoc': 'videodoc',
    'thenuva:playvideo': 'playvideo',
    'thenuva:song': 'song',

    'thenuva:tagall': 'tagall',
    'thenuva:admins': 'admins',
    'thenuva:groupinfo': 'groupinfo',
    'thenuva:setting': 'setting',
    'thenuva:restart': 'restart',

    'thenuva:ownercontact': 'ownercontact',
    'thenuva:ownerchannel': 'ownerchannel',

    'thenuva:sticker': 'sticker',
    'thenuva:tts': 'tts',
    'thenuva:translate': 'translate',
    'thenuva:ytsearch': 'ytsearch',
    'thenuva:google': 'google',

    'thenuva:feedback-good': 'feedback_good',
    'thenuva:feedback-average': 'feedback_average',
    'thenuva:feedback-bad': 'feedback_bad',

    // Video download menu selections
    'ytformat_mp3': 'ytformat_mp3',
    'ytformat_mp4': 'ytformat_mp4',
    'ytformat_doc': 'ytformat_doc'
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

        // Convert known menu IDs into bot commands
        if (Object.prototype.hasOwnProperty.call(actions, id)) {
            return prefix + actions[id];
        }

        // Allow IDs that already contain a command prefix
        if (id.startsWith(prefix)) {
            return id;
        }

        // Handle video format selections
        if (
            id === 'ytformat_mp3' ||
            id === 'ytformat_mp4' ||
            id === 'ytformat_doc'
        ) {
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
