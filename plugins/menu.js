const { cmd } = require('../command');
const config = require('../config');
const os = require('os');
const { runtime } = require('../lib/functions');
const { sendListMenu } = require('../lib/buttons');

cmd(
    {
        pattern: 'menu',
        alias: ['help', 'commands'],
        react: '📋',
        desc: 'Show bot menu',
        category: 'main',
        filename: __filename
    },

    async (conn, mek, m, { from, pushName }) => {
        try {
            const prefix = config.PREFIX || '.';
            const userName = pushName || m?.pushName || 'User';

            const uptime = runtime(process.uptime());

            const usedMemory = (
                process.memoryUsage().rss / 1024 / 1024
            ).toFixed(2);

            const imageUrl =
                'https://i.ibb.co/LXTMV60v/0bade47afdf9.jpg';

            const menuText = `
👋 HELLOW... ${userName} ❤️

WELCOME TO THENUVA X MD 🎉


╭─〔 *STATUS PANEL* 〕──●●►
 │
 │ ⏳ *UPTIME*   : ${uptime}
 │ 👤 *USER*     : ${userName}
 │ 📁 *RAM*      : ${usedMemory}MB
 │ ⚙️ *HOST*     : ${os.hostname()}
 │ 👨‍💻 *OWNER*    : Dilshan Ashinsa
 │ 🧬 *VERSION*  : v2.0.0
 │
 ╰────────────────●●►


⚡ POWERED BY THENUVA X MD
👑 Dilshan Ashinsa
            `.trim();

            await sendListMenu(conn, from, {
                title: menuText,
                buttonText: 'OPEN MENU',
                hideListButton: false,
                footer: 'THENUVA X MD • POWERED BY Dilshan Ashinsa',
                image: imageUrl,

                sections: [
                    {
                        title: '🤖 THENUVA X MD',
                        rows: [
                            {
                                id: `${prefix}menu`,
                                title: '📋 Open Menu',
                                description: 'View all bot commands'
                            },
                            {
                                id: `${prefix}contact`,
                                title: '💬 Contact Me',
                                description: 'Contact bot owner'
                            },
                            {
                                id: `${prefix}channel`,
                                title: '🌐 View Channel',
                                description: 'Visit our WhatsApp channel'
                            }
                        ]
                    }
                ]
            });

        } catch (error) {
            console.error('[MENU ERROR]', error);

            await conn.sendMessage(
                from,
                {
                    text: `❌ *MENU ERROR*\n\n${error.message || 'Unknown error'}`
                },
                { quoted: mek }
            );
        }
    }
);
