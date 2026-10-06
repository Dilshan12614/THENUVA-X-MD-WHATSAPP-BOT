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
                                `Invalid button: ${id}`
                            );
                        }

                        ids.add(id);

                        return {
                            name: 'quick_reply',

                            buttonParamsJson:
                                JSON.stringify({
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
 * WHATSAPP NATIVE FLOW NODE
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
    } = await import(
        '@whiskeysockets/baileys'
    );


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

                additionalNodes:
                    buttonNodes(jid)
            }
        );

        return message;

    } catch (error) {

        console.error(
            '[BUTTON RELAY ERROR]',
            error?.message || error
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
 * DOWNLOAD IMAGE FROM URL
 * ========================================================= */

async function downloadImage(url) {

    if (
        typeof url !== 'string' ||
        !url.trim()
    ) {
        return null;
    }

    try {

        const response =
            await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const arrayBuffer =
            await response.arrayBuffer();


        return Buffer.from(arrayBuffer);

    } catch (error) {

        console.error(
            '[MENU IMAGE ERROR]',
            error?.message || error
        );

        return null;
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
        throw new TypeError(
            'List menu title is required'
        );
    }

    if (
        typeof buttonText !== 'string' ||
        !buttonText.trim()
    ) {
        throw new TypeError(
            'List button text is required'
        );
    }

    if (
        !Array.isArray(sections) ||
        sections.length < 1
    ) {
        throw new TypeError(
            'At least one section is required'
        );
    }


    /* =====================================================
     * UNIQUE ROW IDS
     *
     * Duplicate IDs are skipped instead of crashing.
     * ===================================================== */

    const usedIds = new Set();


    const formattedSections =
        sections
            .map(section => {

                if (
                    !section ||
                    typeof section.title !== 'string' ||
                    !Array.isArray(section.rows)
                ) {
                    throw new TypeError(
                        'Invalid menu section'
                    );
                }


                const rows = [];


                for (const row of section.rows) {

                    if (
                        !row ||
                        typeof row.id !== 'string' ||
                        typeof row.title !== 'string'
                    ) {
                        continue;
                    }


                    if (usedIds.has(row.id)) {

                        console.warn(
                            `[MENU] Duplicate row skipped: ${row.id}`
                        );

                        continue;
                    }


                    usedIds.add(row.id);


                    const result = {

                        title:
                            row.title,

                        id:
                            row.id

                    };


                    if (row.description) {

                        result.description =
                            row.description;

                    }


                    rows.push(result);
                }


                return {

                    title:
                        section.title,

                    rows

                };

            })
            .filter(
                section =>
                    section.rows.length > 0
            );


    if (!formattedSections.length) {

        throw new TypeError(
            'No valid menu rows available'
        );
    }


    return {

        interactiveMessage: {

            body: {

                text:
                    title

            },

            footer: {

                text:
                    footer

            },

            nativeFlowMessage: {

                buttons: [

                    {

                        name:
                            'single_select',

                        buttonParamsJson:
                            JSON.stringify({

                                title:
                                    buttonText,

                                sections:
                                    formattedSections

                            })

                    }

                ],

                messageParamsJson:
                    '{}'

            }

        }

    };
}


/* =========================================================
 * SEND NATIVE FLOW LIST MENU
 *
 * Supports:
 *
 * image: 'https://example.com/menu.jpg'
 *
 * The image is sent as the interactive message header.
 * If image loading fails, the menu is still sent.
 * ========================================================= */

async function sendListMenu(
    conn,
    jid,
    {
        title,
        buttonText = 'Open Menu',
        sections,
        footer = '',
        image = null
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


    /* =====================================================
     * IMAGE HEADER
     *
     * Download the URL first so Baileys can upload it.
     * ===================================================== */

    if (
        typeof image === 'string' &&
        image.trim()
    ) {

        try {

            const imageBuffer =
                await downloadImage(image);


            if (imageBuffer) {

                const {
                    generateWAMessageFromContent,
                    proto
                } = await import(
                    '@whiskeysockets/baileys'
                );


                const imageMessage =
                    await conn.sendMessage(

                        jid,

                        {
                            image:
                                imageBuffer,

                            caption:
                                title,

                            footer:
                                footer
                        },

                        {
                            quoted
                        }

                    );


                /*
                 * Send the actual list immediately after
                 * the image.
                 */

                const listContent =
                    buildListMenuContent(

                        '',

                        buttonText,

                        sections,

                        footer

                    );


                const listMessage =
                    generateWAMessageFromContent(

                        jid,

                        proto.Message.fromObject({

                            viewOnceMessage: {

                                message: {

                                    messageContextInfo: {

                                        deviceListMetadata: {},

                                        deviceListMetadataVersion: 2

                                    },

                                    ...listContent

                                }

                            }

                        }),

                        {

                            userJid:
                                conn.user.id,

                            quoted:
                                imageMessage

                        }

                    );


                await conn.relayMessage(

                    jid,

                    listMessage.message,

                    {

                        messageId:
                            listMessage.key.id,

                        additionalNodes:
                            buttonNodes(jid)

                    }

                );


                return listMessage;
            }

        } catch (imageError) {

            console.error(
                '[MENU IMAGE SEND ERROR]',
                imageError?.message ||
                imageError
            );

        }

    }


    /* =====================================================
     * NORMAL LIST MENU
     * ===================================================== */

    const {
        generateWAMessageFromContent,
        proto
    } = await import(
        '@whiskeysockets/baileys'
    );


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

                userJid:
                    conn.user.id,

                quoted

            }

        );


    try {

        await conn.relayMessage(

            jid,

            message.message,

            {

                messageId:
                    message.key.id,

                additionalNodes:
                    buttonNodes(jid)

            }

        );


        return message;


    } catch (error) {

        console.error(
            '[LIST MENU ERROR]',
            error?.message || error
        );


        return conn.sendMessage(

            jid,

            {

                text:
                    title

            },

            {

                quoted

            }

        );
    }
}


/* =========================================================
 * PLUGIN BUTTON CONFIG
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


    video: [
        ['menu', 'Menu'],
        ['video', 'Download Again']
    ],


    tt: [
        ['menu', 'Menu'],
        ['tt', 'Download Again']
    ],


    owner: [
        ['menu', 'Menu']
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

    const buttons =
        pluginButtons[plugin];


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

            text:
                'Choose an option',

            prefix:
                config.PREFIX,

            buttons:
                buttons.map(
                    ([action, text]) => ({

                        id:
                            `thenuva:${action}`,

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
