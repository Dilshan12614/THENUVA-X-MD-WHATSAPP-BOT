const config = require('../config');
const { cmd } = require('../command');
const { sendListMenu } = require('../lib/buttons');
const { runtime } = require('../lib/functions');

/* =========================================================
 * THENUVA X MD ALIVE CONFIG
 * ========================================================= */

const BOT_NAME = 'THENUVA X MD';
const CREATOR = 'Thenula/Dilshan';
const VERSION = 'v2.0.0';

const NEWSLETTER_NAME = 'THENUVA XMD';
const NEWSLETTER_JID = '120363403804248705@newsletter';

const CONTACT_URL = 'https://wa.me/94742876482';

const CHANNEL_URL =
    'https://whatsapp.com/channel/120363403804248705';

const ALIVE_IMAGE =
    'https://i.ibb.co/qPDNmSY/5cdec1f68264.jpg';

/* =========================================================
 * ALIVE COMMAND
 * ========================================================= */

cmd({
    pattern: 'alive',
    alias: ['online', 'status'],
    react: '🟢',
    desc: 'Check bot online status',
    category: 'main',
    filename: __filename
}, async (
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

        /* =================================================
         * ALIVE MESSAGE — ORIGINAL STYLE
         * ================================================= */

        const aliveMessage = `
🟢 *ALIVE NOW* 🟢

👋 HELLOW... *${pushname || 'User'}* ❤️ I am ALIVE NOW CYBER X THENULA

✅ *CYBER THENULA X MD IS ONLINE* ✅

╭┈───────────────•
│
│  ◦ 🕒 *Runtime* : ${runtime(process.uptime())}
│  ◦ ⚡ *Mode* : *[${config.MODE || 'public'}]*
│  ◦ ⚙️ *Prefix* : *[${config.PREFIX || '.'}]*
│  ◦ 🤖 *Name Bot* : *THENUVA XMD*
│  ◦ 👤 *Creator* : *Thenula/Dilshan*
│  ◦ 📌 *Version* : *ᴠ.2.0.0*
│
╰┈───────────────•

> © ⚡ *POWERED by CYBER THENUWA*
        `.trim();

        /* =================================================
         * SEND ALIVE IMAGE + FULL MESSAGE
         * ================================================= */

        await conn.sendMessage(
            from,
            {
                image: {
                    url: ALIVE_IMAGE
                },
                caption: aliveMessage,
                contextInfo: {
                    mentionedJid: m.sender ? [m.sender] : [],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: NEWSLETTER_JID,
                        newsletterName: NEWSLETTER_NAME,
                        serverMessageId: 143
                    }
                }
            },
            {
                quoted: mek
            }
        );

        /* =================================================
         * CONTACT ME + VIEW CHANNEL ONLY
         * ================================================= */

        await conn.sendMessage(
            from,
            {
                text: `🌐 *${BOT_NAME}*\n\nChoose Contact Me or View Channel below.`,
                footer: `⚡ POWERED BY ${CREATOR}`,
                templateButtons: [
                    {
                        index: 1,
                        urlButton: {
                            displayText: '👤 Contact Me',
                            url: CONTACT_URL
                        }
                    },
                    {
                        index: 2,
                        urlButton: {
                            displayText: '📢 View Channel',
                            url: CHANNEL_URL
                        }
                    }
                ]
            },
            {
                quoted: mek
            }
        );

    } catch (error) {

        console.error('[ALIVE ERROR]', error);

        try {
            await reply(
                `❌ *ALIVE ERROR*\n\n${error?.message || error}`
            );
        } catch (replyError) {
            console.error('[ALIVE REPLY ERROR]', replyError);
        }
    }
});
