const { actions } = require('./button-actions');
const config = require('../config');


/* =========================================================
 * QUICK REPLY BUTTON CONTENT
 * ========================================================= */

function buildButtonContent(text, buttons, footer = '') {

    if (
        typeof text !== 'string' ||
        !text.trim()
    ) {
        throw new TypeError('Button text is required');
    }

    if (
        !Array.isArray(buttons) ||
        buttons.length < 1 ||
        buttons.length > 3
    ) {
        throw new TypeError('Use one to three buttons');
    }

    const ids = new Set();

    return {
        interactiveMessage: {
            body: {
                text
            },

            footer: {
                text: footer
            },

            nativeFlowMessage: {
                buttons: buttons.map(
                    ({ id, text: label }) => {

                        if (
                            !Object.hasOwn(actions, id) ||
                            typeof label !== 'string' ||
                            !label.trim() ||
                            label.length > 20 ||
                            ids.has(id)
                        ) {
                            throw new TypeError(
                                'Use unique known actions and labels up to 20 characters'
                            );
                        }

                        ids.add(id);

                        return {
                            name: 'quick_reply',

                            buttonParamsJson: JSON.stringify({
                                display_text: label,
                                id
                            })
                        };
                    }
                ),

                messageParamsJson: '{}'
            }
        }
    };
}


/* =========================================================
 * NATIVE FLOW NODE
 * ========================================================= */

function buttonNodes(jid) {

    const nodes = [
        {
            tag: 'biz',
            attrs: {},
            content: [
                {
                    tag: 'interactive',
                    attrs: {
                        type: 'native_flow',
                        v: '1'
                    },
                    content: [
                        {
                            tag: 'native_flow',
                            attrs: {
                                v: '9',
                                name: 'mixed'
                            }
                        }
                    ]
                }
            ]
        }
    ];

    if (!jid.endsWith('@g.us')) {
        nodes.push({
            tag: 'bot',
            attrs: {
                biz_bot: '1'
            }
        });
    }

    return nodes;
}


/* =========================================================
 * SEND QUICK REPLY BUTTONS
 * ========================================================= */

async function sendButtons(
    conn,
    jid,
    {
        text,
        buttons,
        footer = '',
        prefix = config.PREFIX
    },
    quoted
) {

    const content = buildButtonContent(
        text,
        buttons,
        footer
    );

    content.interactiveMessage.body.text +=
        '\n\n' +
        buttons
            .map(
                button =>
                    `${button.text}: ${prefix}${actions[button.id]}`
            )
            .join('\n');

    const {
        generateWAMessageFromContent,
        proto
    } = await import('@whiskeysockets/baileys');

    const message =
        generateWAMessageFromContent(
            jid,

            proto.Message.fromObject({
                viewOnceMessage: {
                    message: {

                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },

                        ...content
                    }
                }
            }),

            {
                userJid: conn.user.id,
                quoted
            }
        );

    try {

        await conn.relayMessage(
            jid,
            message.message,
            {
                messageId: message.key.id,
                additionalNodes: buttonNodes(jid)
            }
        );

        return message;

    } catch (error) {

        console.error(
            'Button relay failed:',
            error?.name || 'Error'
        );

        return conn.sendMessage(
            jid,
            {
                text:
                    content
                        .interactiveMessage
                        .body
                        .text
            },
            {
                quoted
            }
        );
    }
}


/* =========================================================
 * NATIVE FLOW LIST MENU
 * ========================================================= */

