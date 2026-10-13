const { cmd } = require('../command');

const FOOTER = 'ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

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

        // බොට් එකේ Axios Wrapper එක බයිපාස් කිරීමට සම්පූර්ණ ලිපිනය String එකක් ලෙස
        const finalUrl = 'https://sasa-dev-api.xyz' + encodeURIComponent(query);

        // Axios වෙනුවට බොට් එකේ interceptors වලට අහුවෙන්නේ නැති native fetch පාවිච්චි කිරීම
        const response = await fetch(finalUrl, {
            method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (!response.ok) {
            throw new Error(`API server HTTP ${response.status}`);
        }

        const resData = await response.json();

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

        // APK ලින්ක් එකෙන් ගොනුව native fetch එකෙන්ම ArrayBuffer එකක් ලෙස බාගත කිරීම
        const fileResponse = await fetch(downloadUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (!fileResponse.ok) {
            throw new Error(`Download server HTTP ${fileResponse.status}`);
        }

        const arrayBuffer = await fileResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

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
