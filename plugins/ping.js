const { cmd } = require('../command');

cmd({
    pattern: "ping",
    alias: ["speed", "ms"],
    desc: "බොට්ගේ වේගය (Speed) පරීක්ෂා කිරීම.",
    category: "main",
    filename: __filename
},
async (conn, mek, from, options) => {
    try {
        // 'from' අගය String එකක් බවට ස්ථිර කර ගැනීම (Error එක මඟහරවා ගැනීමට)
        const targetJid = typeof from === 'string' ? from : (mek.key.remoteJid || String(from));

        const startTime = Date.now();
        
        // මුලින්ම පණිවිඩය යැවීම
        const pingMsg = await conn.sendMessage(targetJid, { text: '*Testing Speed... ⏳*' }, { quoted: mek });
        
        const endTime = Date.now();
        const pingTime = endTime - startTime;

        // පණිවිඩය Edit කිරීම
        await conn.sendMessage(targetJid, { 
            text: `*DENETH-MD SPEED* 🚀\n\n⚡ *Ping:* \`${pingTime} ms\`\n📶 *Status:* \`Excellent\``,
            edit: pingMsg.key 
        });

    } catch (e) {
        console.log("Ping Command Error: ", e);
    }
});
