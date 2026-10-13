const { cmd } = require('../command');

const API_BASE = 'https://sasa-dev-api.xyz/api/search/apk';
const API_KEY = process.env.SASA_DEV_API_KEY;

const FOOTER =
    'ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

const API_TIMEOUT = 60000;
const DOWNLOAD_TIMEOUT = 120000;
const MAX_FILE_SIZE = 150 * 1024 * 1024;

function safeFileName(name) {
    return String(name || 'THENUVA-APK')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\s+/g, '_')
        .trim()
        .slice(0, 100) || 'THENUVA-APK';
}

async function fetchWithTimeout(url, options = {}, timeout = 60000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } catch (error) {
        console.error('[APK FETCH ERROR]', {
            host: (() => {
                try {
                    return new URL(url).hostname;
                } catch {
                    return 'invalid-url';
                }
            })(),
            name: error.name,
            message: error.message,
            code: error.cause?.code
        });

        throw error;
    } finally {
        clearTimeout(timer);
    }
}

function getObjects(value, depth = 0, result = []) {
    if (!value || typeof value !== 'object' || depth > 8) {
        return result;
    }

    if (result.includes(value)) return result;
    result.push(value);

    for (const child of Object.values(value)) {
        if (child && typeof child === 'object') {
            getObjects(child, depth + 1, result);
        }
    }

    return result;
}

function getValue(objects, keys, fallback = '') {
    for (const object of objects) {
        for (const key of keys) {
            const value = object?.[key];

            if (typeof value === 'string' && value.trim()) {
                return value.trim();
            }

            if (typeof value === 'number') {
                return String(value);
            }
        }
    }

    return fallback;
}

function isHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' ||
            url.protocol === 'http:';
    } catch {
        return false;
    }
}

function isStorePage(value) {
    try {
        const url = new URL(value);
        const host = url.hostname.toLowerCase();
        const path = url.pathname.toLowerCase();

        if (
            host === 'play.google.com' ||
            host === 'apps.apple.com'
        ) {
            return true;
        }

        if (
            /(^|\.)aptoide\.com$/.test(host) &&
            !/\.(apk|xapk)$/i.test(path)
        ) {
            return true;
        }

        return false;
    } catch {
        return true;
    }
}

function findDownloadUrl(data) {
    const objects = getObjects(data);

    const preferredKeys = [
        'download_url',
        'downloadUrl',
        'direct_download',
        'directDownload',
        'download_link',
        'downloadLink',
        'apk_url',
        'apkUrl',
        'direct_url',
        'directUrl',
        'url',
        'link',
        'download'
    ];

    for (const object of objects) {
        for (const key of preferredKeys) {
            const value = object[key];

            if (
                typeof value === 'string' &&
                isHttpUrl(value) &&
                !isStorePage(value)
            ) {
                return value.trim();
            }

            if (value && typeof value === 'object') {
                const nestedUrl =
                    value.url ||
                    value.link ||
                    value.download_url ||
                    value.downloadUrl;

                if (
                    typeof nestedUrl === 'string' &&
                    isHttpUrl(nestedUrl) &&
                    !isStorePage(nestedUrl)
                ) {
                    return nestedUrl.trim();
                }
            }
        }
    }

    return null;
}

function getErrorMessage(error) {
    const code = error?.cause?.code;

    if (
        error.name === 'AbortError' ||
        error.name === 'TimeoutError'
    ) {
        return 'Request timeout වුණා. නැවත උත්සාහ කරන්න.';
    }

    if (code === 'ERR_SSL_SSLV3_ALERT_HANDSHAKE_FAILURE') {
        return 'Download server එකේ SSL/TLS connection එක අසාර්ථකයි.';
    }

    if (code === 'ENOTFOUND') {
        return 'Server hostname එක සොයාගත නොහැක.';
    }

    if (code === 'ECONNRESET') {
        return 'Server connection එක විසන්ධි වුණා.';
    }

    return String(error.message || 'Unknown error').slice(0, 350);
}

