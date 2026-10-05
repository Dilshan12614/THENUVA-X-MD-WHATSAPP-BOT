const config = require('../config');
const { cmd } = require('../command');
const { sendListMenu } = require('../lib/buttons');
const { runtime } = require('../lib/functions');

cmd({
    pattern: "menu",
    alias: ["help", "commands"],
    react: "📚",
    desc: "Open bot command menu",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, pushname, reply }) => {

    try {

        const sections = [

            /*
             * ==================================================
             * MAIN COMMANDS
             * ==================================================
             */

            {
                title: '🔰 MAIN COMMANDS',

                rows: [

                    {
                        id: 'thenuva:alive',
                        title: `${config.PREFIX}alive / ${config.PREFIX}status`,
                        description: 'Check bot status & uptime'
                    },

                    {
                        id: `${config.PREFIX}ping`,
                        title: `${config.PREFIX}ping`,
                        description: 'Check bot latency'
                    },

                    {
                        id: 'thenuva:menu',
                        title: `${config.PREFIX}menu`,
                        description: 'Show interactive menu'
                    },

                    {
                        id: 'thenuva:about',
                        title: `${config.PREFIX}about`,
                        description: 'About THENUVA X MD'
                    },

                    {
                        id: 'thenuva:calendar',
                        title: `${config.PREFIX}calendar`,
                        description: 'Show calendar'
                    },

                    {
                        id: 'thenuva:jid',
                        title: `${config.PREFIX}jid`,
                        description: 'Get chat JID'
                    },

                    {
                        id: 'thenuva:calc',
                        title: `${config.PREFIX}calc`,
                        description: 'Calculate expressions'
                    }
                ]
            },


            /*
             * ==================================================
             * DOWNLOADER
             * ==================================================
             */

            {
                title: '📥 DOWNLOADER',

                rows: [

                    {
                        id: `${config.PREFIX}tt`,
                        title: `${config.PREFIX}tt`,
                        description: 'TikTok video downloader'
                    },

                    {
                        id: 'thenuva:fb',
                        title: `${config.PREFIX}fb`,
                        description: 'Facebook video downloader'
                    },

                    {
                        id: 'thenuva:apk',
                        title: `${config.PREFIX}apk`,
                        description: 'Download APK'
                    },

                    {
                        id: 'thenuva:video',
                        title: `${config.PREFIX}video`,
                        description: 'YouTube video downloader'
                    }
                ]
            },


            /*
             * ==================================================
             * UTILITY
             * ==================================================
             */

            {
                title: '👤 UTILITY',

                rows: [

                    {
                        id: `${config.PREFIX}owner`,
                        title: `${config.PREFIX}owner`,
                        description: 'Show owner information'
                    },

                    {
                        id: 'thenuva:about',
                        title: `${config.PREFIX}about`,
                        description: 'About THENUVA X MD'
                    },

                    {
                        id: 'thenuva:jid',
                        title: `${config.PREFIX}jid`,
                        description: 'Show current chat JID'
                    },

                    {
                        id: 'thenuva:calc',
                        title: `${config.PREFIX}calc`,
                        description: 'Calculator'
                    }
                ]
            },


            /*
             * ==================================================
             * GAMES
             * ==================================================
             */

            {
                title: '🎮 GAMES',

                rows: [

                    {
                        id: 'thenuva:chess',
                        title: `${config.PREFIX}chess`,
                        description: 'Start a chess game'
                    },

                    {
                        id: 'thenuva:chess-undo',
                        title: `${config.PREFIX}chess undo`,
                        description: 'Undo last chess move'
                    },

                    {
                        id: 'thenuva:chess-flip',
                        title: `${config.PREFIX}chess flip`,
                        description: 'Flip chess board'
                    },

                    {
                        id: 'thenuva:chess-new',
                        title: `${config.PREFIX}chess new`,
                        description: 'Start a new chess game'
                    },

                    {
                        id: 'thenuva:chess-help',
                        title: `${config.PREFIX}chess help`,
                        description: 'Chess commands & help'
                    }
                ]
            },


            /*
             * ==================================================
             * ANTIDELETE
             * ==================================================
             */

            {
                title: '🗑️ ANTIDELETE',

                rows: [

                    {
                        id: 'thenuva:antidelete-on',
                        title: `${config.PREFIX}antidelete on`,
                        description: 'Enable AntiDelete'
                    },

                    {
                        id: 'thenuva:antidelete-off',
                        title: `${config.PREFIX}antidelete off`,
                        description: 'Disable AntiDelete'
                    },

                    {
                        id: 'thenuva:antidelete-status',
                        title: `${config.PREFIX}antidelete status`,
                        description: 'Check AntiDelete status'
                    }
                ]
            }

        ];


        await sendListMenu(
            conn,
            from,
            {
                title:
                    `📂 *THENUVA X MD — VIEW COMMANDS*\n\n` +
                    `👋 Hello: *${pushname || 'User'}*\n` +
                    `🕒 Runtime: *${runtime(process.uptime())}*\n` +
                    `⚡ Mode: *${config.MODE}*\n` +
                    `⚙️ Prefix: *${config.PREFIX}*`,

                buttonText: '📂 View Commands',

                sections,

                footer:
                    '💥 POWERED BY THENUVA X MD'
            },
            mek
        );

    } catch (e) {

        console.error(
            '[MENU ERROR]',
            e
        );

        return reply(
            `❌ *MENU ERROR*\n\n${e.message || e}`
        );
    }
});
