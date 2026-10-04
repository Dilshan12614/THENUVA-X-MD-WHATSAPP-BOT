const actions = Object.freeze({
    'thenuva:all': 'menuall',
    'thenuva:menu': 'menu2',

    'thenuva:alive': 'alive',
    'thenuva:about': 'about',
    'thenuva:calendar': 'calendar',
    'thenuva:jid': 'jid',
    'thenuva:calc': 'calc',

    'thenuva:apk': 'apk',
    'thenuva:fb': 'fb',

    'thenuva:chess': 'chess',
    'thenuva:chess-undo': 'chess undo',
    'thenuva:chess-flip': 'chess flip',
    'thenuva:chess-help': 'chess help',
    'thenuva:chess-new': 'chess new',

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

        if (!wrapped?.message) break;

        message = wrapped.message;
    }

    return message || {};
}


function getButtonId(message) {

    message = unwrapMessage(message);

    /*
     * WhatsApp Interactive / Native Flow
     */
    const native =
        message.interactiveResponseMessage?.nativeFlowResponseMessage;

    if (native) {

        if (typeof native.paramsJson === 'string') {

            try {

                const data = JSON.parse(native.paramsJson);

                // Normal:
                // {"id":"thenuva:all"}

                if (typeof data?.id === 'string') {
                    return data.id;
                }

                // Some WhatsApp versions use:
                // {"params":"{\"id\":\"thenuva:all\"}"}

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
    }


    /*
     * Old button system
     */
    const oldButton =
        message.buttonsResponseMessage?.selectedButtonId;

    if (typeof oldButton === 'string' && oldButton) {
        return oldButton;
    }


    /*
     * Template button
     */
    const templateButton =
        message.templateButtonReplyMessage?.selectedId;

    if (typeof templateButton === 'string' && templateButton) {
        return templateButton;
    }


    /*
     * List button
     */
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


    /*
     * Debug
     */
    if (id) {
        console.log('[BUTTON ACTION]', id);
    }


    /*
     * Known action
     */
    if (Object.hasOwn(actions, id)) {
        return prefix + actions[id];
    }


    /*
     * Direct prefix command
     *
     * Example:
     * .menuall
     */
    if (
        typeof id === 'string' &&
        id.startsWith(prefix)
    ) {

        const action = id
            .slice(prefix.length)
            .trim()
            .split(/\s+/)
            .shift()
            .toLowerCase();

        if (
            Object.values(actions).some(value =>
                value.split(' ')[0] === action
            )
        ) {
            return id;
        }
    }


    /*
     * Normal WhatsApp message
     */
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
