const { sendButtons } = require('../lib/buttons');
const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');

cmd({
    pattern: "menu2",
    react: "👾",
    desc: "Get command list",
    category: "main",
    filename: __filename
},
async (
    conn,
    mek,
    m,
    {
        from,
        pushname,
        reply
    }
) => {

    try {

        const madeMenu =
`👋 HELLO *${pushname || 'User'}* ❤️
Welcome to *THENUVA X MD*

╭───────────────●●►
│ 🤖 *THENUVA X MD*
├───────────────●●►
│ 🕒 Runtime : ${runtime(process.uptime())}
│ ⚡ Mode : *[${config.MODE}]*
│ ⚙️ Prefix : *[${config.PREFIX}]*
│ 💾 RAM : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
│ 👤 Creator : *Thenula/Dilshan*
│ 📌 Version : *ᴠ.2.0.0*
╰───────────────●●►

╭───────────────❒
│ 👾 *THENUVA X MD MENU*
╰───────────────❒

📚 *Tap the button below*

> 💥 *POWERED BY THENUVA X MD* 💥`;

        await conn.sendMessage(
            from,
            {
                image: {
                    url: 'https://i.ibb.co/N68698yW/5df1e9c651fd.jpg'
                },
                caption: madeMenu,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363403804248705@newsletter',
                        newsletterName: 'THENUWA XMD',
                        serverMessageId: 143
                    }
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
                text: '🎛️ *MENU OPTIONS*',

                prefix: config.PREFIX,

                buttons: [
                    {
                        id: 'thenuva:all',
                        text: '📚 All Options'
                    }
                ]
            },
            mek
        );

    } catch (e) {

        console.error('[MENU2 ERROR]', e);

        return reply(
            `❌ *MENU ERROR*\n\n${e.message || e}`
        );
    }

});
