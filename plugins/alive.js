const { cmd } = require('../command');
const config = require('../config');
const { sendListMenu } = require('../lib/buttons');
const os = require('os');
const { runtime } = require('../lib/functions');

cmd(
    {
        pattern: 'alive',
        alias: ['online', 'status'],
        react: '🟢',
        desc: 'Check bot online status',
        category: 'main',
        filename: __filename
    },

    async (conn, mek, m, { from, pushName }) => {
        try {
            // USER INFORMATION
            const userName =
                pushName ||
                m?.pushName ||
                m?.pushname ||
                m?.senderName ||
                'User';

            const prefix = config.PREFIX || '.';
            const uptime = runtime(process.uptime());

            // MEMORY USAGE
            const usedMemory = (
                process.memoryUsage().rss / 1024 / 1024
            ).toFixed(2);

            // STATUS IMAGE
            const imageUrl =
                'https://i.ibb.co/LXTMV60v/0bade47afdf9.jpg';

            // ALIVE STATUS TEXT
            const aliveText = `👋 HELLOW...*${pushname || 'User'}* ❤️ I am ALIVE NOW CYBER X THENULA 

╭─〔 *sᴛᴀᴛᴜs ᴘᴀɴᴇʟ* 〕──●●►
 │
 │ ⏳ *ᴜᴘᴛɪᴍᴇ*  : ${uptime}
 │ 👤 *ᴜsᴇʀ*    : ${userName}
 │ 📁 *ʀᴀᴍ*     : ${usedMemory}MB
 │ ⚙️ *ʜᴏsᴛ*    : ${os.hostname()}
 │ 👨‍💻 *ᴏᴡɴᴇʀ*   : Dilshan Ashinsa
 │ 🧬 *ᴠᴇʀsɪᴏɴ* : v2.0.0
 │
 ╰──────────────────●●►

🔘 Select an option below.
            `.trim();

            // INTERACTIVE LIST MENU
            await sendListMenu(conn, from, {
                title: aliveText,
                buttonText: 'OPEN MENU',
                hideListButton: false,
                footer: '⚡ POWERED BY THENUVA X MD',
                image: imageUrl,

                sections: [
                    {
                        title: '🤖 THENUVA X MD',
                        rows: [
                            {
                                id: `${prefix}ping`,
                                title: '🏓 Ping',
                                description: 'Check bot response speed'
                            },
                            {
                                id: `${prefix}menu`,
                                title: '📋 Main Menu',
                                description: 'Open complete bot menu'
                            },
                            {
                                id: `${prefix}about`,
                                title: 'ℹ️ About',
                                description: 'View bot information'
                            }
                        ]
                    }
                ]
            });

        } catch (error) {
            console.error('[ALIVE ERROR]', error);

            await conn.sendMessage(
                from,
                {
                    text:
                        `❌ *ALIVE ERROR*\n\n` +
                        `⚠️ ${error.message || 'Unknown error'}`
                },
                { quoted: mek }
            );
        }
    }
);
