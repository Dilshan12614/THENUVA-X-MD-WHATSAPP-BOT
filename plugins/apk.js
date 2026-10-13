const axios = require('axios');

module.exports = {
    name: 'apk',
    category: 'download',
    desc: 'Search and download APK files',
    async execute(conn, mek, m, { args, q, reply }) {
        try {
            // ඇප් එකේ නම ඇතුළත් කර ඇත්දැයි බැලීම
            // බොට් එකේ args හෝ q පාවිච්චි වන ආකාරය අනුව
            const text = q || (args && args.join(' '));
            if (!text) {
                return await reply("❌ කරුණාකර ඇප් එකේ නම ඇතුළත් කරන්න! (උදා: .apk facebook)");
            }

            await reply("⏳ කරුණාකර රැඳී සිටින්න, APK එක සොයමින් පවතියි...");

            const apiKey = "Sasa_Dev_Api_79346efacb553ec6ee94f2f6453dec8658ec5e7b";
            const apiUrl = `https://sasa-dev-api.xyz{apiKey}&q=${encodeURIComponent(text)}`;

            // API Request එක
            const response = await axios.get(apiUrl);
            const resData = response.data;

            // සර්වර් එකෙන් ආපු මුළු දත්ත ප්‍රමාණයම console එකේ බලාගන්න (Heroku/Railway logs වල වැටෙයි)
            console.log("API Response:", JSON.stringify(resData, null, 2));

            // API එකේ 'status' හෝ 'result' එක පරීක්ෂා කිරීම
            if (!resData || resData.status !== true || !resData.result) {
                return await reply("❌ ඔබ සෙවූ ඇප් එක සොයා ගැනීමට නොහැකි විය හෝ API දෝෂයකි.");
            }

            const appInfo = resData.result;
            // API එකෙන් ඩවුන්ලෝඩ් ලින්ක් එක එන්නේ වෙනත් කී එකකින් නම් (උදා: download, link, url)
            const downloadUrl = appInfo.download || appInfo.download_link || appInfo.url || appInfo.link;

            if (!downloadUrl) {
                return await reply("❌ මෙම ඇප් එක සඳහා ඩවුන්ලෝඩ් ලින්ක් එකක් සොයා ගැනීමට නොහැකි විය.");
            }

            // විස්තර මැසේජ් එක
            let descMsg = `*📦 APK DOWNLOADER*\n\n`;
            descMsg += `*📱 නම:* ${appInfo.name || text}\n`;
            descMsg += `*⚖️ ප්‍රමාණය:* ${appInfo.size || 'නොදනී'}\n\n`;
            descMsg += `⏳ ගොනුව WhatsApp වෙත අප්ලෝඩ් වෙමින් පවතී...`;
            
            await reply(descMsg);

            // බොට් එකේ පාවිච්චි වෙන connection variable එක අනුව (conn හෝ jid)
            const targetJid = m.chat || m.from;

            // Document එකක් විදියට APK එක යැවීම
            await conn.sendMessage(targetJid, {
                document: { url: downloadUrl },
                mimetype: 'application/vnd.android.package-archive',
                fileName: `${appInfo.name || 'Application'}.apk`
            }, { quoted: mek || m });

        } catch (error) {
            console.error("APK Plugin Error:", error);
            await reply(`❌ දෝෂයක් සිදු විය: ${error.message}`);
        }
    }
};
