const config = require('../config');
const { cmd } = require('../command');
const { sendListMenu } = require('../lib/buttons');
const { runtime } = require('../lib/functions');


/* =========================================================
 * THENUVA X MD MENU CONFIG
 * ========================================================= */

const BOT_NAME = 'THENUVA X MD';
const CREATOR = 'Dilshan Ashinsa';
const VERSION = 'v2.0.0';

const NEWSLETTER_NAME = 'THENUVA X MD UPDATES';
const NEWSLETTER_JID = '120363xxxxxxxxxxxx@newsletter';

const MENU_IMAGE =
    'https://i.ibb.co/LXTMV60v/0bade47afdf9.jpg';


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

    desc: 'Open THENUVA X MD command menu',

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

        const menuText = `*👋 HELLOW...${pushname}* ❤️ welcome to CYBER THENULA...


*✅ CYBER THENUWA X MD ✅*
╭────────────●●►
┃ 🎉️ *THENUWA X MD* 🎉️
┃ 🕒 Runtime : ${runtime(process.uptime())}
┃ ⚡ Mode    : ${config.MODE}
┃ ⚙️ Prefix  : ${config.PREFIX}
┃ 👤 owner   : Dilshan Ashinsa
┃ 📌 Version : v2.0.0
╰────────────●●►
`;



        /* =================================================
         * MENU SECTIONS
         *
         * IMPORTANT:
         * Every row ID is UNIQUE.
         * Do NOT duplicate any ID.
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
                            'Open THENUVA X MD command menu'
                    },

                    {
                        id: 'thenuva:about',
                        title: `${prefix}about`,
                        description:
                            'About THENUVA X MD'
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
             * JID and CALC are already in MAIN COMMANDS.
             * They must NOT be repeated here.
             * ================================================= */

            {
                title: '👤 UTILITY',

                rows: [

                    {
                        id: 'thenuva:owner',
                        title: `${prefix}owner`,
                        description:
                            'Show owner information'
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
         * FINAL SAFETY CHECK
         *
         * Prevent duplicate row IDs from breaking the menu.
         * ================================================= */

        const seenIds = new Set();

        for (const section of sections) {

            if (!section || !Array.isArray(section.rows)) {
                continue;
            }

            section.rows = section.rows.filter(row => {

                if (!row || !row.id) {
                    return false;
                }

                if (seenIds.has(row.id)) {

                    console.warn(
                        `[MENU] Duplicate row removed: ${row.id}`
                    );

                    return false;
                }

                seenIds.add(row.id);

                return true;
            });
        }


        /* =================================================
         * SEND ONE NATIVE FLOW MENU
         * ================================================= */

        await sendListMenu(
    conn,
    from,
    {
        title: menuText,
        buttonText: 'Open Menu',
        sections,
        footer: `${BOT_NAME} • POWERED BY ${CREATOR}`,
        image: 'https://i.ibb.co/LXTMV60v/0bade47afdf9.jpg'
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
