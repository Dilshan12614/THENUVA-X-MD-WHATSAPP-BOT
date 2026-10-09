const { cmd } = require('../command');
const config = require('../config');
const { sendListMenu } = require('../lib/buttons');

cmd({
    pattern: 'menu',
    alias: ['help', 'commands'],
    react: '📋',
    desc: 'Show interactive list menu',
    category: 'main',
    filename: __filename
},
async (conn, mek, m, { from, pushName }) => {
    try {
        const prefix = config.PREFIX || '.';
        const userName = pushName || m?.pushName || 'User';

        const sections = [
            {
                title: '🤖 THENUVA X MD',
                rows: [
                    {
                        id: `${prefix}menuall`,
                        title: '📚 All Commands',
                        description: 'View all bot commands'
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
                        id: `${prefix}owner`,
                        title: '👑 Owner',
                        description: 'Bot owner details'
                    }
                ]
            },
            {
                title: '🎮 FUN & TOOLS',
                rows: [
                    {
                        id: `${prefix}chess`,
                        title: '♟️ Chess',
                        description: 'Play a chess game'
                    },
                    {
                        id: `${prefix}calc`,
                        title: '🧮 Calculator',
                        description: 'Open calculator'
                    },
                    {
                        id: `${prefix}jid`,
                        title: '🆔 JID',
                        description: 'Get chat ID information'
                    }
                ]
            },
            {
                title: '📥 DOWNLOADS',
                rows: [
                    {
                        id: `${prefix}fb`,
                        title: '📘 Facebook',
                        description: 'Download Facebook media'
                    },
                    {
                        id: `${prefix}video`,
                        title: '🎬 Video',
                        description: 'Download video'
                    },
                    {
                        id: `${prefix}apk`,
                        title: '📱 APK',
                        description: 'APK download command'
                    }
                ]
            }
        ];

        await sendListMenu(conn, from, {
            title:
                `╭━━━〔 *THENUVA X MD* 〕━━━╮\n` +
                `┃ 👋 Hello, ${userName}\n` +
                `┃\n` +
                `┃ 🤖 Interactive Bot Menu\n` +
                `┃ ⚡ Prefix: ${prefix}\n` +
                `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                `👇 Tap the button below to open the menu.`,
            buttonText: '📋 OPEN MENU',
            sections,
            footer: 'THENUVA X MD • POWERED BY Dilshan Ashinsa',
            image: 'https://i.ibb.co/LXTMV60v/0bade47afdf9.jpg',
            hideListButton: false
        }, mek);

    } catch (error) {
        console.error('[MENU ERROR]', error);

        await conn.sendMessage(from, {
            text: `❌ Menu error: ${error.message || error}`
        }, { quoted: mek });
    }
});
