const { cmd } = require('../command');

const API_BASE = 'https://sasa-dev-api.xyz/api/search/apk';
const API_KEY = process.env.SASA_DEV_API_KEY;

const MAX_FILE_SIZE = 100 * 1024 * 1024;

function findValue(obj, keys, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 7) return null;

    for (const key of keys) {
        if (typeof obj[key] === 'string' && obj[key].trim()) {
            const value = obj[key].trim();

            if (/^https?:\/\//i.test(value)) {
                return value;
            }
        }
    }

    for (const value of Object.values(obj)) {
        if (value && typeof value === 'object') {
            const result = findValue(value, keys, depth + 1);
            if (result) return result;
        }
    }

    return null;
}

function findText(obj, keys, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 7) return '';

    for (const key of keys) {
        if (
            typeof obj[key] === 'string' &&
            obj[key].trim() &&
            !/^https?:\/\//i.test(obj[key])
        ) {
            return obj[key].trim();
        }
    }

    for (const value of Object.values(obj)) {
        if (value && typeof value === 'object') {
            const result = findText(value, keys, depth + 1);
            if (result) return result;
        }
    }

    return '';
}

function safeFileName(name) {
    return (name || 'application')
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 80);
}

cmd(
    {
        pattern: 'apk',
        alias: ['app', 'apkdl'],
        react: '📦',
        desc: 'Search and download APK files',
        category: 'download',
        filename: __filename
    },

    async (conn, mek, m, { from, q, reply }) => {
        try {
            const query = typeof q === 'string' ? q.trim() : '';

            if (!query) {
                return reply(
                    '📦 *APK SEARCH & DOWNLOAD*\n\n' +
                    'භාවිතය: `.apk app name`\n\n' +
                    'උදාහරණ:\n' +
                    '`.apk WhatsApp`\n' +
                    '`.apk Telegram`\n' +
                    '`.apk Spotify`'
                );
            }

            if (!API_KEY) {
                return reply(
                    '❌ SASA API key එක සකසා නැහැ.\n\n' +
                    '`SASA_DEV_API_KEY` කියන environment variable එක සකසන්න.'
                );
            }

            await reply(
                '🔎 *APK SEARCHING...*\n\n' +
                `📱 App: ${query}\n` +
                '⏳ කරුණාකර රැඳී සිටින්න...'
            );

            const apiUrl = new URL(API_BASE);
            apiUrl.searchParams.set('mode', 'search_dl');
            apiUrl.searchParams.set('apikey', API_KEY);
            apiUrl.searchParams.set('q', query);

            const apiResponse = await fetch(apiUrl.toString(), {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'THENUVA-X-MD'
                },
                signal: AbortSignal.timeout(60000)
            });

            const responseText = await apiResponse.text();

            let data;

            try {
                data = JSON.parse(responseText);
            } catch {
                console.error(
                    '[APK] API returned non-JSON:',
                    responseText.slice(0, 300)
                );

                return reply(
                    '❌ API එකෙන් නිවැරදි JSON response එකක් ලැබුණේ නැහැ.\n' +
                    `HTTP Status: ${apiResponse.status}`
                );
            }

            if (!apiResponse.ok) {
                console.error('[APK] API error:', data);

                return reply(
                    `❌ APK API request failed.\nHTTP Status: ${apiResponse.status}\n\n` +
                    'API key එක සහ API service එක පරීක්ෂා කරන්න.'
                );
            }

            if (
                data.success === false ||
                data.status === false ||
                data.error
            ) {
                const message =
                    data.message ||
                    data.error ||
                    'APK එක සොයාගැනීමට නොහැකි වුණා.';

                return reply(`❌ ${message}`);
            }

            const downloadUrl = findValue(data, [
                'download_url',
                'downloadUrl',
                'download',
                'direct_download',
                'directDownload',
                'apk_url',
                'apkUrl',
                'url',
                'link'
            ]);

            const appName =
                findText(data, [
                    'app_name',
                    'appName',
                    'title',
                    'name',
                    'package_name'
                ]) || query;

            if (!downloadUrl) {
                console.error(
                    '[APK] No download URL in API response:',
                    JSON.stringify(data).slice(0, 1500)
                );

                return reply(
                    '⚠️ API එකෙන් APK download link එකක් ලැබුණේ නැහැ.\n\n' +
                    'API response එකේ format එක පරීක්ෂා කරන්න ඕන.'
                );
            }

            let parsedUrl;

            try {
                parsedUrl = new URL(downloadUrl);
            } catch {
                return reply('❌ API එකෙන් ලැබුණු download URL එක වැරදියි.');
            }

            if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
                return reply('❌ සහාය නොදක්වන download URL එකක් ලැබුණා.');
            }

            const fileResponse = await fetch(downloadUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; THENUVA-X-MD)',
                    Accept: 'application/vnd.android.package-archive, application/octet-stream, */*'
                },
                redirect: 'follow',
                signal: AbortSignal.timeout(120000)
            });

            if (!fileResponse.ok) {
                return reply(
                    '❌ APK download එක අසාර්ථකයි.\n' +
                    `HTTP Status: ${fileResponse.status}`
                );
            }

            const contentType = (
                fileResponse.headers.get('content-type') || ''
            ).toLowerCase();

            const contentLength = Number(
                fileResponse.headers.get('content-length') || 0
            );

            if (contentLength > MAX_FILE_SIZE) {
                return reply('❌ APK file එක 100 MB සීමාව ඉක්මවා තිබෙනවා.');
            }

            if (
                contentType.includes('text/html') ||
                contentType.includes('application/json')
            ) {
                const errorBody = await fileResponse.text();

                console.error(
                    '[APK] Download URL returned webpage/JSON:',
                    errorBody.slice(0, 500)
                );

                return reply(
                    '❌ Direct APK file එක වෙනුවට webpage එකක් ලැබුණා.\n' +
                    'API එකෙන් ලැබුණු link එක සැබෑ download link එකක්දැයි පරීක්ෂා කරන්න.'
                );
            }

            if (!fileResponse.body) {
                return reply('❌ Download file එක ලබාගැනීමට නොහැකියි.');
            }

            const chunks = [];
            let totalSize = 0;

            for await (const chunk of fileResponse.body) {
                totalSize += chunk.length;

                if (totalSize > MAX_FILE_SIZE) {
                    return reply('❌ APK file එක 100 MB සීමාව ඉක්මවා තිබෙනවා.');
                }

                chunks.push(chunk);
            }

            const buffer = Buffer.concat(chunks);

            // APK files are ZIP-based packages.
            // Check the ZIP signature to avoid sending an HTML error page.
            const isZip =
                buffer.length >= 4 &&
                buffer[0] === 0x50 &&
                buffer[1] === 0x4b &&
                (
                    (buffer[2] === 0x03 && buffer[3] === 0x04) ||
                    (buffer[2] === 0x05 && buffer[3] === 0x06) ||
                    (buffer[2] === 0x07 && buffer[3] === 0x08)
                );

            if (!isZip) {
                console.error(
                    '[APK] Response is not a ZIP/APK file:',
                    contentType,
                    buffer.length
                );

                return reply(
                    '❌ ලැබුණු file එක APK එකක් ලෙස හඳුනාගත නොහැකියි.\n' +
                    'API එකෙන් සැබෑ APK download URL එකක් ලැබෙනවාදැයි පරීක්ෂා කරන්න.'
                );
            }

            const fileName = `${safeFileName(appName)}.apk`;

            await conn.sendMessage(
                from,
                {
                    document: buffer,
                    mimetype: 'application/vnd.android.package-archive',
                    fileName,
                    caption:
                        '╭─〔 *THENUVA X MD* 〕\n' +
                        '│\n' +
                        '│ 📦 *APK DOWNLOAD SUCCESS*\n' +
                        `│ 📱 App: ${appName}\n` +
                        `│ 📁 Size: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB\n` +
                        '│\n' +
                        '╰──────────────'
                },
                { quoted: mek }
            );

        } catch (error) {
            console.error('[APK PLUGIN ERROR]', error);

            const message =
                error.name === 'TimeoutError' ||
                error.name === 'AbortError'
                    ? '⏳ Request එකට වැඩි කාලයක් ගතවුණා. නැවත උත්සාහ කරන්න.'
                    : '❌ APK download කිරීමේදී දෝෂයක් ඇතිවුණා.';

            return reply(message);
        }
    }
);
