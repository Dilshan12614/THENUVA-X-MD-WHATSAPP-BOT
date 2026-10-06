const config = require('../config');
const { cmd } = require('../command');
const { sendListMenu } = require('../lib/buttons');
const { runtime } = require('../lib/functions');
const os = require('os');

/*
|--------------------------------------------------------------------------
| THENUVA X MD - MENU CONFIG
|--------------------------------------------------------------------------
*/

const BOT_NAME = 'CYBER XMD';
const CREATOR = 'Dilshan Ashinsa';
const VERSION = 'v2.0.0';

const NEWSLETTER_NAME = 'CYBER X MD UPDATES';
const NEWSLETTER_JID = '120363xxxxxxxxxxxx@newsletter';

const MENU_IMAGE = 'https://i.ibb.co/yFQWcf3T/b454eacd7ab3.jpg';


/*
|--------------------------------------------------------------------------
| MENU COMMAND
|--------------------------------------------------------------------------
*/

cmd({
    pattern: 'menu',
    alias: ['help', 'commands'],
    react: '📚',
    desc: 'Open bot command menu',
    category: 'main',
    filename: __filename
},

async (conn, mek, m, {
    from,
    pushname,
    reply
}) => {

    try {

        /*
        |--------------------------------------------------------------------------
        | SYSTEM INFO
        |--------------------------------------------------------------------------
        */

        const ram = (
            process.memoryUsage().rss /
            1024 /
            1024
        ).toFixed(2);

        const botMode = config.MODE || 'public';
        const prefix = config.PREFIX || '.';

        const userName = pushname || 'User';


        /*
        |--------------------------------------------------------------------------
        | MENU HEADER
        |--------------------------------------------------------------------------
        */

        const menuText = `
╭───────────────●●►
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
╰───────────────❒
`;


        /*
        |--------------------------------------------------------------------------
        | MENU SECTIONS
        |--------------------------------------------------------------------------
        |
        | මේවා Open Menu button එක click කළාම පෙන්වන commands.
        |
        */

        const sections = [

            /*
            |--------------------------------------------------------------------------
            | MAIN COMMANDS
            |--------------------------------------------------------------------------
            */

            {
                title: '🔰 MAIN COMMANDS',

                rows: [

                    {
                        id: 'thenuva:alive',
                        title: 'Alive',
                        description: 'Check bot online status'
                    },

                    {
                        id: 'thenuva:ping',
                        title: 'Ping',
                        description: 'Check bot response speed'
                    },

                    {
                        id: 'thenuva:menu',
                        title: 'Menu',
                        description: 'Open command menu'
                    },

                    {
                        id: 'thenuva:about',
                        title: 'About',
                        description: 'About this bot'
                    },

                    {
                        id: 'thenuva:calendar',
                        title: 'Calendar',
                        description: 'Open calendar'
                    },

                    {
                        id: 'thenuva:jid',
                        title: 'JID',
                        description: 'Get chat JID'
                    },

                    {
                        id: 'thenuva:calc',
                        title: 'Calculator',
                        description: 'Calculate numbers'
                    }
                ]
            },


            /*
            |--------------------------------------------------------------------------
            | DOWNLOADER
            |--------------------------------------------------------------------------
            */

            {
                title: '📥 DOWNLOADER',

                rows: [

                    {
                        id: 'thenuva:tt',
                        title: 'TikTok',
                        description: 'Download TikTok videos'
                    },

                    {
                        id: 'thenuva:fb',
                        title: 'Facebook',
                        description: 'Download Facebook videos'
                    },

                    {
                        id: 'thenuva:apk',
                        title: 'APK',
                        description: 'Search and download APK'
                    },

                    {
                        id: 'thenuva:video',
                        title: 'YouTube Video',
                        description: 'Download YouTube video'
                    }
                ]
            },


            /*
            |--------------------------------------------------------------------------
            | UTILITY
            |--------------------------------------------------------------------------
            */

            {
                title: '👤 UTILITY',

                rows: [

                    {
                        id: 'thenuva:owner',
                        title: 'Owner',
                        description: 'Show bot owner contact'
                    },

                    {
                        id: 'thenuva:about',
                        title: 'About',
                        description: 'Bot information'
                    },

                    {
                        id: 'thenuva:jid',
                        title: 'JID',
                        description: 'Get WhatsApp JID'
                    },

                    {
                        id: 'thenuva:calc',
                        title: 'Calculator',
                        description: 'Perform calculations'
                    }
                ]
            },


            /*
            |--------------------------------------------------------------------------
            | GAMES
            |--------------------------------------------------------------------------
            */

            {
                title: '🎮 GAMES',

                rows: [

                    {
                        id: 'thenuva:chess',
                        title: 'Chess',
                        description: 'Start a chess game'
                    },

                    {
                        id: 'thenuva:chess-undo',
                        title: 'Chess Undo',
                        description: 'Undo last chess move'
                    },

                    {
                        id: 'thenuva:chess-flip',
                        title: 'Chess Flip',
                        description: 'Flip chess board'
                    },

                    {
                        id: 'thenuva:chess-new',
                        title: 'Chess New',
                        description: 'Start new chess game'
                    },

                    {
                        id: 'thenuva:chess-help',
                        title: 'Chess Help',
                        description: 'Chess commands'
                    }
                ]
            },


            /*
            |--------------------------------------------------------------------------
            | ANTIDELETE
            |--------------------------------------------------------------------------
            */

            {
                title: '🗑️ ANTIDELETE',

                rows: [

                    {
                        id: 'thenuva:antidelete-on',
                        title: 'Antidelete On',
                        description: 'Enable antidelete'
                    },

                    {
                        id: 'thenuva:antidelete-off',
                        title: 'Antidelete Off',
                        description: 'Disable antidelete'
                    },

                    {
                        id: 'thenuva:antidelete-status',
                        title: 'Antidelete Status',
                        description: 'Check antidelete status'
                    }
                ]
            }

        ];


        /*
        |--------------------------------------------------------------------------
        | SEND SINGLE MENU
        |--------------------------------------------------------------------------
        |
        | buttons.js එකේ කලින් හදපු sendListMenu()
        | function එකට මේක directly ගැළපෙනවා.
        |
        */

        await sendListMenu(
            conn,
            from,
            {
                title: menuText,

                // මෙතන emoji නැහැ.
                buttonText: 'Open Menu',

                sections,

                footer: `${BOT_NAME} • POWERED BY ${CREATOR}`,

                /*
                | buttons.js එක image support කරන version එක නම්
                | menu එකට image එකත් attach කරන්න.
                */
                image: {
                    url: MENU_IMAGE
                }
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
                `❌ Menu එක open කරන්න බැරි වුණා.\n\n` +
                `Error: ${error.message}`
            );

        } catch (replyError) {

            console.error(
                '[MENU REPLY ERROR]',
                replyError
            );

        }

    }

});
