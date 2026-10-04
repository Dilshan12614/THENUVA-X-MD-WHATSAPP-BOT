const config = require('../config');
const { cmd } = require('../command');
const { runtime } = require('../lib/functions');

cmd({
    pattern: "menuall",
    alias: ["allmenu", "all"],
    react: "📚",
    desc: "Show all available commands",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, pushname, reply }) => {
    try {

        const menu = `
╭──────────────────────●●►
│ 🤖 *THENUVA X MD*
├──────────────────────●●►
│ 👋 Hello : *${pushname || 'User'}*
│ 🕒 Runtime : *${runtime(process.uptime())}*
│ ⚡ Mode : *${config.MODE}*
│ ⚙️ Prefix : *${config.PREFIX}*
│ 💾 RAM : *${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB*
╰──────────────────────●●►

╭────────〔 📚 ALL OPTIONS 〕
│
├─〔 🟢 MAIN 〕
│
│ 🟢 ${config.PREFIX}alive
│ ℹ️ ${config.PREFIX}about
│ 📅 ${config.PREFIX}calendar
│ 🆔 ${config.PREFIX}jid
│ 🧮 ${config.PREFIX}calc
│
├─〔 📥 DOWNLOAD 〕
│
│ 📦 ${config.PREFIX}apk
│ 📘 ${config.PREFIX}fb
│ 🎬 ${config.PREFIX}video
│ 🎵 ${config.PREFIX}playvideo
│
├─〔 ♟️ GAMES 〕
│
│ ♟️ ${config.PREFIX}chess
│ ↩️ ${config.PREFIX}chess undo
│ 🔄 ${config.PREFIX}chess flip
│ 🆕 ${config.PREFIX}chess new
│ ❓ ${config.PREFIX}chess help
│
├─〔 🛠️ TOOLS 〕
│
│ 🎨 ${config.PREFIX}sticker
│ 🔊 ${config.PREFIX}tts
│ 🌐 ${config.PREFIX}translate
│
├─〔 👥 GROUP 〕
│
│ 👥 ${config.PREFIX}groupinfo
│ 🏷️ ${config.PREFIX}tagall
│ 👮 ${config.PREFIX}admins
│
├─〔 🔍 SEARCH 〕
│
│ 🔎 ${config.PREFIX}search
│ ▶️ ${config.PREFIX}ytsearch
│ 🌐 ${config.PREFIX}google
│
├─〔 👑 OWNER 〕
│
│ ⚙️ ${config.PREFIX}setting
│ 🔄 ${config.PREFIX}restart
│
├─〔 🗑️ ANTIDELETE 〕
│
│ ✅ ${config.PREFIX}antidelete on
│ ❌ ${config.PREFIX}antidelete off
│ 📊 ${config.PREFIX}antidelete status
│
╰──────────────────────●●►

╭────────〔 ⚡ STATUS 〕
│ 🤖 *THENUVA X MD*
│ 🚀 Bot is running successfully
│ 💥 Powered by THENUVA X MD
╰──────────────────────●●►
`;

        await conn.sendMessage(
            from,
            {
                image: {
                    url: 'https://i.ibb.co/N68698yW/5df1e9c651fd.jpg'
                },
                caption: menu,
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

    } catch (e) {

        console.error('[MENUALL ERROR]', e);

        return reply(
            `❌ *MENU ERROR*\n\n${e.message || e}`
        );
    }
});
