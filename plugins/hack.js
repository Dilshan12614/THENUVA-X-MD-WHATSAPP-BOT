const { smd, prefix, Config, sleep } = require('../lib/functions');  // Import sleep from functions.js
const { cmd, commands } = require('../command');
const config = require('../config');

cmd({
    pattern: "hack",
    desc: "Check bot online or no.",
    category: "main",
    filename: __filename
},

async (conn, mek, m, { from, reply, pushname }) => {
    try {
        if (!mek) return reply("Error: Message object is missing.");

        // පොදු contextInfo සැකසුම (Newsletter විස්තර)
        const botContext = {
            mentionedJid: [mek.sender || from],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363403804248705@newsletter', // ඔයාගේ Newsletter JID එක
                newsletterName: 'CYBER XMD', // ඔයාගේ Newsletter Name එක
                serverMessageId: 143
            }
        };

        await conn.sendMessage(from, { 
            image: { url: 'https://i.ibb.co/nN7pHgH4/3f6f01847f5e.jpg' }, 
            caption: `👋 HELLOW...*${pushname || 'User'}* ❤️ Welcome to CYBER X THENULA`,
            contextInfo: botContext
        }, { quoted: mek });
        
        await sleep(2000);  // Sleep for 2 seconds
        
        await conn.sendMessage(from, { text: " █ 10%" }, { quoted: mek });
        await sleep(1000);  // Sleep for 1 second
        
        await conn.sendMessage(from, { text: " █ █ 20%" }, { quoted: mek });
        await sleep(1000);  // Sleep for 1 second
        
        await conn.sendMessage(from, { text: " █ █ █ 30%" }, { quoted: mek });
        await sleep(1000);  // Sleep for 1 second
        
        await conn.sendMessage(from, { text: " █ █ █ █ 40%" }, { quoted: mek });
        await sleep(1000);  // Sleep for 1 second
        
        await conn.sendMessage(from, { text: " █ █ █ █ █ 50%" }, { quoted: mek });
        await sleep(1000);  // Sleep for 1 second
        
        await conn.sendMessage(from, { text: " █ █ █ █ █ █ 60%" }, { quoted: mek });
        await sleep(1000);  // Sleep for 1 second
        
        await conn.sendMessage(from, { text: " █ █ █ █ █ █ █ 70%" }, { quoted: mek });
        await sleep(1000);  // Sleep for 1 second
        
        await conn.sendMessage(from, { text: " █ █ █ █ █ █ █ █ 80%" }, { quoted: mek });
        await sleep(1000);  // Sleep for 1 second
        
        await conn.sendMessage(from, { text: " █ █ █ █ █ █ █ █ █ 90%" }, { quoted: mek });
        await sleep(1000);  // Sleep for 1 second
        
        await conn.sendMessage(from, { text: " █ █ █ █ █ █ █ █ █ █ 100%" }, { quoted: mek });
        await sleep(1000);  // Sleep for 1 second
        
        await conn.sendMessage(from, { text: "⚙️ *System Hijacking in Progress...* \n🌐 *Connecting to Proxy Server...*" }, { quoted: mek });
        await sleep(1000);  // Sleep for 1 second
        
        await conn.sendMessage(from, { text: "📱 *Device Successfully Connected!* \n📥 *Receiving All Data Packets...*" }, { quoted: mek });
        await sleep(1000);  // Sleep for 1 second
        
        await conn.sendMessage(from, { text: "💎 *Data Hijacked from Device 100% Completed!* \n🧼 *Killing all Evidence... Purging Malwares...*" }, { quoted: mek });
        await sleep(1000);  // Sleep for 1 second
        
        await conn.sendMessage(from, { text: "🚨 *SYSTEM HACKING COMPLETED SUCCESSFULLY* 💀" }, { quoted: mek });
        await sleep(2000);  // Sleep for 2 seconds
        
        await conn.sendMessage(from, { text: "📂 *SENDING ENCRYPTED LOG DOCUMENTS NOW...* 📤" }, { quoted: mek });
        await sleep(1000);  // Sleep for 1 second
        
        await conn.sendMessage(from, { text: "✨ *Successfully Sent Data and Connection Has Been Established!*" }, { quoted: mek });
        await sleep(1000);  // Sleep for 1 second
        
        return await conn.sendMessage(from, { 
            image: { url: 'https://i.ibb.co/nN7pHgH4/3f6f01847f5e.jpg' }, 
            caption: '🎭 𝘓𝘖𝘎𝘚 = 𝘡𝘌𝘙𝙾 • 𝘞𝘌 𝘞𝘌𝘙𝘌 𝘕𝘌𝘝𝘌𝘙 𝘏𝘌𝘙𝘌... 🤫💨',
            contextInfo: botContext
        }, { quoted: mek });

    } catch (e) {
        console.error("Error sending message:", e);
        reply(`*HEY DEAR* ${pushname}\n*i got all your data *`);
    }
});
