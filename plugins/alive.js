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
            // Safe username
            const userName = pushName || 'User';

            // System information
            const uptime = runtime(process.uptime());

            const usedMemory = (
                process.memoryUsage().rss / 1024 / 1024
            ).toFixed(2);

            const totalMemory = (
                os.totalmem() / 1024 / 1024 / 1024
            ).toFixed(2);

            const imageUrl =
                'https://i.ibb.co/LXTMV60v/0bade47afdf9.jpg';

            const aliveText = ` 👋 HELLOW... ${pushName || 'User'} ❤️ WELCOME TO THENUWA X MD 🎉 ╭━━〔 STATUS PANEL 〕━━●●► │ │ ⏳ UPTIME : ${runtime(process.uptime())} │ 👤 USER : ${pushName || 'User'} │ 📂 RAM : ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB │ ⚙️ HOST : ${os.hostname()} │ 👨‍💻 OWNER : Dilshan Ashinsa │ 🧬 VERSION : v2.0.0 │ │ ╰━━━━━━━━━━━━━━━━━━━━●●►

> 🔘Select an option below.
            `.trim();

            await sendListMenu(conn, from, {
                title: aliveText,
                buttonText: 'ALIVE MENU',
                hideListButton: true,
                footer: '⚡ Powered by THENUVA X MD',
                image: imageUrl,

                sections: [
                    {
                        title: '🤖 THENUVA X MD',
                        rows: [
                            {
                                id: `${config.PREFIX || '.'}ping`,
                                title: '🏓 Ping',
                                description: 'Check bot response speed'
                            },
                            {
                                id: `${config.PREFIX || '.'}menu`,
                                title: '📋 Main Menu',
                                description: 'Open complete bot menu'
                            },
                            {
                                id: `${config.PREFIX || '.'}about`,
                                title: 'ℹ️ About',
                                description: 'View bot information'
                            }
                        ]
                    }
                ]
            });

        } catch (error) {
            console.error('[ALIVE ERROR]', error);

            await conn.sendMessage(from, {
                text:
                    `❌ *ALIVE ERROR*\n\n` +
                    `⚠️ ${error.message || 'Unknown error'}`
            }, { quoted: mek });
        }
    }
);
