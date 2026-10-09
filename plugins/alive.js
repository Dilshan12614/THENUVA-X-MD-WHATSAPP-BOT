const { cmd } = require('../command');
const config = require('../config');
const os = require('os');
const { runtime } = require('../lib/functions');
const { sendListMenu } = require('../lib/buttons');

cmd(
    {
        pattern: 'alive',
        alias: ['online', 'status'],
        react: '🟢',
        desc: 'Check bot online status',
        category: 'main',
        filename: __filename
    },

    async (conn, mek, m, { from, pushname }) => {
        try {
            // ==============================
            // ALIVE MESSAGE
            // ==============================
            const aliveMessage = `
🟢 *ALIVE NOW* 🟢

👋 HELLOW... *${pushname || 'User'}* ❤️
I am ALIVE NOW CYBER X THENULA

✅ *CYBER THENULA X MD IS ONLINE* ✅

╭┈───────────────•
│  ◦ 🕒 *Runtime* : ${runtime(process.uptime())}
│  ◦ ⚡ *Mode* : *[${config.MODE}]*
│  ◦ ⚙️ *Prefix* : *[${config.PREFIX}]*
│  ◦ 🤖 *Name Bot* : *THENUVA XMD*
│  ◦ 👤 *Creator* : *Thenula/Dilshan*
│  ◦ 📌 *Version* : *ᴠ.2.0.0*
╰┈───────────────•

> © ⚡ *POWERED by CYBER THENUWA*
            `.trim();

            // ==============================
            // IMAGE
            // ==============================
            const imageUrl =
                'https://i.ibb.co/qPDNmSY/5cdec1f68264.jpg';

            // ==============================
            // ALIVE MENU
            // ==============================
            await sendListMenu(conn, from, {
                title: '🟢 THENUVA X MD',
                buttonText: 'ALIVE STATUS',
                hideListButton: true,

                description: aliveMessage,

                footer: '⚡ Powered by THENUVA X MD',

                image: imageUrl,

                sections: [
                    {
                        title: '🟢 BOT STATUS',

                        rows: [
                            {
                                id: `${config.PREFIX}ping`,
                                title: '🏓 Ping',
                                description: 'Check bot response speed'
                            },
                            {
                                id: `${config.PREFIX}menu`,
                                title: '📋 Main Menu',
                                description: 'Open complete bot menu'
                            },
                            {
                                id: `${config.PREFIX}about`,
                                title: '🤖 About',
                                description: 'View bot information'
                            }
                        ]
                    }
                ]
            });

            // ==============================
            // CONTACT ME / VIEW CHANNEL
            // ==============================
            await conn.sendMessage(
                from,
                {
                    text: '👇 *CONTACT & CHANNEL*',
                    footer: '⚡ THENUVA X MD',

                    templateButtons: [
                        {
                            index: 1,
                            urlButton: {
                                displayText: '👤 Contact Me',
                                url: 'https://wa.me/94742876482'
                            }
                        },
                        {
                            index: 2,
                            urlButton: {
                                displayText: '📢 View Channel',
                                url: 'https://whatsapp.com/channel/120363403804248705'
                            }
                        }
                    ]
                },
                { quoted: mek }
            );

        } catch (error) {
            console.error('[ALIVE ERROR]', error);

            try {
                await conn.sendMessage(
                    from,
                    {
                        text:
                            `❌ *ALIVE ERROR*\n\n` +
                            `⚠️ ${error.message || 'Unknown error'}`
                    },
                    { quoted: mek }
                );
            } catch (sendError) {
                console.error('[ALIVE SEND ERROR]', sendError);
            }
        }
    }
);
