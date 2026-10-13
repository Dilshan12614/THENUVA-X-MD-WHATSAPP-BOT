// ඉහළින්ම අවශ්‍ය වෙන මූලික const ප්‍රකාශයන් (Declarations)
const axios = require('axios');
const config = require('../../config'); // config.js එකේ path එක බොට් එක අනුව වෙනස් විය හැක
const { cmd, commands } = require('../command'); // බොට් එකේ command handler එක අනුව
const { getBuffer, getGroupAdmins, getRandom, fetchJson, runtime, sleep } = require('../functions'); // පොදු functions ටික

cmd({
    pattern: "apk",
    alias: ["downloadapk", "playstore"],
    desc: "Search and download APK files from Sasa Dev API.",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupAdmin, reply }) => {
    try {
        // ඇප් එකේ නම ඇතුළත් කර ඇත්දැයි බැලීම
        if (!q) {
            return await reply("❌ කරුණාකර ඇප් එකේ නම ඇතුළත් කරන්න! \n\n*උදාහරණ:* .apk facebook");
        }

        // සෙවීමට පටන් ගත් බව පරිශීලකයාට දැනුම් දීම
        await reply("⏳ කරුණාකර රැඳී සිටින්න, APK එක සොයමින් පවතියි...");

        // Sasa Dev API URL එක සහ Credentials
        const apiKey = "Sasa_Dev_Api_79346efacb553ec6ee94f2f6453dec8658ec5e7b";
        const apiUrl = `https://sasa-dev-api.xyz{apiKey}&q=${encodeURIComponent(q)}`;

        // API එකට Request එකක් යැවීම
        const response = await axios.get(apiUrl);
        const resData = response.data;

        // API එක සාර්ථක නැත්නම් හෝ ප්‍රතිඵල නැත්නම්
        if (!resData || resData.status !== true || !resData.result) {
            return await reply("❌ ඔබ සෙවූ ඇප් එක සොයා ගැනීමට නොහැකි විය. කරුණාකර නම නිවැරදිව ඇතුළත් කරන්න.");
        }

        const appInfo = resData.result;
        
        // API ප්‍රතිඵලයෙන් ඩවුන්ලෝඩ් ලින්ක් එක ලබා ගැනීම
        const downloadUrl = appInfo.download || appInfo.download_link || appInfo.url || appInfo.link;

        if (!downloadUrl) {
            return await reply("❌ මෙම ඇප් එක සඳහා බාගත කිරීමේ ලින්ක් එකක් (Download Link) සොයා ගැනීමට නොහැකි විය.");
        }

        // ඇප් එකේ විස්තර මැසේජ් එකක් ලෙස සකස් කිරීම
        let apkDetails = `*📦 APK DOWNLOADER* 🤖\n\n`;
        apkDetails += `*📱 නම:* ${appInfo.name || q}\n`;
        apkDetails += `*🆔 පැකේජ්:* ${appInfo.package_id || 'නොදනී'}\n`;
        apkDetails += `*⚖️ ප්‍රමාණය:* ${appInfo.size || 'නොදනී'}\n\n`;
        apkDetails += `⏳ APK ගොනුව WhatsApp වෙත අප්ලෝඩ් වෙමින් පවතී. සුළු මොහොතකින් එය ඔබට ලැබෙනු ඇත...`;

        await reply(apkDetails);

        // APK ගොනුව සෘජුවම Document එකක් ලෙස පරිශීලකයා වෙත යැවීම
        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            mimetype: 'application/vnd.android.package-archive',
            fileName: `${appInfo.name || 'Application'}.apk`
        }, { quoted: mek });

    } catch (error) {
        console.error("APK Command Error:", error);
        await reply(`❌ දෝෂයක් සිදු විය: ${error.message || error}`);
    }
});
