const { cmd } = require('../command');
const axios = require('axios');

const FOOTER = 'ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇ Dz Dilshan Ashinsa';

// ෆයිල් නමේ අඩංගු විය නොහැකි විශේෂ ලකුණු ඉවත් කිරීමට
function safeFileName(name) {
    return String(name || 'THENUVA-APK')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100) || 'THENUVA-APK';
}

cmd({
    pattern: 'apk',
    alias: ['downloadapk', 'playstore', 'app'],
    react: '📦',
    desc: 'Search and download APK files from Sasa Dev API',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const query = String(q || '').trim();

        if (!query) {
            return reply(
                '📦 *THENUVA X MD APK DOWNLOADER*\n\n' +
                'භාවිතය: `.apk app name`\n' +
                'උදාහරණය: `.apk WhatsApp`\n\n' +
                `*${FOOTER}*`
            );
        }

        await reply('🔎 *Application එක සොයමින් පවතියි...*');

        // Sasa Dev API එකේ නිවැරදිම URL එක (Concatenation එක නිවැරදි කර ඇත)
        const apiKey = "Sasa_Dev_Api_79346efacb553ec6ee94f2f6453dec8658ec5e7b";
        const apiUrl = `https://sasa-dev-api.xyz{apiKey}&q=${encodeURIComponent(query)}`;

        // API එකට request එක යැවීම
        const response = await axios.get(apiUrl, { timeout: 60000 });
        const resData = response.data;

        // API ප්‍රතිචාරය නිවැරදිදැයි බැලීම
        if (!resData || resData.status !== true || !resData.result) {
            return await reply('❌ *ඔබ සෙවූ ඇප් එක සොයාගන්න බැරි වුණා.*\n\nනම පරීක්ෂා කර නැවත උත්සාහ කරන්න.');
        }

        const appInfo = resData.result;
        
        // ඩවුන්ලෝඩ් ලින්ක් එක ලබාගැනීම
        const downloadUrl = appInfo.download || appInfo.download_link || appInfo.url || appInfo.link;

        if (!downloadUrl) {
            return await reply('❌ *ඇප් එක සොයාගත්තද එහි බාගත කිරීමේ ලින්ක් එකක් (Download Link) හමු වුණේ නැහැ.*');
        }

        // ඇප් එකේ විස්තර පෙන්වන පණිවිඩය සකස් කිරීම
        const caption =
            `╭─〔 *📦 APK DOWNLOADER* 〕\n` +
            `│\n` +
            `│ 📱 *Name:* ${appInfo.name || query}\n` +
            `│ 🆔 *Package:* ${appInfo.package_id || 'Unknown'}\n` +
            `│ ⚖️ *Size:* ${appInfo.size || 'Unknown'}\n` +
            `│\n` +
            `╰────────────────\n\n` +
            `⏳ *APK ගොනුව බාගත වෙමින් පවතී. සුළු මොහොතකින් එය ඔබට ලැබෙනු ඇත...*`;

        await reply(caption);

        // APK ලින්ක් එකෙන් ගොනුව බෆර් එකක් ලෙස ඩවුන්ලෝඩ් කරගැනීම (Timeout 120s)
        const fileResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 120000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const buffer = Buffer.from(fileResponse.data);

        if (!buffer.length) {
            throw new Error('Downloaded APK file එක හිස්.');
        }

        const fileName = `${safeFileName(appInfo.name || query)}.apk`;

        // වට්සැප් එකට සෘජුවම Document එකක් ලෙස APK එක යැවීම
        await conn.sendMessage(from, {
            document: buffer,
            mimetype: 'application/vnd.android.package-archive',
            fileName: fileName,
            caption: 
                `╭─〔 *📦 APK DOWNLOADED* 〕\n` +
                `│\n` +
                `│ 📱 *Name:* ${appInfo.name || query}\n` +
                `│\n` +
                `╰────────────────\n\n` +
                `*${FOOTER}*`
        }, { quoted: mek });

    } catch (error) {
        console.error('[APK DOWNLOAD ERROR]', error);
        await reply(
            `❌ *Download failed!*\n\n` +
            `${error.message || 'Unknown error'}\n\n` +
            `🔄 නැවත උත්සාහ කරන්න.`
        );
    }
});
