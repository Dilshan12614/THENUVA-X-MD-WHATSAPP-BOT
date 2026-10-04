const config = require('../config');
const { cmd } = require('../command');
const { sendButtons } = require('../lib/buttons');
const { runtime } = require('../lib/functions');

cmd({
    pattern: "menu",
    alias: ["help", "commands"],
    react: "📚",
    desc: "Open bot menu",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, pushname, reply }) => {
    try {

        const menuText = `
╭───────────────●●►
│ 🤖 *THENUVA X MD*
├───────────────●●►
│ 👋 Hello : *${pushname || 'User'}*
│ 🕒 Runtime : *${runtime(process.uptime())}*
│ ⚡ Mode : *${config.MODE}*
│ ⚙️ Prefix : *${config.PREFIX}*
│ 💾 RAM : *${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB*
╰───────────────●●►

╭───────────────❒
│ 📚 *THENUVA X MD MENU*
╰───────────────❒

👇 *Select an option below.*

> 💥 *POWERED BY THENUVA X MD* 💥
`;

        await conn.sendMessage(
            from,
            {
                image: {
                    url: 'https://i.ibb.co/N68698yW/5df1e9c651fd.jpg'
                },
                caption: menuText,
                contextInfo: {
                    mentionedJid: m.sender ? [m.sender] : [],
                    forwardingScore: 999,
                    isForwarded: true
                }
            },
            {
                quoted: mek
            }
        );

        await sendButtons(
            conn,
            from,
            {
                text: '🎛️ *THENUVA X MD OPTIONS*',
                prefix: config.PREFIX,

                buttons: [
                    {
                        id: 'thenuva:alive',
                        text: '🟢 Alive'
                    },
                    {
                        id: 'thenuva:about',
                        text: 'ℹ️ About'
                    },
                    {
                        id: 'thenuva:calendar',
                        text: '📅 Calendar'
                    }
                ]
            },
            mek
        );

    } catch (e) {
        console.error('[MENU ERROR]', e);

        return reply(
            `❌ *MENU ERROR*\n\n${e.message || e}`
        );
    }
});
