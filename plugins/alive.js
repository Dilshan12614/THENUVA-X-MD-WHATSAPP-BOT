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
            const userName = pushName || 'User';
            const prefix = config.PREFIX || '.';

            const uptime = runtime(process.uptime());

            const usedMemory = (
                process.memoryUsage().rss / 1024 / 1024
            ).toFixed(2);

            const imageUrl =
                'https://i.ibb.co/LXTMV60v/0bade47afdf9.jpg';

            // Compact STATUS PANEL
            const aliveText = `
👋 HELLOW... ${pushname} ❤️
WELCOME TO THENUVA X MD 🎉

╭━━〔 STATUS PANEL 〕━━●●►
│
│ ⏳ UPTIME  : ${uptime}
│ 👤 USER    : ${userName}
│ 📂 RAM     : ${usedMemory}MB
│ ⚙️ HOST    : ${os.hostname()}
│ 👨‍💻 OWNER   : Dilshan Ashinsa
│ 🧬 VERSION : v2.0.0
│
╰━━━━━━━━━━━━━━━━━●●►

 🔘 Select an option below.
            `.trim();

            await sendListMenu(conn, from, {
                title: aliveText,
                buttonText: 'OPEN MENU',
                hideListButton: false,
                footer: 'THENUVA X MD • POWERED BY Dilshan Ashinsa',
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
                                title: '📋 Open Menu',
                                description: 'Open the complete bot menu'
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
