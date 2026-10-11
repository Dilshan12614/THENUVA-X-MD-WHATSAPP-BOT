const { cmd } = require('../command');
const config = require('../config');
const os = require('os');
const { runtime } = require('../lib/functions');
const { sendListMenu } = require('../lib/buttons');

cmd({
    pattern: 'menu',
    alias: ['help', 'commands'],
    react: '📋',
    desc: 'THENUVA X MD interactive menu',
    category: 'main',
    filename: __filename
},
async (conn, mek, m, { from, pushName }) => {
    try {
        const prefix = config.PREFIX || '.';

        const userName =
            pushName ||
            m?.pushName ||
            m?.pushname ||
            'User';

        const uptime = runtime(process.uptime());

        const ram = (
            process.memoryUsage().rss / 1024 / 1024
        ).toFixed(2);

        const sections = [
            // MAIN MENU
            {
                title: '🏠 MAIN MENU',
                rows: [
                    {
                        id: `${prefix}menuall`,
                        title: '📚 All Commands',
                        description: 'View all available bot commands'
                    },
                    {
                        id: `${prefix}alive`,
                        title: '🟢 Bot Status',
                        description: 'Check bot online status'
                    },
                    {
                        id: `${prefix}ping`,
                        title: '🏓 Ping',
                        description: 'Check bot response speed'
                    },
                    {
                        id: `${prefix}about`,
                        title: '💖 About Bot',
                        description: 'Information about THENUVA X MD'
                    },
                    {
                        id: `${prefix}calendar`,
                        title: '📅 Calendar',
                        description: 'Calendar command'
                    },
                    {
                        id: `${prefix}owner`,
                        title: '👑 Owner',
                        description: 'Contact bot owner'
                    }
                ]
            },

            // DOWNLOAD MENU
            {
                title: '📥 DOWNLOAD MENU',
                rows: [
                    {
                        id: `${prefix}song`,
                        title: '🎵 Song Downloader',
                        description: 'Search and download MP3 songs'
                    },
                    {
                        id: `${prefix}playvideo`,
                        title: '🎬 Play Video',
                        description: 'Search and download videos'
                    },
                    {
                        id: `${prefix}video`,
                        title: '📹 Video Downloader',
                        description: 'Video download command'
                    },
                    {
                        id: `${prefix}fb`,
                        title: '📘 Facebook Downloader',
                        description: 'Download Facebook media'
                    },
                    {
                        id: `${prefix}apk`,
                        title: '📱 APK Downloader',
                        description: 'APK download command'
                    }
                ]
            },

            // GROUP MENU
            {
                title: '👥 GROUP MENU',
                rows: [
                    {
                        id: `${prefix}groupmenu`,
                        title: '👥 Group Menu',
                        description: 'View group commands'
                    },
                    {
                        id: `${prefix}tagall`,
                        title: '📢 Tag All',
                        description: 'Mention group members'
                    },
                    {
                        id: `${prefix}admins`,
                        title: '🛡️ Admins',
                        description: 'Group admin command'
                    },
                    {
                        id: `${prefix}groupinfo`,
                        title: 'ℹ️ Group Info',
                        description: 'View group information'
                    }
                ]
            },

            // TOOLS MENU
            {
                title: '🛠️ TOOLS MENU',
                rows: [
                    {
                        id: `${prefix}calc`,
                        title: '🧮 Calculator',
                        description: 'Calculate expressions'
                    },
                    {
                        id: `${prefix}jid`,
                        title: '🆔 JID',
                        description: 'Get chat ID'
                    },
                    {
                        id: `${prefix}sticker`,
                        title: '🎨 Sticker Maker',
                        description: 'Create stickers from media'
                    },
                    {
                        id: `${prefix}tts`,
                        title: '🗣️ Text To Speech',
                        description: 'Convert text to speech'
                    },
                    {
                        id: `${prefix}translate`,
                        title: '🌐 Translator',
                        description: 'Translate text'
                    }
                ]
            },

            // SEARCH MENU
            {
                title: '🔎 SEARCH MENU',
                rows: [
                    {
                        id: `${prefix}searchmenu`,
                        title: '🔎 Search Menu',
                        description: 'Open search options'
                    },
                    {
                        id: `${prefix}ytsearch`,
                        title: '▶️ YouTube Search',
                        description: 'Search YouTube'
                    },
                    {
                        id: `${prefix}google`,
                        title: '🌍 Google Search',
                        description: 'Search the web'
                    }
                ]
            },

            // OWNER MENU
            {
                title: '👑 OWNER MENU',
                rows: [
                    {
                        id: `${prefix}ownermenu`,
                        title: '👑 Owner Commands',
                        description: 'View owner options'
                    },
                    {
                        id: `${prefix}setting`,
                        title: '⚙️ Settings',
                        description: 'Bot configuration options'
                    },
                    {
                        id: `${prefix}restart`,
                        title: '🔄 Restart',
                        description: 'Restart command'
                    }
                ]
            },

            // ANTIDELETE MENU
            {
                title: '🛡️ ANTIDELETE MENU',
                rows: [
                    {
                        id: `${prefix}antidelete on`,
                        title: '✅ Enable AntiDelete',
                        description: 'Enable AntiDelete'
                    },
                    {
                        id: `${prefix}antidelete off`,
                        title: '❌ Disable AntiDelete',
                        description: 'Disable AntiDelete'
                    },
                    {
                        id: `${prefix}antidelete status`,
                        title: '📊 AntiDelete Status',
                        description: 'Check AntiDelete settings'
                    }
                ]
            }
        ];

        const menuText = `👋 *ʜᴇʟʟᴏ... ${userName}* ❤️
*ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 🎉

╭─〔 *sᴛᴀᴛᴜs ᴘᴀɴᴇʟ* 〕──●●►
│
│ ⏳ *ᴜᴘᴛɪᴍᴇ*  : ${uptime}
│ 👤 *ᴜsᴇʀ*    : ${userName}
│ 📁 *ʀᴀᴍ*     : ${ram} MB
│ ⚙️ *ʜᴏsᴛ*    : ${os.hostname()}
│ 👨‍💻 *ᴏᴡɴᴇʀ*   : Dilshan Ashinsa
│ 🧬 *ᴠᴇʀsɪᴏɴ* : v2.0.0
│
╰─────────────●●►

🔘 *choose an option below.*`;

        await sendListMenu(conn, from, {
            title: menuText,
            buttonText: '📋 OPEN MENU',
            sections,
            footer: 'THENUVA X MD • POWERED BY Dilshan Ashinsa',
            image: 'https://i.ibb.co/BV4dPxkT/ad40079469ef.jpg',
            hideListButton: false
        }, mek);

    } catch (error) {
        console.error('[MENU ERROR]', error);

        await conn.sendMessage(from, {
            text: `❌ *MENU ERROR*\n\n${error.message || error}`
        }, { quoted: mek });
    }
});
