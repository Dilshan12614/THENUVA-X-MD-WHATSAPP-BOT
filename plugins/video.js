const { sendPluginButtons } = require('../lib/buttons');
const { cmd } = require('../command'); // Path එක නිවැරදි බව සහතික කරගන්න
const fetch = require('node-fetch');

cmd({
    pattern: "video",
    alias: ["ytv", "mp4"],
    react: "🎬",
    desc: "Download and send playable YouTube videos",
    category: "download",
    use: '.video <youtube-url>',
    filename: __filename
},
async (conn, mek, m, { from, reply, q, sender }) => {
    // පරිශීලකයා YouTube ලින්ක් එක ලබා දී නොමැති නම්
    if (!q || !q.trim()) {
        await sendPluginButtons(conn, from, 'video', mek);
        return await reply("⚠️ Please provide a valid YouTube link to download!");
    }
    
    try {
        // වීඩියෝව බාගත වෙමින් පවතින බව දැක්වීමට පණිවිඩයක්
        await reply("⏳ *Downloading your video... Please wait!*");

        // ඔයා එවපු David Cyril ගේ නිවැරදි API Endpoint එක භාවිතය
        const apiUrl = `https://davidcyriltech.my.id{encodeURIComponent(q.trim())}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            return await reply("❌ API server error! Please try again later.");
        }

        const data = await response.json();
        
        // Response එකේ status එක සහ result එක නිවැරදිදැයි බැලීම
        if (!data || !data.status || !data.result || !data.result.url) {
            return await reply("❌ Failed to fetch video! Make sure the link is a valid YouTube URL.");
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
        
        // වීඩියෝව කෙලින්ම Playable විදිහට WhatsApp හරහා යැවීම
        await conn.sendMessage(from, { 
            video: { url: videoData.url }, // API එකෙන් එන සෘජු වීඩියෝ ලින්ක් එක
            mimetype: 'video/mp4',        // WhatsApp එක ඇතුළේ Play වෙන්න මේක අනිවාර්යයි
            fileName: `${videoData.title || 'video'}.mp4`,
            caption: `*🎬 THENUVA XMD VIDEO DOWNLOADER* \n\n*📌 Title:* ${videoData.title || 'YouTube Video'}\n\n*Powered by THENUVA XMD*`,
            contextInfo: newsletterContext 
        }, { quoted: mek });
        
        // අවසානයට මෙනු බටන්ස් යැවීම
        await sendPluginButtons(conn, from, 'video', mek);

    } catch (error) {
        console.error("Playable Video Downloader Error:", error);
        reply('❌ An error occurred while processing your video download request.');
    }
});
