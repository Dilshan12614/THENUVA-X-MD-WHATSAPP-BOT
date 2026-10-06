const config = require('../config');
const { cmd } = require('../command');
const { sendListMenu } = require('../lib/buttons');
const { runtime } = require('../lib/functions');

cmd({
    pattern: "menu",
    alias: ["help", "commands"],
    react: "📚",
    desc: "Open CYBER XMD command menu",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, pushname, reply }) => {

    try {

        const botName = 'CYBER XMD';
        const creator = 'Dilshan Ashinsa';
        const version = 'v2.0.0';

        const ram = (
            process.memoryUsage().heapUsed /
            1024 /
            1024
        ).toFixed(2);

        /*
         * ==================================================
         * MENU IMAGE
         * ==================================================
         *
         * මේ URL එක වෙනස් කරන්න ඕන නම් මෙතනින් වෙනස් කරන්න.
         */
        const menuImage =
            'https://i.ibb.co/yFQWcf3T/b454eacd7ab3.jpg';


        /*
         * ==================================================
         * MENU HEADER IMAGE + INFO
         * ==================================================
         */

        const menuCaption =

`╭───────────────●●►
│ 🤖 *${botName}*
├───────────────●●►
│ 👋 Hello : *${pushname || 'User'}*
│ 👤 Creator : *${creator}*
│ 🕒 Runtime : *${runtime(process.uptime())}*
│ ⚡ Mode : *${config.MODE}*
│ ⚙️ Prefix : *${config.PREFIX}*
│ 💾 RAM Use : *${ram} MB*
│ 📌 Version : *${version}*
╰───────────────●●►

╭───────────────❒
│ 💙 *WELCOME TO ${botName}*
│ 👑 *POWERED BY ${creator}*
╰───────────────❒

📂 *Tap View Commands below*
to explore all available commands.`;


        /*
         * ==================================================
         * SEND IMAGE
         * ==================================================
         */

        await conn.sendMessage(
            from,
            {
                image: {
                    url: menuImage
                },

                caption: menuCaption,

                contextInfo: {
                    mentionedJid:
                        m.sender
                            ? [m.sender]
                            : [],

                    forwardingScore: 999,

                    isForwarded: true
                }
            },
            {
                quoted: mek
            }
        );


        /*
         * ==================================================
         * COMMAND LIST
         * ==================================================
         */

        const sections = [

            /*
             * ============================
             * MAIN COMMANDS
             * ============================
             */

            {
                title: '🔰 MAIN COMMANDS',

                rows: [

                    {
                        id: 'thenuva:alive',
                        title: `${config.PREFIX}alive`,
                        description:
                            'Check bot status, uptime and RAM'
                    },

                    {
                        id: 'thenuva:ping',
                        title: `${config.PREFIX}ping`,
                        description:
                            'Check bot response speed'
                    },

                    {
                        id: 'thenuva:menu',
                        title: `${config.PREFIX}menu`,
                        description:
                            'Open CYBER XMD command menu'
                    },

                    {
                        id: 'thenuva:about',
                        title: `${config.PREFIX}about`,
                        description:
                            'About CYBER XMD'
                    },

                    {
                        id: 'thenuva:calendar',
                        title: `${config.PREFIX}calendar`,
                        description:
                            'Show current calendar'
                    },

                    {
                        id: 'thenuva:jid',
                        title: `${config.PREFIX}jid`,
                        description:
                            'Get current chat JID'
                    },

                    {
                        id: 'thenuva:calc',
                        title: `${config.PREFIX}calc`,
                        description:
                            'Calculate mathematical expressions'
                    }
                ]
            },


            /*
             * ============================
             * DOWNLOADER
             * ============================
             */

            {
                title: '📥 DOWNLOADER',

                rows: [

                    {
                        id: 'thenuva:tt',
                        title: `${config.PREFIX}tt`,
                        description:
                            'TikTok video downloader'
                    },

                    {
                        id: 'thenuva:fb',
                        title: `${config.PREFIX}fb`,
                        description:
                            'Facebook video downloader'
                    },

                    {
                        id: 'thenuva:apk',
                        title: `${config.PREFIX}apk`,
                        description:
                            'Download APK files'
                    },

                    {
                        id: 'thenuva:video',
                        title: `${config.PREFIX}video`,
                        description:
                            'YouTube video downloader'
                    }
                ]
            },


            /*
             * ============================
             * UTILITY
             * ============================
             */

            {
                title: '👤 UTILITY',

                rows: [

                    {
                        id: 'thenuva:owner',
                        title: `${config.PREFIX}owner`,
                        description:
                            'Show owner information'
                    },

                    {
                        id: 'thenuva:about',
                        title: `${config.PREFIX}about`,
                        description:
                            'About CYBER XMD'
                    },

                    {
                        id: 'thenuva:jid',
                        title: `${config.PREFIX}jid`,
                        description:
                            'Show current chat JID'
                    },

                    {
                        id: 'thenuva:calc',
                        title: `${config.PREFIX}calc`,
                        description:
                            'Calculator'
                    }
                ]
            },


            /*
             * ============================
             * GAMES
             * ============================
             */

            {
                title: '🎮 GAMES',

                rows: [

                    {
                        id: 'thenuva:chess',
                        title: `${config.PREFIX}chess`,
                        description:
                            'Start a chess game'
                    },

                    {
                        id: 'thenuva:chess-undo',
                        title: `${config.PREFIX}chess undo`,
                        description:
                            'Undo last chess move'
                    },

                    {
                        id: 'thenuva:chess-flip',
                        title: `${config.PREFIX}chess flip`,
                        description:
                            'Flip chess board'
                    },

                    {
                        id: 'thenuva:chess-new',
                        title: `${config.PREFIX}chess new`,
                        description:
                            'Start a new chess game'
                    },

                    {
                        id: 'thenuva:chess-help',
                        title: `${config.PREFIX}chess help`,
                        description:
                            'Chess help and commands'
                    }
                ]
            },


            /*
             * ============================
             * ANTIDELETE
             * ============================
             */

            {
                title: '🗑️ ANTIDELETE',

                rows: [

                    {
                        id: 'thenuva:antidelete-on',
                        title: `${config.PREFIX}antidelete on`,
                        description:
                            'Enable AntiDelete'
                    },

                    {
                        id: 'thenuva:antidelete-off',
                        title: `${config.PREFIX}antidelete off`,
                        description:
                            'Disable AntiDelete'
                    },

                    {
                        id: 'thenuva:antidelete-status',
                        title: `${config.PREFIX}antidelete status`,
                        description:
                            'Check AntiDelete status'
                    }
                ]
            }

        ];


        /*
         * ==================================================
         * SEND VIEW COMMANDS LIST
         * ==================================================
         */

        await sendListMenu(
            conn,
            from,
            {
                title:
`🤖 *${botName}*

👑 Creator : *${creator}*

📚 *COMMAND CENTER*

Select a command category below.`,

                buttonText:
                    '📂 View Commands',

                sections,

                footer:
                    `💙 ${botName} • POWERED BY ${creator}`
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
