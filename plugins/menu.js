
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
        description: 'Search the web and YouTube'
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
            const owner = config.OWNER_NAME || 'Dilshan Ashinsa';

            const text = `
╭─〔 *ＴＨＥＮＵＶＡ Ｘ ＭＤ* 〕─●●►

👋 Hello, *${pushName || 'User'}*!

📌 *Select a category below*

╭───────────────
│ 👑 Owner Menu
│ 👥 Group Menu
│ 📥 Download Menu
│ 🛠️ Tools Menu
│ 🔎 Search Menu
│ 🏠 Main Menu
╰───────────────

ᴘᴏᴡᴇʀᴇᴅ ʙʏ *${owner}*
╰━━━━━━━━━━━━━━━●●►`;

            await sendListMenu(
                conn,
                from,
                {
                    title: 'THENUVA X MD',
                    text,
                    footer: 'POWERED BY DILSHAN ASHINSA',
                    buttonText: 'Select Category',
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
                { text: '❌ Menu එක යැවීමේදී දෝෂයක් ඇති වුණා.' },
                { quoted: mek }
            );
        }
    }
);

cmd(
    {
        pattern: 'ownermenu',
        react: '👑',
        desc: 'Show owner menu',
        category: 'main',
        filename: __filename
    },
    async (conn, mek, m, { from }) => {
        await conn.sendMessage(from, {
            text: '👑 *OWNER MENU*\n\n. setting\n. restart\n. menu'
        }, { quoted: mek });
    }
);

cmd(
    {
        pattern: 'groupmenu',
        react: '👥',
        desc: 'Show group menu',
        category: 'main',
        filename: __filename
    },
    async (conn, mek, m, { from }) => {
        await conn.sendMessage(from, {
            text: '👥 *GROUP MENU*\n\n. tagall\n. admins\n. groupinfo\n. menu'
        }, { quoted: mek });
    }
);

cmd(
    {
        pattern: 'downloadmenu',
        react: '📥',
        desc: 'Show download menu',
        category: 'main',
        filename: __filename
    },
    async (conn, mek, m, { from }) => {
        await conn.sendMessage(from, {
            text: '📥 *DOWNLOAD MENU*\n\n. video\n. playvideo\n. fb\n. apk\n. song\n. menu'
        }, { quoted: mek });
    }
);

cmd(
    {
        pattern: 'toolsmenu',
        react: '🛠️',
        desc: 'Show tools menu',
        category: 'main',
        filename: __filename
    },
    async (conn, mek, m, { from }) => {
        await conn.sendMessage(from, {
            text: '🛠️ *TOOLS MENU*\n\n. calc\n. jid\n. sticker\n. tts\n. translate\n. menu'
        }, { quoted: mek });
    }
);

cmd(
    {
        pattern: 'searchmenu',
        react: '🔎',
        desc: 'Show search menu',
        category: 'main',
        filename: __filename
    },
    async (conn, mek, m, { from }) => {
        await conn.sendMessage(from, {
            text: '🔎 *SEARCH MENU*\n\n. ytsearch\n. google\n. menu'
        }, { quoted: mek });
    }
);
