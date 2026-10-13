const { cmd } = require('../command');

const API_BASE = 'https://sasa-dev-api.xyz/api/search/apk';
const API_KEY = process.env.SASA_DEV_API_KEY;

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const API_TIMEOUT = 60000;
const DOWNLOAD_TIMEOUT = 120000;

function safeFileName(name) {
    return String(name || 'application')
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 80);
}

function findDownloadUrl(obj, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 8) {
        return null;
    }

    const keys = [
        'download_url',
        'downloadUrl',
        'direct_download',
        'directDownload',
        'download_link',
        'downloadLink',
        'apk_url',
        'apkUrl',
        'download',
        'url',
        'link'
    ];

    for (const key of keys) {
        const value = obj[key];

        if (typeof value === 'string' && value.trim()) {
            try {
                const parsed = new URL(value.trim());

                if (
                    parsed.protocol === 'https:' ||
                    parsed.protocol === 'http:'
                ) {
                    return value.trim();
                }
            } catch {}
        }
    }

    for (const value of Object.values(obj)) {
        if (value && typeof value === 'object') {
            const result = findDownloadUrl(value, depth + 1);

            if (result) return result;
        }
    }

    return null;
}

function findAppName(obj, fallback, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 8) {
        return fallback;
    }

    const keys = [
        'app_name',
        'appName',
        'title',
        'name'
    ];

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
            const result = findAppName(value, '', depth + 1);

            if (result) return result;
        }
    }

    return fallback;
}

function isZipFile(buffer) {
    return (
        buffer.length >= 4 &&
        buffer[0] === 0x50 &&
        buffer[1] === 0x4b &&
        (
            (buffer[2] === 0x03 && buffer[3] === 0x04) ||
            (buffer[2] === 0x05 && buffer[3] === 0x06) ||
            (buffer[2] === 0x07 && buffer[3] === 0x08)
        )
    );
}

