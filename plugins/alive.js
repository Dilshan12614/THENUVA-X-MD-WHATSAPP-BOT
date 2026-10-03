const { sendPluginButtons } = require('../lib/buttons');
const config = require('../config');
const { cmd } = require('../command');
const { runtime } = require('../lib/functions');

cmd(
  {
    pattern: 'alive',
    react: '🟢',
    desc: 'Check bot online status',
    category: 'main',
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

      // ─────────────────────────────
      // ALIVE MESSAGE
      // ─────────────────────────────

      const aliveMessage = `🟢 *ALIVE NOW* 🟢

👋 HELLOW... *${pushname || 'User'}* ❤️

⚡ *I AM ALIVE NOW — CYBER X THENULA*

╭┈───────────────•
│ ◦ 🟢 *Status*  : *ONLINE*
│ ◦ 🕒 *Runtime* : *${runtime(process.uptime())}*
│ ◦ ⚡ *Mode*    : *[${config.MODE}]*
│ ◦ ⚙️ *Prefix*  : *[${config.PREFIX}]*
│ ◦ 🤖 *Bot*     : *CYBER THENUVA X MD*
│ ◦ 👤 *Creator* : *THENULA THISAN*
│ ◦ 📌 *Version* : *ᴠ.2.0.0*
╰┈───────────────•

╭┈───────────────•
│ 🚀 *SYSTEM STATUS*
│
│ 🟢 WhatsApp : *CONNECTED*
│ 🟢 Bot      : *ONLINE*
│ ⚡ Engine   : *BAILEYS*
│
╰┈───────────────•

> ⚡ *POWERED BY CYBER THENUVA*`;

      // ─────────────────────────────
      // SEND IMAGE + ALIVE MESSAGE
      // ─────────────────────────────

      await conn.sendMessage(
        from,
        {
          image: {
            url: 'https://i.ibb.co/qPDNmSY/5cdec1f68264.jpg'
          },

          caption: aliveMessage,

          contextInfo: {
            mentionedJid: m?.sender ? [m.sender] : [],

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

      // ─────────────────────────────
      // ALIVE BUTTONS
      // Uses your existing button-helper
      // ─────────────────────────────

      await sendPluginButtons(
        conn,
        from,
        'alive',
        mek
      );

    } catch (e) {
      console.error('ALIVE ERROR:', e);

      try {
        await reply(
          `❌ *ALIVE ERROR*\n\n${e?.message || e}`
        );
      } catch (_) {}
    }
  }
);
