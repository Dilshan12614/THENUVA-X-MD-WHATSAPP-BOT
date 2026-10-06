const { actions } = require('./button-actions');
const config = require('../config');

/*
|--------------------------------------------------------------------------
| IMAGE DOWNLOADER
|--------------------------------------------------------------------------
| Node.js 20+ has built-in fetch().
|--------------------------------------------------------------------------
*/

async function downloadImage(url) {
    if (!url || typeof url !== 'string') {
        throw new TypeError('Image URL is required');
    }

    const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: {
            'User-Agent': 'Mozilla/5.0'
        }
    });

    if (!response.ok) {
        throw new Error(
            `Image download failed: HTTP ${response.status}`
        );
    }

    const contentType = response.headers.get('content-type') || '';

    if (!contentType.startsWith('image/')) {
        throw new Error(
            `URL did not return an image. Content-Type: ${contentType}`
        );
    }

    const arrayBuffer = await response.arrayBuffer();

    if (!arrayBuffer.byteLength) {
        throw new Error('Downloaded image is empty');
    }

    return Buffer.from(arrayBuffer);
}


/*
|--------------------------------------------------------------------------
| NORMAL BUTTON MESSAGE
|--------------------------------------------------------------------------
*/

function buildButtonContent(text, buttons, footer = '') {
    if (typeof text !== 'string' || !text.trim()) {
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
                buttons: buttons.map(({ id, text: label }) => {

                    if (
                        !Object.hasOwn(actions, id) ||
                        typeof label !== 'string' ||
                        !label.trim() ||
                        label.length > 20 ||
                        ids.has(id)
                    ) {
                        throw new TypeError(`Invalid button: ${id}`);
                    }

                    ids.add(id);

                    return {
                        name: 'quick_reply',

                        buttonParamsJson: JSON.stringify({
                            display_text: label,
                            id
                        })
                    };
                }),

                messageParamsJson: '{}'
            }
        }
    };
}


/*
|--------------------------------------------------------------------------
| WHATSAPP NATIVE FLOW NODES
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| SEND BUTTONS
|--------------------------------------------------------------------------
*/

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

    /*
    |--------------------------------------------------------------------------
    | SHOW COMMAND UNDER BUTTON MESSAGE
    |--------------------------------------------------------------------------
    */

    content.interactiveMessage.body.text +=
        '\n\n' +
        buttons
            .map(button =>
                `${button.text}: ${prefix}${actions[button.id]}`
            )
            .join('\n');

    const {
        generateWAMessageFromContent,
        proto
    } = await import('@whiskeysockets/baileys');

    const message = generateWAMessageFromContent(
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
            '[BUTTON RELAY ERROR]',
            error?.message || error
        );

        return conn.sendMessage(
            jid,

            {
                text:
                    content.interactiveMessage.body.text
            },

            {
                quoted
            }
        );
    }
}


/*
|--------------------------------------------------------------------------
| LIST MENU BUILDER
|--------------------------------------------------------------------------
*/

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

    const usedIds = new Set();

    const formattedSections = [];

    /*
    |--------------------------------------------------------------------------
    | PROCESS SECTIONS
    |--------------------------------------------------------------------------
    */

    for (const section of sections) {

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
                throw new TypeError(
                    'Invalid menu row'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | DUPLICATE ID PROTECTION
            |--------------------------------------------------------------------------
            */

            if (usedIds.has(row.id)) {

                console.warn(
                    `[MENU] Duplicate row skipped: ${row.id}`
                );

                continue;
            }

            usedIds.add(row.id);

            const result = {
                title: row.title,
                id: row.id
            };

            if (
                row.description &&
                typeof row.description === 'string'
            ) {
                result.description = row.description;
            }

            rows.push(result);
        }

        /*
        |--------------------------------------------------------------------------
        | ONLY ADD SECTION IF IT HAS ROWS
        |--------------------------------------------------------------------------
        */

        if (rows.length > 0) {

            formattedSections.push({
                title: section.title,
                rows
            });
        }
    }

    if (formattedSections.length < 1) {
        throw new TypeError(
            'No valid menu rows found'
        );
    }

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

                        buttonParamsJson: JSON.stringify({
                            title: buttonText,
                            sections: formattedSections
                        })
                    }
                ],

                messageParamsJson: '{}'
            }
        }
    };
}


/*
|--------------------------------------------------------------------------
| SEND LIST MENU + IMAGE
|--------------------------------------------------------------------------
|
| IMPORTANT:
| WhatsApp native-flow list messages are sent separately from the image.
|
| Order:
|
| 1. Image
| 2. Interactive List Menu
|
|--------------------------------------------------------------------------
*/

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

    /*
    |--------------------------------------------------------------------------
    | BUILD LIST FIRST
    |--------------------------------------------------------------------------
    |
    | IMPORTANT FIX:
    | Never call buildListMenuContent('', ...)
    |
    */

    const content = buildListMenuContent(
        title,
        buttonText,
        sections,
        footer
    );

    /*
    |--------------------------------------------------------------------------
    | SEND IMAGE
    |--------------------------------------------------------------------------
    */

    if (image) {

        try {

            console.log(
                '[MENU IMAGE] Downloading:',
                image
            );

            const imageBuffer =
                await downloadImage(image);

            await conn.sendMessage(
                jid,

                {
                    image: imageBuffer,

                    caption: title
                },

                {
                    quoted
                }
            );

            console.log(
                '[MENU IMAGE] Image sent successfully'
            );

        } catch (error) {

            console.error(
                '[MENU IMAGE SEND ERROR]',
                error?.message || error
            );

            /*
            |--------------------------------------------------------------------------
            | IMAGE FAILURE DOES NOT STOP MENU
            |--------------------------------------------------------------------------
            */

        }
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE LIST MESSAGE
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | SEND LIST
    |--------------------------------------------------------------------------
    */

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

        console.log(
            '[LIST MENU] Menu sent successfully'
        );

        return message;

    } catch (error) {

        console.error(
            '[LIST MENU ERROR]',
            error?.message || error
        );

        /*
        |--------------------------------------------------------------------------
        | TEXT FALLBACK
        |--------------------------------------------------------------------------
        */

        const fallbackText =
            `${title}\n\n` +
            sections
                .flatMap(section =>
                    section.rows.map(row =>
                        `${row.title}`
                    )
                )
                .join('\n');

        return conn.sendMessage(
            jid,

            {
                text: fallbackText
            },

            {
                quoted
            }
        );
    }
}


/*
|--------------------------------------------------------------------------
| PLUGIN BUTTON CONFIG
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| SEND PLUGIN BUTTONS
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {

    downloadImage,

    buildButtonContent,

    buttonNodes,

    sendButtons,

    buildListMenuContent,

    sendListMenu,

    sendPluginButtons
};
