const axios = require('axios');

module.exports = {
    name: 'apk',
    category: 'download',
    desc: 'Search and download APK files.',
    async execute(Client, message, args) {
        // ඇප් එකේ නම ඇතුළත් කර ඇත්දැයි බැලීම
        if (!args[0]) {
            return await message.reply("❌ කරුණාකර ඇප් එකේ නම ඇතුළත් කරන්න! (උදා: .apk facebook)");
        }

        const appName = args.join(' ');
        const apiKey = "Sasa_Dev_Api_79346efacb553ec6ee94f2f6453dec8658ec5e7b"; // රූපයේ ඇති පරිදි Api Key එක
        const apiUrl = `https://sasa-dev-api.xyz{apiKey}&q=${encodeURIComponent(appName)}`;

        try {
            await message.reply("⏳ කරුණාකර රැඳී සිටින්න, ඔබ සෙවූ APK එක සොයමින් පවතියි...");

            // API එකට Request එකක් යැවීම
            const response = await axios.get(apiUrl);
            const resData = response.data;

            // API එකෙන් සාර්ථකව දත්ත ලැබී ඇත්දැයි බැලීම
            if (!resData || !resData.result || resData.result.length === 0) {
                return await message.reply("❌ ඔබ සෙවූ ඇප් එක සොයා ගැනීමට නොහැකි විය.");
            }

            // පළමු සෙවුම් ප්‍රතිඵලය ලබා ගැනීම (පළමු ඇප් එක)
            const appInfo = resData.result[0];
            const downloadUrl = appInfo.download_link || appInfo.url; // API ප්‍රතිඵලයේ ඇති ඩවුන්ලෝඩ් ලින්ක් එක
            const filename = `${appInfo.name || 'app'}.apk`;

            if (!downloadUrl) {
                return await message.reply("❌ මෙම ඇප් එක සඳහා ඩවුන්ලෝඩ් ලින්ක් එකක් සොයා ගැනීමට නොහැකි විය.");
            }

            // ඇප් එකේ විස්තර මැසේජ් එකක් ලෙස යැවීම
            let infoMessage = `*📦 APK DOWNLOADER* \n\n`;
            infoMessage += `*📱 නම:* ${appInfo.name}\n`;
            infoMessage += `*🆔 Package:* ${appInfo.package_id || 'නොදනී'}\n`;
            infoMessage += `*⚖️ ප්‍රමාණය:* ${appInfo.size || 'නොදනී'}\n\n`;
            infoMessage += `⏳ APK ගොනුව බාගත වෙමින් පවතී, සුළු මොහොතකින් එය ඔබට ලැබෙනු ඇත...`;

            await message.reply(infoMessage);

            // APK ගොනුව සෘජුවම WhatsApp හරහා Document එකක් ලෙස යැවීම
            await Client.sendMessage(message.from, {
                document: { url: downloadUrl },
                mimetype: 'application/vnd.android.package-archive',
                fileName: filename
            }, { quoted: message });

        } catch (error) {
            console.error("APK Error:", error);
            await message.reply("❌ API එක සම්බන්ධ කර ගැනීමේදී දෝෂයක් සිදු විය. පසුව නැවත උත්සාහ කරන්න.");
        }
    }
};
