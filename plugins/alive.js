const config = require('../config')
const { cmd, commands } = require('../command')
const os = require("os")
const { runtime } = require('../lib/functions')

cmd({
    pattern: "alive",
    react: "🟢",
    desc: "Check bot online status",
    category: "main",
    filename: __filename
},
async(conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
try {

let aliveMessage = `🟢 *ALIVE NOW* 🟢

👋 HELLOW...*${pushname || 'User'}* ❤️ I am ALIVE NOW CYBER X THENULA

✅ *CYBER THENULA X MD IS ONLINE* ✅

╭┈───────────────•* 
│  ◦ 🕒 *Runtime* :  ${runtime(process.uptime())}
│  ◦ ⚡ *Mode* :  *[${config.MODE}]*
│  ◦ ⚙️ *Prefix* : *[${config.PREFIX}]*
│  ◦ 🤖 *Name Bot* : *THENUWA XMD*
│  ◦ 👤 *Creator* : *Thenula/Dilshan*
│  ◦ 📌 *Version* : *ᴠ.2.0.0*
╰┈───────────────•*

> © ⚡*POWERED by CYBER THENUWA*`;

// Image එක සහ Newsletter Forwarding එක සමඟ සෙන්ඩ් කිරීම
await conn.sendMessage(
    from,
    {
        image: { url: `https://i.ibb.co/qPDNmSY/5cdec1f68264.jpg` },
        caption: aliveMessage,
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
    { quoted: mek }
);

} catch (e) {
    console.log(e);
    reply(`${e}`);
}
});
