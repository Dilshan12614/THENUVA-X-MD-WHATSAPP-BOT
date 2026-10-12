const { sendPluginButtons } = require('../lib/buttons');
const { cmd } = require('../command'); // Path එක නිවැරදි බව සහතික කරගන්න
const fetch = require('node-fetch');

cmd({
    pattern: "video",
    alias: ["ytv", "mp4"],
    react: "🎬",
    desc: "Download and send videos from a URL",
    category: "download",
    use: '.video <video-url>',
    filename: __filename
},
async (conn, mek, m, { from, reply, q, sender }) => {
    // පරිශීලකයා ලින්ක් එකක් ලබා දී නොමැති නම්
    if (!q || !q.trim()) {
        await sendPluginButtons(conn, from, 'video', mek);
        return await reply("⚠️ Please provide a valid video link to download! (e.g., .video <url>)");
    }
    
    try {
        // වීඩියෝව ඩවුන්ලෝඩ් වෙමින් පවතින බව දැක්වීමට පණිවිඩයක්
        await reply("⏳ *Downloading your video... Please wait!*");

        // David Cyril ටෙක්නොලොජි ඩවුන්ලෝඩ් API එක භාවිතය
        const apiUrl = `https://davidcyriltech.my.id{encodeURIComponent(q.trim())}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            return await reply("❌ API server error! Please try again later.");
        }

        const data = await response.json();
        
        // දත්ත සහ බාගත කිරීමේ ලින්ක් එක නිවැරදිව ලැබී ඇත්දැයි බැලීම
        if (!data || !data.status || !data.result || !data.result.downloadLink) {
            return await reply("❌ Failed to fetch video! Make sure the link is valid.");
        }
        
        const videoData = data.result;
        
        // Newsletter context info (Forwarded design)
        const newsletterContext = {
            mentionedJid: [sender],
            forwardingScore: 1000,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363403804248705@newsletter',
                newsletterName: "THENUWA XMD",
                serverMessageId: 143,
            },
        };
        
        // වීඩියෝව WhatsApp හරහා පරිශීලකයාට යැවීම
        await conn.sendMessage(from, { 
            video: { url: videoData.downloadLink },
            caption: `*🎬 THENUVA XMD VIDEO DOWNLOADER* \n\n*📌 Title:* ${videoData.title || 'Video'}\n*📦 Quality:* 360p/720p\n\n*Powered by THENUVA XMD*`,
            contextInfo: newsletterContext 
        }, { quoted: mek });
        
        // අවසානයට මෙනු බටන්ස් යැවීම
        await sendPluginButtons(conn, from, 'video', mek);

    } catch (error) {
        console.error("Video Downloader Error:", error);
        reply('❌ An error occurred while downloading the video. Please try again later.');
    }
});
