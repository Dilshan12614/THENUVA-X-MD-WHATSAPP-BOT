const config = require('../config');
const { cmd } = require('../command');
const { sendListMenu } = require('../lib/buttons');
const { runtime } = require('../lib/functions');


/* =========================================================
 * CYBER XMD MENU CONFIG
 * ========================================================= */

const BOT_NAME = 'CYBER XMD';
const CREATOR = 'Dilshan Ashinsa';
const VERSION = 'v2.0.0';

const NEWSLETTER_NAME = 'CYBER X MD UPDATES';
const NEWSLETTER_JID = '120363xxxxxxxxxxxx@newsletter';

const MENU_IMAGE =
    'https://i.ibb.co/yFQWcf3T/b454eacd7ab3.jpg';


/* =========================================================
 * MENU COMMAND
 * ========================================================= */

cmd({

    pattern: 'menu',

    alias: [
        'help',
        'commands'
    ],

    react: '📚',

    desc: 'Open CYBER XMD command menu',

    category: 'main',

    filename: __filename

}, async (
    conn,
    mek,
    m,
    {
        from,
        pushname,
        reply
    }
) => {

    try {

        /* =================================================
         * SYSTEM INFORMATION
         * ================================================= */

        const ram = (
            process.memoryUsage().rss /
            1024 /
            1024
        ).toFixed(2);

        const botMode =
            config.MODE || 'public';

        const prefix =
            config.PREFIX || '.';

        const userName =
            pushname || 'User';


        /* =================================================
         * MENU TEXT
         * ================================================= */

        const menuText = `╭───────────────●●►
│ 🤖 *${BOT_NAME}*
├───────────────●●►
│ 👋 Pushname : *${userName}*
│ 👤 Creator : *${CREATOR}*
│ 🕒 Runtime : *${runtime(process.uptime())}*
│ ⚡ Mode : *${botMode}*
│ ⚙️ Prefix : *${prefix}*
│ 💾 RAM Use : *${ram} MB*
│ 📌 Version : *${VERSION}*
╰───────────────●●►

╭───────────────❒
│ 💙 *WELCOME TO ${BOT_NAME}*
│ 👑 *POWERED BY ${CREATOR}*
╰───────────────❒

╭───────────────❒
│ 📢 *NEWSLETTER*
│ 📛 Name : *${NEWSLETTER_NAME}*
│ 🆔 JID : *${NEWSLETTER_JID}*
╰───────────────❒`;


        /* =================================================
         * MENU SECTIONS
         *
         * IMPORTANT:
         * Every row ID must be unique.
         * ================================================= */

        const sections = [

            /* =================================================
             * MAIN COMMANDS
             * ================================================= */

            {
                title: '🔰 MAIN COMMANDS',

                rows: [

                    {
                        id: 'thenuva:alive',
                        title: `${prefix}alive`,
                        description:
                            'Check bot status, uptime and RAM'
                    },

                    {
                        id: 'thenuva:ping',
                        title: `${prefix}ping`,
                        description:
                            'Check bot response speed'
                    },

                    {
                        id: 'thenuva:menu',
                        title: `${prefix}menu`,
                        description:
                            'Open CYBER XMD command menu'
                    },

                    {
                        id: 'thenuva:about',
                        title: `${prefix}about`,
                        description:
                            'About CYBER XMD'
                    },

                    {
                        id: 'thenuva:calendar',
                        title: `${prefix}calendar`,
                        description:
                            'Show current calendar'
                    },

                    {
                        id: 'thenuva:jid',
                        title: `${prefix}jid`,
                        description:
                            'Get current chat JID'
                    },

                    {
                        id: 'thenuva:calc',
                        title: `${prefix}calc`,
                        description:
                            'Calculate mathematical expressions'
                    }
                ]
            },


            /* =================================================
             * DOWNLOADER
             * ================================================= */

            {
                title: '📥 DOWNLOADER',

                rows: [

                    {
                        id: 'thenuva:tt',
                        title: `${prefix}tt`,
                        description:
                            'TikTok video downloader'
                    },

                    {
                        id: 'thenuva:fb',
                        title: `${prefix}fb`,
                        description:
                            'Facebook video downloader'
                    },

                    {
                        id: 'thenuva:apk',
                        title: `${prefix}apk`,
                        description:
                            'Download APK files'
                    },

                    {
                        id: 'thenuva:video',
                        title: `${prefix}video`,
                        description:
                            'YouTube video downloader'
                    }
                ]
            },


            /* =================================================
             * UTILITY
             *
             * ABOUT IS NOT HERE.
             * It is already inside MAIN COMMANDS.
             * This prevents duplicate menu row IDs.
             * ================================================= */

            {
                title: '👤 UTILITY',

                rows: [

                    {
                        id: 'thenuva:owner',
                        title: `${prefix}owner`,
                        description:
                            'Show owner information'
                    },

                    {
                        id: 'thenuva:jid',
                        title: `${prefix}jid`,
                        description:
                            'Get current chat JID'
                    },

                    {
                        id: 'thenuva:calc',
                        title: `${prefix}calc`,
                        description:
                            'Calculate mathematical expressions'
                    }
                ]
            },


            /* =================================================
             * GAMES
             * ================================================= */

            {
                title: '🎮 GAMES',

                rows: [

                    {
                        id: 'thenuva:chess',
                        title: `${prefix}chess`,
                        description:
                            'Start a chess game'
                    },

                    {
                        id: 'thenuva:chess-undo',
                        title: `${prefix}chess undo`,
                        description:
                            'Undo the last chess move'
                    },

                    {
                        id: 'thenuva:chess-flip',
                        title: `${prefix}chess flip`,
                        description:
                            'Flip the chess board'
                    },

                    {
                        id: 'thenuva:chess-new',
                        title: `${prefix}chess new`,
                        description:
                            'Start a new chess game'
                    },

                    {
                        id: 'thenuva:chess-help',
                        title: `${prefix}chess help`,
                        description:
                            'Show chess commands'
                    }
                ]
            },


            /* =================================================
             * ANTIDELETE
             * ================================================= */

            {
                title: '🗑️ ANTIDELETE',

                rows: [

                    {
                        id: 'thenuva:antidelete-on',
                        title: 'Antidelete On',
                        description:
                            'Enable antidelete'
                    },

                    {
                        id: 'thenuva:antidelete-off',
                        title: 'Antidelete Off',
                        description:
                            'Disable antidelete'
                    },

                    {
                        id: 'thenuva:antidelete-status',
                        title: 'Antidelete Status',
                        description:
                            'Check antidelete status'
                    }
                ]
            }

        ];


        /* =================================================
         * SEND ONE NATIVE FLOW MENU
         * ================================================= */

        await sendListMenu(

            conn,

            from,

            {

                title: menuText,

                /*
                 * No emoji here.
                 * This is the single button.
                 */
                buttonText: 'Open Menu',

                sections,

                footer:
                    `${BOT_NAME} • POWERED BY ${CREATOR}`

            },

            mek
        );


    } catch (error) {

        console.error(
            '[MENU ERROR]',
            error
        );

        try {

            await reply(
                `❌ *MENU ERROR*\n\n` +
                `${error?.message || error}`
            );

        } catch (replyError) {

            console.error(
                '[MENU REPLY ERROR]',
                replyError
            );
        }
    }
});
