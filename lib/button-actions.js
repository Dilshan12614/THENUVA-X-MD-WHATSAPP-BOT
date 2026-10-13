const actions = Object.freeze({
    // Main Menu
    'thenuva:menu': 'menu',
    'thenuva:all': 'menuall',
    'thenuva:alive': 'alive',
    'thenuva:ping': 'ping',
    'thenuva:about': 'about',
    'thenuva:calendar': 'calendar',
    'thenuva:jid': 'jid',
    'thenuva:calc': 'calc',

    // Category Menus
    'thenuva:owner': 'ownermenu',
    'thenuva:group': 'groupmenu',
    'thenuva:downloads': 'downloadmenu',
    'thenuva:tools': 'toolsmenu',
    'thenuva:search': 'searchmenu',

    // Download Menu
    'thenuva:apk': 'apk',
    'thenuva:fb': 'fb',
    'thenuva:video': 'video',
    'thenuva:videoaudio': 'videoaudio',
    'thenuva:videoplay': 'videoplay',
    'thenuva:videodoc': 'videodoc',
    'thenuva:playvideo': 'playvideo',
    'thenuva:song': 'song',

    // Video Format Selection
    'ytformat_mp3': 'ytformat_mp3',
    'ytformat_mp4': 'ytformat_mp4',
    'ytformat_doc': 'ytformat_doc',

    // Group Menu
    'thenuva:tagall': 'tagall',
    'thenuva:admins': 'admins',
    'thenuva:groupinfo': 'groupinfo',

    // Owner Menu
    'thenuva:setting': 'setting',
    'thenuva:restart': 'restart',
    'thenuva:ownercontact': 'ownercontact',
    'thenuva:ownerchannel': 'ownerchannel',

    // Tools Menu
    'thenuva:sticker': 'sticker',
    'thenuva:tts': 'tts',
    'thenuva:translate': 'translate',

    // Search Menu
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

    // Native Flow response
    const native =
        message.interactiveResponseMessage?.nativeFlowResponseMessage;

    if (native && typeof native.paramsJson === 'string') {
        try {
            const data = JSON.parse(native.paramsJson);

            if (typeof data?.id === 'string' && data.id) {
                return data.id;
            }

            if (typeof data?.row_id === 'string' && data.row_id) {
                return data.row_id;
            }

            if (typeof data?.selectedRowId === 'string' && data.selectedRowId) {
                return data.selectedRowId;
            }

            if (typeof data?.params === 'string') {
                try {
                    const nested = JSON.parse(data.params);

                    if (typeof nested?.id === 'string' && nested.id) {
                        return nested.id;
                    }

                    if (
                        typeof nested?.selectedRowId === 'string' &&
                        nested.selectedRowId
                    ) {
                        return nested.selectedRowId;
                    }
                } catch {}
            }
        } catch {}
    }

    // Standard WhatsApp list response
    const listButton =
        message.listResponseMessage?.singleSelectReply?.selectedRowId;

    if (typeof listButton === 'string' && listButton) {
        return listButton;
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

    return '';
}

function getCommandBody(message, prefix = '.') {
    message = unwrapMessage(message);

    const id = getButtonId(message);

    if (id) {
        console.log('[BUTTON ACTION]', id);
    }

    if (Object.prototype.hasOwnProperty.call(actions, id)) {
        return prefix + actions[id];
    }

    if (typeof id === 'string' && id.startsWith(prefix)) {
        return id;
    }

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
