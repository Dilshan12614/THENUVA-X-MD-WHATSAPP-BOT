const { cmd } = require('../command');
const config = require('../config');
const { sendListMenu } = require('../lib/buttons');

const MENU_IMAGE = 'https://i.ibb.co/LXTMV60v/0bade47afdf9.jpg';

const CATEGORIES = [
    {
        title: '👑 Owner Menu',
        id: 'thenuva:owner',
        description: 'Owner commands and bot settings'
    },
    {
        title: '👥 Group Menu',
        id: 'thenuva:group',
        description: 'Group management commands'
    },
    {
        title: '📥 Download Menu',
        id: 'thenuva:downloads',
        description: 'Download videos, songs and files'
    },
    {
        title: '🛠️ Tools Menu',
        id: 'thenuva:tools',
        description: 'Useful tools and utilities'
    },
    {
        title: '🔎 Search Menu',
        id: 'thenuva:search',
        description: 'Search YouTube and Google'
    },
    {
        title: '🏠 Main Menu',
        id: 'thenuva:menu',
        description: 'Return to the main menu'
    }
];

cmd(
    {
        pattern: 'menu',
        alias: ['help'],
        react: '📂',
        desc: 'Show bot menu',
        category: 'main',
        filename: __filename
    },
    async (conn, mek, m, { from, pushName }) => {
        try {
            const text = `
👋 *ʜᴇʟʟᴏ... ${pushname}* 
*ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ* 🎉

╭─〔*ＴＨＥＮＵＶＡ Ｘ ＭＤ*〕──●●►
│
│ ⏳ *ᴜᴘᴛɪᴍᴇ*  : ${uptime}
│ 👤 *ᴜsᴇʀ*    : ${userName}
│ 📁 *ʀᴀᴍ*     : ${usedMemory}MB
│ ⚙️ *ʜᴏsᴛ*    : ${os.hostname()}
│ 👨‍💻 *ᴏᴡɴᴇʀ*   : Dilshan Ashinsa
│ 🧬 *ᴠᴇʀsɪᴏɴ* : v2.0.0
│
╰────────────────●●►

🔘 Select an option.`;

            await sendListMenu(
                conn,
                from,
                {
                    title: text,
                    buttonText: 'Select Category',
                    footer: 'ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa',
                    sections: [
                        {
                            title: '📂 MENU CATEGORIES',
                            rows: CATEGORIES
                        }
                    ],
                    image: MENU_IMAGE
                },
                mek
            );
        } catch (error) {
            console.error('[MENU ERROR]', error);

            await conn.sendMessage(
                from,
                {
                    text: '❌ Menu එක යැවීමේදී දෝෂයක් ඇති වුණා.'
                },
                { quoted: mek }
            );
        }
    }
);

// OWNER MENU
cmd(
    {
        pattern: 'ownermenu',
        react: '👑',
        desc: 'Show owner menu',
        category: 'main',
        filename: __filename
    },
    async (conn, mek, m, { from }) => {
        await conn.sendMessage(
            from,
            {
                text:
                    '👑 *OWNER MENU*\n\n' +
                    '⚙️ .setting\n' +
                    '🔄 .restart\n' +
                    '🏠 .menu'
            },
            { quoted: mek }
        );
    }
);

// GROUP MENU
cmd(
    {
        pattern: 'groupmenu',
        react: '👥',
        desc: 'Show group menu',
        category: 'main',
        filename: __filename
    },
    async (conn, mek, m, { from }) => {
        await conn.sendMessage(
            from,
            {
                text:
                    '👥 *GROUP MENU*\n\n' +
                    '📢 .tagall\n' +
                    '👮 .admins\n' +
                    'ℹ️ .groupinfo\n' +
                    '🏠 .menu'
            },
            { quoted: mek }
        );
    }
);

// DOWNLOAD MENU
cmd(
    {
        pattern: 'downloadmenu',
        react: '📥',
        desc: 'Show download menu',
        category: 'main',
        filename: __filename
    },
    async (conn, mek, m, { from }) => {
        await conn.sendMessage(
            from,
            {
                text:
                    '📥 *DOWNLOAD MENU*\n\n' +
                    '🎬 .video\n' +
                    '▶️ .playvideo\n' +
                    '📘 .fb\n' +
                    '📦 .apk\n' +
                    '🎵 .song\n' +
                    '🏠 .menu'
            },
            { quoted: mek }
        );
    }
);

// TOOLS MENU
cmd(
    {
        pattern: 'toolsmenu',
        react: '🛠️',
        desc: 'Show tools menu',
        category: 'main',
        filename: __filename
    },
    async (conn, mek, m, { from }) => {
        await conn.sendMessage(
            from,
            {
                text:
                    '🛠️ *TOOLS MENU*\n\n' +
                    '🧮 .calc\n' +
                    '🆔 .jid\n' +
                    '🎨 .sticker\n' +
                    '🗣️ .tts\n' +
                    '🌐 .translate\n' +
                    '🏠 .menu'
            },
            { quoted: mek }
        );
    }
);

// SEARCH MENU
cmd(
    {
        pattern: 'searchmenu',
        react: '🔎',
        desc: 'Show search menu',
        category: 'main',
        filename: __filename
    },
    async (conn, mek, m, { from }) => {
        await conn.sendMessage(
            from,
            {
                text:
                    '🔎 *SEARCH MENU*\n\n' +
                    '▶️ .ytsearch\n' +
                    '🌐 .google\n' +
                    '🏠 .menu'
            },
            { quoted: mek }
        );
    }
);
