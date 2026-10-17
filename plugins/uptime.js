const { cmd } = require('../command');
const { runtime } = require('../lib/functions');
const config = require('../config');
const { sendListMenu } = require('../lib/buttons');

cmd({
    pattern: "uptime",
    alias: ["runtime", "up"],
    desc: "Check bot uptime",
    category: "main",
    react: "⏱️",
    filename: __filename
},
async (conn, mek, m, { from, reply, pushname }) => {
    try {
        const uptime = runtime(process.uptime());

        const startTime = new Date(
            Date.now() - process.uptime() * 1000
        );

        const botName = config.BOT_NAME || "THENUVA X MD";
        const ownerName = config.OWNER_NAME || "Dilshan Ashinsa";

        const caption = `
╭━━〔 *ᴜᴘᴛɪᴍᴇ ᴘᴀɴᴇʟ* 〕━━╮
┃
┃ 👋 ʜᴇʟʟᴏ, ${pushname || 'User'}
┃
┃ ⏱️ *ʀᴜɴᴛɪᴍᴇ*
┃ └─ ${uptime}
┃
┃ 🕒 *sᴛᴀʀᴛᴇᴅ ᴀᴛ*
┃ └─ ${startTime.toLocaleString()}
┃
┃ 🤖 *ʙᴏᴛ*
┃ └─ ${botName}
┃
┃ 🟢 *sᴛᴀᴛᴜs: ᴏɴʟɪɴᴇ*
┃
╰━━━━━━━━━━━━━━━━━━╯

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${ownerName}`;

        await sendListMenu(conn, from, {
            title: "⏱️ THENUVA X MD",
            text: caption,
            footer: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ " + ownerName,
            buttonText: "ᴏᴘᴇɴ ᴜᴘᴛɪᴍᴇ ᴍᴇɴᴜ",
            sections: [
                {
                    title: "UPTIME OPTIONS",
                    rows: [
                        {
                            title: "🔄 Refresh Uptime",
                            rowId: ".uptime",
                            description: "Check the latest bot uptime"
                        },
                        {
                            title: "🏓 Ping Bot",
                            rowId: ".ping",
                            description: "Check bot response speed"
                        },
                        {
                            title: "🏠 Main Menu",
                            rowId: ".menu",
                            description: "Open the main menu"
                        }
                    ]
                }
            ]
        }, mek);

    } catch (e) {
        console.error("[UPTIME ERROR]", e);
        await reply(`❌ Uptime Error: ${e.message}`);
    }
});
