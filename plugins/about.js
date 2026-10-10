const { sendPluginButtons } = require('../lib/buttons');
const config = require('../config');
const { cmd } = require('../command');

cmd(
    {
        pattern: 'about',
        alias: ['developer', 'ownerinfo'],
        react: '👑',
        desc: 'Get bot developer information',
        category: 'main',
        filename: __filename
    },

    async (conn, mek, m, {
        from,
        pushname,
        pushName,
        reply
    }) => {
        try {
            // USER NAME
            const userName =
                pushName ||
                pushname ||
                m?.pushName ||
                m?.pushname ||
                'User';

            // BOT CONFIG
            const botName = 'THENUVA X MD';
            const prefix = config.PREFIX || '.';

            // ABOUT PANEL
            const aboutText = `
╭──〔 *ᴀʙᴏᴜᴛ ᴘᴀɴᴇʟ* 〕──●●►
│
│ 👋 *ʜᴇʟʟᴏ* : ${userName} ❤️
│ 🤖 *ʙᴏᴛ* : ${botName}
│
├──〔 *ᴅᴇᴠᴇʟᴏᴘᴇʀ ɪɴғᴏ* 〕
│
│ 👨‍💻 *ᴅᴇᴠᴇʟᴏᴘᴇʀ* : Dilshan Ashinsa
│ ⚙️ *ᴛʏᴘᴇ* : WhatsApp Bot
│ 🌐 *sᴛᴀᴛᴜs* : Online Project
│ 🧩 *ᴘʀᴇғɪx* : ${prefix}
│
├──〔 *ᴛʜᴀɴᴋ ʏᴏᴜ* 〕
│
│ 💖 Thanks for using
│ *${botName}*
│
╰────────────●●►

🔘 Select an option.
            `.trim();

            await conn.sendMessage(
                from,
                {
                    image: {
                        url: 'https://i.ibb.co/7JWk0d08/11625411f042.jpg'
                    },
                    caption: aboutText,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid:
                                config.NEWSLETTER_JID ||
                                '120363403804248705@newsletter',
                            newsletterName: botName,
                            serverMessageId: 143
                        }
                    }
                },
                { quoted: mek }
            );

            // INTERACTIVE BUTTONS
            await sendPluginButtons(conn, from, 'about', mek);

        } catch (error) {
            console.error('[ABOUT ERROR]', error);

            if (typeof reply === 'function') {
                reply(`❌ About Error: ${error.message || 'Unknown error'}`);
            } else {
                await conn.sendMessage(
                    from,
                    {
                        text: `❌ About Error: ${error.message || 'Unknown error'}`
                    },
                    { quoted: mek }
                );
            }
        }
    }
);
