const actions = Object.freeze({
    // MENU
    'thenuva:all': 'menuall',
    'thenuva:menu': 'menu2',

    // MAIN
    'thenuva:alive': 'alive',
    'thenuva:about': 'about',
    'thenuva:calendar': 'calendar',
    'thenuva:jid': 'jid',
    'thenuva:calc': 'calc',

    // DOWNLOAD
    'thenuva:apk': 'apk',
    'thenuva:fb': 'fb',

    // CHESS
    'thenuva:chess': 'chess',
    'thenuva:chess-undo': 'chess undo',
    'thenuva:chess-flip': 'chess flip',
    'thenuva:chess-help': 'chess help',
    'thenuva:chess-new': 'chess new',

    // ANTIDELETE
    'thenuva:antidelete-on': 'antidelete on',
    'thenuva:antidelete-off': 'antidelete off',
    'thenuva:antidelete-status': 'antidelete status'
});


function unwrapMessage(message) {
    for (let i = 0; i < 8 && message; i++) {

        const wrapped =
            message.ephemeralMessage ||
            message.viewOnceMessage ||
            message.viewOnceMessageV2 ||
            message.viewOnceMessageV2Extension ||
            message.documentWithCaptionMessage;

        if (!wrapped?.message) {
            break;
        }

        message = wrapped.message;
    }

    return message || {};
}


function getButtonId(message) {
    message = unwrapMessage(message);

    // Interactive button
    const native =
        message.interactiveResponseMessage?.nativeFlowResponseMessage;

    if (native) {

        if (
            typeof native.paramsJson !== 'string' ||
            native.paramsJson.length > 4096
        ) {
            return '';
        }

        try {

            const data = JSON.parse(native.paramsJson);

            return typeof data?.id === 'string'
                ? data.id
                : '';

        } catch {
            return '';
        }
    }

    // Old button system
    return (
        message.buttonsResponseMessage?.selectedButtonId ||
        message.templateButtonReplyMessage?.selectedId ||
        message.listResponseMessage?.singleSelectReply?.selectedRowId ||
        ''
    );
}


function getCommandBody(message, prefix) {

    message = unwrapMessage(message);

    const id = getButtonId(message);

    // Button ID -> command
    if (Object.hasOwn(actions, id)) {
        return prefix + actions[id];
    }

    // Normal prefix command
    if (
        typeof id === 'string' &&
        id.startsWith(prefix)
    ) {

        const action = id.slice(prefix.length);

        if (
            Object.values(actions).includes(action) ||
            action === 'menu2' ||
            action === 'menuall'
        ) {
            return id;
        }
    }

    // Normal WhatsApp message
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
