const { cmd } = require('../command');
const config = require('../config');
const { sendListMenu } = require('../lib/buttons');

cmd(
    {
        pattern: 'about',
        alias: ['developer', 'ownerinfo'],
        react: '👑',
        desc: 'Get bot information',
        category: 'main',
        filename: __filename
    },

    async (conn, mek, m, { from, pushName, pushname }) => {
        try {
            const userName =
                pushName ||
                pushname ||
                m?.pushName ||
                m?.pushname ||
                'User';

            const prefix = config.PREFIX || '.';
            const botName = 'THENUVA X MD';

            const aboutText = `
╭─(*ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ${botName}*)─●●►
│
│ 👋 ʜᴇʟʟᴏ, *${userName}* ❤️
│
│ 💖 Welcome to *${botName}*
│ 🤖 Your smart WhatsApp assistant
│ ⚡ Ready to make your WhatsApp
│    experience more amazing!
│
├─〔 *ᴀʙᴏᴜᴛ ᴍᴇ* 〕
│
│ 👨‍💻 *ᴅᴇᴠᴇʟᴏᴘᴇʀ* : Dilshan Ashinsa
│ 🚀 *ʙᴏᴛ ɴᴀᴍᴇ* : ${botName}
│ 🧩 *ᴘʀᴇғɪx* : ${prefix}
│ 🌟 *sᴛᴀᴛᴜs* : Always Ready
│
│ 💌 Thank you for choosing us!
│ ✨ Enjoy the experience!
│
╰───────────────●●►

🔘 *Choose your option below.*
            `.trim();

            await sendListMenu(conn, from, {
                title: aboutText,
                buttonText: 'OPEN MENU',
                footer: 'ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa',
                image: 'https://i.ibb.co/7JWk0d08/11625411f042.jpg',

                sections: [
                    {
                        title: '🤖 THENUVA X MD',
                        rows: [
                            {
                                id: `${prefix}alive`,
                                title: '🟢 Alive',
                                description: 'Check bot online status'
                            },
                            {
                                id: `${prefix}ping`,
                                title: '🏓 Ping',
                                description: 'Check bot response speed'
                            },
                            {
                                id: `${prefix}menu`,
                                title: '📋 Main Menu',
                                description: 'Open all bot commands'
                            },
                            {
                                id: `${prefix}about`,
                                title: '👑 About',
                                description: 'View bot information'
                            }
                        ]
                    }
                ]
            });

        } catch (error) {
            console.error('[ABOUT ERROR]', error);

            await conn.sendMessage(
                from,
                {
                    text:
                        `❌ *ABOUT ERROR*\n\n` +
                        `⚠️ ${error.message || 'Unknown error'}`
                },
                { quoted: mek }
            );
        }
    }
);
