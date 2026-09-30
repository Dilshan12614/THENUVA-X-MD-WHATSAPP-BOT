const { cmd, commands } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');

cmd({
    pattern: "alive",
    alias: ["status", "runtime", "uptime"],
    desc: "Check uptime and system status",
    category: "main",
    react: "🧚‍♂️",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // STEP 1 - START LOADING
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const loading = await conn.sendMessage(from, {
            text: `╭━━〔 *DILA-MD* 〕━━┈⊷
┃
┃  ⏳ *Loading System...*
┃
┃  ▱▱▱▱▱▱▱▱▱▱ 0%
┃
┃  Please wait...
┃
╰━━━━━━━━━━━━━━━━━━━`
        }, { quoted: mek });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // STEP 2 - UPTIME
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        await conn.sendMessage(from, {
            text: `╭━━〔 *DILA-MD* 〕━━┈⊷
┃
┃  ⏳ *Loading Uptime...*
┃
┃  ▰▰▱▱▱▱▱▱▱▱ 20%
┃
┃  • Uptime: Loading...
┃
╰━━━━━━━━━━━━━━━━━━━`,
            edit: loading.key
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        const uptime = runtime(process.uptime());

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // STEP 3 - RAM
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        await conn.sendMessage(from, {
            text: `╭━━〔 *DILA-MD* 〕━━┈⊷
┃
┃  📟 *Loading RAM Usage...*
┃
┃  ▰▰▰▰▱▱▱▱▱▱ 40%
┃
┃  • Uptime: ${uptime}
┃  • RAM: Loading...
┃
╰━━━━━━━━━━━━━━━━━━━`,
            edit: loading.key
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        const ram = `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${(os.totalmem() / 1024 / 1024).toFixed(2)}MB`;

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // STEP 4 - HOSTNAME
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        await conn.sendMessage(from, {
            text: `╭━━〔 *DILA-MD* 〕━━┈⊷
┃
┃  ⚙️ *Loading HostName...*
┃
┃  ▰▰▰▰▰▰▱▱▱▱ 60%
┃
┃  • Uptime: ${uptime}
┃  • RAM: ${ram}
┃  • HostName: Loading...
┃
╰━━━━━━━━━━━━━━━━━━━`,
            edit: loading.key
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        const hostname = os.hostname();

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // STEP 5 - OWNER
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        await conn.sendMessage(from, {
            text: `╭━━〔 *DILA-MD* 〕━━┈⊷
┃
┃  👨‍💻 *Loading Owner...*
┃
┃  ▰▰▰▰▰▰▰▰▱▱ 80%
┃
┃  • Uptime: ${uptime}
┃  • RAM: ${ram}
┃  • HostName: ${hostname}
┃  • Owner: Loading...
┃
╰━━━━━━━━━━━━━━━━━━━`,
            edit: loading.key
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // STEP 6 - FINAL
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const status = `╭━━〔 *DILA-MD* 〕━━┈⊷
┃◈╭────────────
┃◈┃• *⏳ Uptime*: ${uptime}
┃◈┃• *📟 Ram usage*: ${ram}
┃◈┃• *⚙️ HostName*: ${hostname}
┃◈┃• *👨‍💻 Owner*: DILA-MD
┃◈┃• *🧬 Version*: 3.0.0 BETA
┃◈└───────────
╰──────────────

> ✦ POWERED BY DILA MD`;

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // SEND FINAL IMAGE
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        await conn.sendMessage(from, {
            image: { url: `https://i.ibb.co/gXHVbhm/temp-image.jpg` },
            caption: status,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363429118791328@newsletter',
                    newsletterName: 'DILA MD',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        // Delete loading message
        try {
            await conn.sendMessage(from, {
                delete: loading.key
            });
        } catch (err) {
            console.log("Loading message delete failed");
        }

    } catch (e) {
        console.error("Error in alive command:", e);
        reply(`❌ An error occurred: ${e.message}`);
    }
});