function buildListMenuContent(
    title,
    buttonText,
    sections,
    footer = ''
) {

    if (
        typeof title !== 'string' ||
        !title.trim()
    ) {
        throw new TypeError('List title is required');
    }

    if (
        !Array.isArray(sections) ||
        !sections.length
    ) {
        throw new TypeError('List sections are required');
    }

    const formattedSections = sections.map(section => {

        if (
            !section ||
            typeof section.title !== 'string' ||
            !Array.isArray(section.rows)
        ) {
            throw new TypeError(
                'Invalid list section'
            );
        }

        return {
            title: section.title,

            rows: section.rows.map(row => {

                if (
                    !row ||
                    typeof row.id !== 'string' ||
                    typeof row.title !== 'string'
                ) {
                    throw new TypeError(
                        'Invalid list row'
                    );
                }

                return {
                    title: row.title,
                    description:
                        typeof row.description === 'string'
                            ? row.description
                            : '',
                    id: row.id
                };
            })
        };
    });

    return {
        interactiveMessage: {

            body: {
                text: title
            },

            footer: {
                text: footer
            },

            nativeFlowMessage: {

                buttons: [

                    {
                        name: 'single_select',

                        buttonParamsJson:
                            JSON.stringify({
                                title:
                                    buttonText ||
                                    '📂 View Commands',

                                sections:
                                    formattedSections
                            })
                    }

                ],

                messageParamsJson: '{}'
            }
        }
    };
}


/* =========================================================
 * SEND NATIVE FLOW LIST MENU
 * ========================================================= */

async function sendListMenu(
    conn,
    jid,
    {
        title,
        buttonText = '📂 View Commands',
        sections,
        footer = ''
    },
    quoted
) {

    const content =
        buildListMenuContent(
            title,
            buttonText,
            sections,
            footer
        );

    const {
        generateWAMessageFromContent,
        proto
    } = await import('@whiskeysockets/baileys');

    const message =
        generateWAMessageFromContent(
            jid,

            proto.Message.fromObject({
                viewOnceMessage: {
                    message: {

                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },

                        ...content
                    }
                }
            }),

            {
                userJid: conn.user.id,
                quoted
            }
        );

    try {

        await conn.relayMessage(
            jid,
            message.message,
            {
                messageId: message.key.id,
                additionalNodes: buttonNodes(jid)
            }
        );

        return message;

    } catch (error) {

        console.error(
            '[LIST MENU ERROR]',
            error
        );

        return conn.sendMessage(
            jid,
            {
                text: title
            },
            {
                quoted
            }
        );
    }
}


/* =========================================================
 * PLUGIN BUTTONS
 * ========================================================= */

const pluginButtons = {

    alive: [
        ['menu', 'Menu'],
        ['chess', 'Play Chess'],
        ['about', 'About']
    ],

    about: [
        ['menu', 'Menu'],
        ['alive', 'Bot Status']
    ],

    calendar: [
        ['menu', 'Menu'],
        ['calendar', 'Current Month']
    ],

    jid: [
        ['menu', 'Menu']
    ],

    calc: [
        ['menu', 'Menu'],
        ['calc', 'Calculate Again']
    ],

    fb: [
        ['menu', 'Menu'],
        ['fb', 'Download Again']
    ],

    apk: [
        ['menu', 'Menu'],
        ['apk', 'Download Again']
    ],

    hack: [
        ['menu', 'Menu'],
        ['about', 'About']
    ],

    chess: [
        ['chess-undo', 'Undo'],
        ['chess-flip', 'Flip Board'],
        ['chess-help', 'Help']
    ],

    'chess-finished': [
        ['chess-new', 'New Game'],
        ['menu', 'Menu']
    ],

    antidelete: [
        ['antidelete-on', 'Enable'],
        ['antidelete-off', 'Disable'],
        ['antidelete-status', 'Status']
    ]
};


/* =========================================================
 * SEND PLUGIN BUTTONS
 * ========================================================= */

function sendPluginButtons(
    conn,
    jid,
    plugin,
    quoted
) {

    const buttons = pluginButtons[plugin];

    if (!buttons) {

        console.warn(
            `[BUTTONS] No buttons configured for plugin: ${plugin}`
        );

        return null;
    }

    return sendButtons(
        conn,
        jid,
        {
            text: 'Choose an option',

            prefix: config.PREFIX,

            buttons: buttons.map(
                ([action, text]) => ({
                    id: `thenuva:${action}`,
                    text
                })
            )
        },
        quoted
    );
}


/* =========================================================
 * EXPORTS
 * ========================================================= */

module.exports = {
    buildButtonContent,
    buttonNodes,
    sendButtons,

    buildListMenuContent,
    sendListMenu,

    sendPluginButtons
};