cmd({
    pattern: 'apk',
    alias: ['downloadapk', 'playstore', 'app', 'apkdl'],
    react: '📦',
    desc: 'Search and download APK files from SASA DEV API',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const query = String(q || '').trim();

        if (!query) {
            return reply(
                '╭─〔 *THENUVA X MD* 〕\n' +
                '│\n' +
                '│ 📦 *APK DOWNLOADER*\n' +
                '│\n' +
                '│ භාවිතය: .apk app name\n' +
                '│ උදා: .apk WhatsApp\n' +
                '│ උදා: .apk Telegram\n' +
                '│\n' +
                '╰──────────────\n\n' +
                `*${FOOTER}*`
            );
        }

        if (!API_KEY) {
            return reply(
                '❌ *API KEY MISSING*\n\n' +
                'GitHub Secrets / Railway Variables තුළ ' +
                '`SASA_DEV_API_KEY` සකසන්න.'
            );
        }

        await reply(
            '🔎 *APPLICATION එක සොයමින් පවතියි...*\n\n' +
            `📱 App: ${query}\n` +
            '⏳ Please wait...'
        );

        // Build the correct SASA DEV API endpoint.
        const apiUrl = new URL(API_BASE);

        apiUrl.searchParams.set('mode', 'search_dl');
        apiUrl.searchParams.set('apikey', API_KEY);
        apiUrl.searchParams.set('q', query);

        console.log('[APK] Searching:', query);

        const response = await fetchWithTimeout(
            apiUrl.toString(),
            {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'THENUVA-X-MD'
                }
            },
            API_TIMEOUT
        );

        const responseText = await response.text();

        if (!response.ok) {
            console.error('[APK API ERROR]', {
                status: response.status,
                body: responseText.slice(0, 300)
            });

            if ([401, 403].includes(response.status)) {
                return reply(
                    '❌ *API AUTHENTICATION FAILED*\n\n' +
                    'SASA_DEV_API_KEY එක පරීක්ෂා කරන්න.'
                );
            }

            if (response.status === 429) {
                return reply(
                    '⏳ API rate limit ඉක්මවා තිබෙනවා. ' +
                    'පසුව නැවත උත්සාහ කරන්න.'
                );
            }

            throw new Error(`API server HTTP ${response.status}`);
        }

        let data;

        try {
            data = JSON.parse(responseText);
        } catch {
            console.error(
                '[APK] Invalid JSON:',
                responseText.slice(0, 500)
            );

            throw new Error('API එකෙන් JSON response එකක් ලැබුණේ නැහැ.');
        }

        if (
            data.success === false ||
            data.status === false ||
            data.error
        ) {
            const message =
                typeof data.message === 'string'
                    ? data.message
                    : typeof data.error === 'string'
                        ? data.error
                        : 'App එක සොයාගත නොහැකි වුණා.';

            return reply(`❌ *APK SEARCH FAILED*\n\n${message}`);
        }

        const objects = getObjects(data);
        const appName = getValue(
            objects,
            ['app_name', 'appName', 'name', 'title'],
            query
        );

        const packageId = getValue(
            objects,
            ['package_id', 'packageId', 'package_name', 'packageName'],
            'Unknown'
        );

        const appVersion = getValue(
            objects,
            ['version', 'app_version', 'appVersion'],
            'Unknown'
        );

        const appSize = getValue(
            objects,
            ['size', 'file_size', 'fileSize'],
            'Unknown'
        );

        const downloadUrl = findDownloadUrl(data);

        if (!downloadUrl) {
            console.error(
                '[APK] No direct download URL:',
                JSON.stringify(data).slice(0, 1800)
            );

            return reply(
                '❌ *DOWNLOAD LINK NOT FOUND*\n\n' +
                'API එකෙන් සෘජු APK download link එකක් ලැබුණේ නැහැ.\n' +
                'API response එක පරීක්ෂා කළ යුතුයි.'
            );
        }

        const caption =
            '╭─〔 *📦 APK DOWNLOADER* 〕\n' +
            '│\n' +
            `│ 📱 *Name:* ${appName}\n` +
            `│ 🆔 *Package:* ${packageId}\n` +
            `│ 🏷️ *Version:* ${appVersion}\n` +
            `│ ⚖️ *Size:* ${appSize}\n` +
            '│\n' +
            '╰────────────────\n\n' +
            '⏳ *APK ගොනුව බාගත කරමින් පවතී...*';

        await reply(caption);

        console.log(
            '[APK] Download host:',
            new URL(downloadUrl).hostname
        );

        const fileResponse = await fetchWithTimeout(
            downloadUrl,
            {
                method: 'GET',
                redirect: 'follow',
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Linux; Android 10) ' +
                        'AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
                    Accept:
                        'application/vnd.android.package-archive, ' +
                        'application/octet-stream, */*'
                }
            },
            DOWNLOAD_TIMEOUT
        );

        if (!fileResponse.ok) {
            throw new Error(
                `Download server HTTP ${fileResponse.status}`
            );
        }

        const contentType = (
            fileResponse.headers.get('content-type') || ''
        ).toLowerCase();

        const contentLength = Number(
            fileResponse.headers.get('content-length') || 0
        );

        if (contentLength > MAX_FILE_SIZE) {
            await fileResponse.body?.cancel().catch(() => {});
            throw new Error('File එක 150 MB ඉක්මවා තිබෙනවා.');
        }

        if (
            contentType.includes('text/html') ||
            contentType.includes('application/json')
        ) {
            await fileResponse.body?.cancel().catch(() => {});

            throw new Error(
                'Download link එකෙන් APK file එකක් වෙනුවට webpage/JSON එකක් ලැබුණා.'
            );
        }

        if (!fileResponse.body) {
            throw new Error('Download response එක හිස්.');
        }

        const chunks = [];
        let totalSize = 0;

        for await (const chunk of fileResponse.body) {
            totalSize += chunk.length;

            if (totalSize > MAX_FILE_SIZE) {
                throw new Error('File එක 150 MB ඉක්මවා තිබෙනවා.');
            }

            chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks);

        if (!buffer.length) {
            throw new Error('Downloaded file එක හිස්.');
        }

        // APK is a ZIP-based package. Do not send an HTML page as an APK.
        if (
            buffer.length < 4 ||
            buffer[0] !== 0x50 ||
            buffer[1] !== 0x4b
        ) {
            console.error('[APK] Invalid package signature', {
                contentType,
                size: buffer.length,
                firstBytes: buffer.subarray(0, 12).toString('hex')
            });

            throw new Error(
                'ලැබුණු file එක APK package එකක් නොවේ.'
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
                    '╭─〔 *📦 APK DOWNLOADED* 〕\n' +
                    '│\n' +
                    `│ 📱 *Name:* ${appName}\n` +
                    `│ 💾 *Size:* ${(buffer.length / 1024 / 1024).toFixed(2)} MB\n` +
                    '│ ✅ *Download successful*\n' +
                    '│\n' +
                    '╰────────────────\n\n' +
                    `*${FOOTER}*`
            },
            { quoted: mek }
        );

        console.log('[APK] Successfully sent:', fileName);

    } catch (error) {
        console.error('[APK DOWNLOAD ERROR]', {
            name: error.name,
            message: error.message,
            code: error.cause?.code
        });

        return reply(
            '❌ *DOWNLOAD FAILED*\n\n' +
            `${getErrorMessage(error)}\n\n` +
            '🔄 නැවත උත්සාහ කරන්න.'
        );
    }
});