async function fetchWithTimeout(url, options, timeout) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } finally {
        clearTimeout(timer);
    }
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
                    '╭─〔 *APK SEARCH* 〕\n' +
                    '│\n' +
                    '│ 📱 App එකේ නම ලබාදෙන්න.\n' +
                    '│\n' +
                    '│ උදාහරණ:\n' +
                    '│ .apk WhatsApp\n' +
                    '│ .apk Telegram\n' +
                    '│ .apk Spotify\n' +
                    '│\n' +
                    '╰──────────────'
                );
            }

            if (!API_KEY) {
                console.error('[APK] SASA_DEV_API_KEY is missing');

                return reply(
                    '❌ *API KEY NOT CONFIGURED*\n\n' +
                    'GitHub Actions Secrets සහ Railway Variables තුළ ' +
                    '`SASA_DEV_API_KEY` සකසා තිබේදැයි බලන්න.'
                );
            }

            await reply(
                '╭─〔 *THENUVA X MD* 〕\n' +
                '│\n' +
                '│ 🔎 *APK SEARCHING...*\n' +
                `│ 📱 App: ${query}\n` +
                '│ ⏳ කරුණාකර රැඳී සිටින්න.\n' +
                '│\n' +
                '╰──────────────'
            );

            // STEP 1: Call SASA DEV APK API
            const apiUrl = new URL(API_BASE);

            apiUrl.searchParams.set('mode', 'search_dl');
            apiUrl.searchParams.set('apikey', API_KEY);
            apiUrl.searchParams.set('q', query);

            console.log('[APK] Searching app:', query);

            const apiResponse = await fetchWithTimeout(
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

            const apiText = await apiResponse.text();

            if (!apiResponse.ok) {
                console.error(
                    '[APK] API HTTP error:',
                    apiResponse.status,
                    apiText.slice(0, 500)
                );

                if (apiResponse.status === 401 ||
                    apiResponse.status === 403) {
                    return reply(
                        '❌ *API AUTHENTICATION FAILED*\n\n' +
                        'SASA API key එක වැරදිද, කල් ඉකුත් වෙලාද ' +
                        'යන්න පරීක්ෂා කරන්න.'
                    );
                }

                return reply(
                    '❌ *APK API ERROR*\n\n' +
                    `HTTP Status: ${apiResponse.status}\n` +
                    'API service එක පසුව නැවත උත්සාහ කරන්න.'
                );
            }

            let data;

            try {
                data = JSON.parse(apiText);
            } catch {
                console.error(
                    '[APK] API returned invalid JSON:',
                    apiText.slice(0, 500)
                );

                return reply(
                    '❌ API එකෙන් JSON response එකක් ලැබුණේ නැහැ.\n' +
                    'SASA API endpoint එක පරීක්ෂා කරන්න.'
                );
            }

            console.log('[APK] API response received');

            if (
                data.success === false ||
                data.status === false ||
                data.error
            ) {
                const apiMessage =
                    typeof data.message === 'string'
                        ? data.message
                        : typeof data.error === 'string'
                            ? data.error
                            : 'No matching APK found';

                console.error('[APK] API rejected request:', apiMessage);

                return reply(
                    '❌ *APK NOT FOUND*\n\n' +
                    `${apiMessage.slice(0, 300)}`
                );
            }

            // STEP 2: Extract the direct download URL
            const downloadUrl = findDownloadUrl(data);

            const appName = findAppName(data, query);

            if (!downloadUrl) {
                console.error(
                    '[APK] No download URL found. Response structure:',
                    JSON.stringify(data).slice(0, 2000)
                );

                return reply(
                    '⚠️ *DOWNLOAD LINK NOT FOUND*\n\n' +
                    'API එකෙන් download link එකක් හඳුනාගැනීමට නොහැකි වුණා.\n' +
                    'API response format එක පරීක්ෂා කළ යුතුයි.'
                );
            }

            const parsedUrl = new URL(downloadUrl);

            if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
                return reply('❌ Download URL එක වලංගු නැහැ.');
            }

            // STEP 3: Download APK file
            console.log('[APK] Downloading file');

            const fileResponse = await fetchWithTimeout(
                downloadUrl,
                {
                    method: 'GET',
                    redirect: 'follow',
                    headers: {
                        'User-Agent':
                            'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
                        Accept:
                            'application/vnd.android.package-archive, application/octet-stream, */*'
                    }
                },
                DOWNLOAD_TIMEOUT
            );

            if (!fileResponse.ok) {
                console.error(
                    '[APK] File download HTTP error:',
                    fileResponse.status
                );

                return reply(
                    '❌ *FILE DOWNLOAD FAILED*\n\n' +
                    `HTTP Status: ${fileResponse.status}\n` +
                    'API එකෙන් ලබාදුන් download link එක ක්‍රියා නොකරනවා.'
                );
            }

            const contentType = (
                fileResponse.headers.get('content-type') || ''
            ).toLowerCase();

            const contentLength = Number(
                fileResponse.headers.get('content-length') || 0
            );

            if (contentLength > MAX_FILE_SIZE) {
                return reply(
                    '❌ APK file එක 100 MB සීමාව ඉක්මවා තිබෙනවා.'
                );
            }

            if (
                contentType.includes('text/html') ||
                contentType.includes('application/json')
            ) {
                const bodyText = await fileResponse.text();

                console.error(
                    '[APK] Received webpage instead of APK:',
                    bodyText.slice(0, 500)
                );

                return reply(
                    '❌ *INVALID DOWNLOAD RESPONSE*\n\n' +
                    'Download link එකෙන් APK file එක වෙනුවට webpage එකක් ලැබුණා.\n' +
                    'SASA API එකේ direct download link එක පරීක්ෂා කරන්න.'
                );
            }

            if (!fileResponse.body) {
                return reply('❌ Download response එක හිස්.');
            }

            // STEP 4: Read the file with a size limit
            const chunks = [];
            let totalSize = 0;

            for await (const chunk of fileResponse.body) {
                totalSize += chunk.length;

                if (totalSize > MAX_FILE_SIZE) {
                    throw new Error(
                        'APK file exceeds the 100 MB size limit'
                    );
                }

                chunks.push(chunk);
            }

            const buffer = Buffer.concat(chunks);

            if (buffer.length === 0) {
                throw new Error('Downloaded file is empty');
            }

            // STEP 5: Validate APK/ZIP signature
            if (!isZipFile(buffer)) {
                console.error(
                    '[APK] Invalid APK signature. Content-Type:',
                    contentType,
                    'Size:',
                    buffer.length
                );

                return reply(
                    '❌ *INVALID APK FILE*\n\n' +
                    'Download link එකෙන් ලැබුණු file එක APK package එකක් නොවේ.\n' +
                    'API response එකෙන් ලබාදුන් link එක පරීක්ෂා කරන්න.'
                );
            }

            // STEP 6: Send APK to WhatsApp
            const fileName = `${safeFileName(appName)}.apk`;

            console.log(
                '[APK] Sending file:',
                fileName,
                `${(buffer.length / 1024 / 1024).toFixed(2)} MB`
            );

            await conn.sendMessage(
                from,
                {
                    document: buffer,
                    mimetype: 'application/vnd.android.package-archive',
                    fileName,
                    caption:
                        '╭─〔 *THENUVA X MD* 〕\n' +
                        '│\n' +
                        '│ ✅ *APK DOWNLOAD SUCCESS*\n' +
                        `│ 📱 App: ${appName}\n` +
                        `│ 📦 Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB\n` +
                        '│\n' +
                        '╰──────────────'
                },
                { quoted: mek }
            );

            console.log('[APK] File sent successfully');

        } catch (error) {
            console.error('[APK PLUGIN ERROR]', {
                name: error?.name,
                message: error?.message,
                stack: error?.stack
            });

            let reason = error?.message || 'Unknown error';

            if (
                error?.name === 'AbortError' ||
                error?.name === 'TimeoutError'
            ) {
                reason = 'Request timed out';
            } else if (
                error?.cause?.code === 'ENOTFOUND'
            ) {
                reason = 'Cannot resolve API/download server hostname';
            } else if (
                error?.cause?.code === 'ECONNRESET'
            ) {
                reason = 'Connection reset by remote server';
            }

            return reply(
                '❌ *APK DOWNLOAD ERROR*\n\n' +
                `📌 Type: ${error?.name || 'Error'}\n` +
                `📝 Details: ${String(reason).slice(0, 400)}\n\n` +
                'ඉහත error details අනුව ගැටලුව පරීක්ෂා කරන්න.'
            );
        }
    }
);
