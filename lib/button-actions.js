const actions = Object.freeze({
    // Main
    'thenuva:menu': 'menu',
    'thenuva:all': 'menuall',
    'thenuva:alive': 'alive',
    'thenuva:ping': 'ping',
    'thenuva:about': 'about',
    'thenuva:calendar': 'calendar',
    'thenuva:jid': 'jid',
    'thenuva:calc': 'calc',

    // Download
    'thenuva:apk': 'apk',
    'thenuva:fb': 'fb',
    'thenuva:video': 'video',
    'thenuva:playvideo': 'playvideo',

    // Chess
    'thenuva:chess': 'chess',
    'thenuva:chess-undo': 'chess undo',
    'thenuva:chess-flip': 'chess flip',
    'thenuva:chess-help': 'chess help',
    'thenuva:chess-new': 'chess new',

    // Group
    'thenuva:group': 'groupmenu',
    'thenuva:tagall': 'tagall',
    'thenuva:admins': 'admins',
    'thenuva:groupinfo': 'groupinfo',

    // Owner
    'thenuva:owner': 'ownermenu',
    'thenuva:setting': 'setting',
    'thenuva:restart': 'restart',

    // Tools
    'thenuva:tools': 'toolsmenu',
    'thenuva:sticker': 'sticker',
    'thenuva:tts': 'tts',
    'thenuva:translate': 'translate',

    // Search
    'thenuva:search': 'searchmenu',
    'thenuva:ytsearch': 'ytsearch',
    'thenuva:google': 'google',

    // AntiDelete
    'thenuva:antidelete-on': 'antidelete on',
    'thenuva:antidelete-off': 'antidelete off',
    'thenuva:antidelete-status': 'antidelete status',

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

    const native =
        message.interactiveResponseMessage?.nativeFlowResponseMessage;

    if (native && typeof native.paramsJson === 'string') {
        try {
            const data = JSON.parse(native.paramsJson);

            if (typeof data?.id === 'string') {
                return data.id;
            }

            if (typeof data?.params === 'string') {
                try {
                    const nested = JSON.parse(data.params);

                    if (typeof nested?.id === 'string') {
                        return nested.id;
                    }
                } catch {}
            }
        } catch {}
    }

    const oldButton =
        message.buttonsResponseMessage?.selectedButtonId;

    if (typeof oldButton === 'string' && oldButton) {
        return oldButton;
    }

    const templateButton =
        message.templateButtonReplyMessage?.selectedId;

    if (typeof templateButton === 'string' && templateButton) {
        return templateButton;
    }

    const listButton =
        message.listResponseMessage?.singleSelectReply?.selectedRowId;

    if (typeof listButton === 'string' && listButton) {
        return listButton;
    }

    return '';
}


function getCommandBody(message, prefix) {
    message = unwrapMessage(message);

    const id = getButtonId(message);

    if (id) {
        console.log('[BUTTON ACTION]', id);
    }

    if (Object.hasOwn(actions, id)) {
        return prefix + actions[id];
    }

    if (
        typeof id === 'string' &&
        id.startsWith(prefix)
    ) {
        return id;
    }

    return (
        message.conversation ||
        message.extendedTextMessage?.text ||
        message.imageMessage?.caption ||
        message.videoMessage?.caption ||
        ''
    );
}


module.exports = {
    actions,
    unwrapMessage,
    getButtonId,
    getCommandBody
};
