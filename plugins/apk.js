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

        if (typeof value !== 'string') continue;

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

    for (const key of ['app_name', 'appName', 'title', 'name']) {
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

async function fetchWithTimeout(url, options = {}, timeout = 60000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } catch (error) {
        const safeUrl = String(url).replace(
            /([?&](?:apikey|api_key|key|token)=)[^&]*/gi,
            '$1[REDACTED]'
        );

        console.error('[APK FETCH ERROR]', {
            url: safeUrl,
            name: error?.name,
            message: error?.message,
            causeCode: error?.cause?.code,
            causeMessage: error?.cause?.message
        });

        throw error;
    } finally {
        clearTimeout(timer);
    }
}

function getErrorMessage(error) {
    const code = error?.cause?.code;
    const name = error?.name;
    const message = error?.message || 'Unknown error';

    if (name === 'AbortError' || name === 'TimeoutError') {
        return 'Request timed out. Server එක ප්‍රතිචාර දක්වන්නේ නැහැ.';
    }

    if (code === 'ENOTFOUND') {
        return 'API hostname එක සොයාගත නොහැක. API URL එක පරීක්ෂා කරන්න.';
    }

    if (code === 'ECONNREFUSED') {
        return 'API server එක connection එක ප්‍රතික්ෂේප කළා.';
    }

    if (code === 'ECONNRESET') {
        return 'API server එක connection එක විසන්ධි කළා.';
    }

    if (code === 'CERT_HAS_EXPIRED') {
        return 'API server SSL certificate එක කල් ඉකුත් වී ඇත.';
    }

    if (code === 'UND_ERR_CONNECT_TIMEOUT') {
        return 'API server එකට connect වීමට timeout වුණා.';
    }

    return `${name || 'Error'}: ${message}`.slice(0, 450);
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
                    '╭─〔 *THENUVA X MD* 〕\n' +
                    '│\n' +
                    '│ 📦 *APK SEARCH & DOWNLOAD*\n' +
                    '│\n' +
                    '│ භාවිතය: .apk app name\n' +
                    '│ උදා: .apk WhatsApp\n' +
                    '│ උදා: .apk Telegram\n' +
                    '│\n' +
                    '╰──────────────'
                );
            }

            if (!API_KEY) {
                console.error('[APK] SASA_DEV_API_KEY is missing');

                return reply(
                    '❌ *API KEY MISSING*\n\n' +
                    'GitHub Secrets හෝ Railway Variables තුළ ' +
                    'SASA_DEV_API_KEY සකසන්න.'
                );
            }

            await reply(
                '╭─〔 *THENUVA X MD* 〕\n' +
                '│\n' +
                '│ 🔎 *SEARCHING APK...*\n' +
                `│ 📱 App: ${query}\n` +
                '│ ⏳ Please wait...\n' +
                '│\n' +
                '╰──────────────'
            );

            // STEP 1: Request the APK API
            const apiUrl = new URL(API_BASE);
            apiUrl.searchParams.set('mode', 'search_dl');
            apiUrl.searchParams.set('apikey', API_KEY);
            apiUrl.searchParams.set('q', query);

            console.log('[APK] Starting search:', query);

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
                console.error('[APK API HTTP ERROR]', {
                    status: apiResponse.status,
                    body: apiText.slice(0, 500)
                });

                if ([401, 403].includes(apiResponse.status)) {
                    return reply(
                        '❌ *API AUTHENTICATION FAILED*\n\n' +
                        'API key එක හෝ API permissions පරීක්ෂා කරන්න.'
                    );
                }

                if (apiResponse.status === 429) {
                    return reply(
                        '⏳ API rate limit එක ඉක්මවා තිබෙනවා. ' +
                        'පසුව නැවත උත්සාහ කරන්න.'
                    );
                }

                return reply(
                    '❌ *APK API ERROR*\n\n' +
                    `HTTP Status: ${apiResponse.status}`
                );
            }

            let data;

            try {
                data = JSON.parse(apiText);
            } catch {
                console.error(
                    '[APK] Invalid JSON response:',
                    apiText.slice(0, 500)
                );

                return reply(
                    '❌ API එකෙන් JSON response එකක් ලැබුණේ නැහැ.'
                );
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
                            : 'No APK result returned';

                console.error('[APK API RESPONSE ERROR]', message);

                return reply(
                    '❌ *APK SEARCH FAILED*\n\n' +
                    message.slice(0, 300)
                );
            }

            // STEP 2: Find download link
            const downloadUrl = findDownloadUrl(data);
            const appName = findAppName(data, query);

            if (!downloadUrl) {
                console.error(
                    '[APK] No supported download URL field:',
                    JSON.stringify(data).slice(0, 1800)
                );

                return reply(
                    '⚠️ *DOWNLOAD LINK NOT FOUND*\n\n' +
                    'API response එකේ download URL එක හඳුනාගත නොහැකි වුණා.\n' +
                    'SASA API response format එකට අනුව code එක වෙනස් කළ යුතුයි.'
                );
            }

            // STEP 3: Download file
            console.log('[APK] Downloading APK file');

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
                    '[APK DOWNLOAD HTTP ERROR]',
                    fileResponse.status
                );

                return reply(
                    '❌ *APK DOWNLOAD FAILED*\n\n' +
                    `HTTP Status: ${fileResponse.status}\n` +
                    'Download link එක expire වී හෝ අවහිර වී තිබිය හැකියි.'
                );
            }

            const contentType = (
                fileResponse.headers.get('content-type') || ''
            ).toLowerCase();

            const contentLength = Number(
                fileResponse.headers.get('content-length') || 0
            );

            if (contentLength > MAX_FILE_SIZE) {
                return reply('❌ APK file එක 100 MB ඉක්මවා තිබෙනවා.');
            }

            if (
                contentType.includes('text/html') ||
                contentType.includes('application/json')
            ) {
                const body = await fileResponse.text();

                console.error(
                    '[APK INVALID CONTENT]',
                    body.slice(0, 500)
                );

                return reply(
                    '❌ Download link එකෙන් APK file එකක් වෙනුවට ' +
                    'webpage එකක් ලැබුණා.'
                );
            }

            if (!fileResponse.body) {
                throw new Error('Download response body is empty');
            }

            // STEP 4: Read with a size limit
            const chunks = [];
            let totalSize = 0;

            for await (const chunk of fileResponse.body) {
                totalSize += chunk.length;

                if (totalSize > MAX_FILE_SIZE) {
                    throw new Error('APK file exceeds 100 MB limit');
                }

                chunks.push(chunk);
            }

            const buffer = Buffer.concat(chunks);

            if (!buffer.length) {
                throw new Error('Downloaded file is empty');
            }

            // STEP 5: Validate ZIP/APK signature
            if (!isZipFile(buffer)) {
                console.error('[APK] Invalid ZIP signature', {
                    contentType,
                    size: buffer.length,
                    firstBytes: buffer.subarray(0, 12).toString('hex')
                });

                return reply(
                    '❌ *INVALID APK FILE*\n\n' +
                    'ලැබුණු file එක APK package එකක් නොවේ.\n' +
                    'API එකෙන් ලැබෙන direct download URL එක පරීක්ෂා කරන්න.'
                );
            }

            // STEP 6: Send document
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
                        '│ ✅ *APK DOWNLOAD SUCCESS*\n' +
                        `│ 📱 App: ${appName}\n` +
                        `│ 📦 Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB\n` +
                        '│\n' +
                        '╰──────────────'
                },
                { quoted: mek }
            );

            console.log('[APK] Successfully sent:', fileName);

        } catch (error) {
            const details = getErrorMessage(error);

            console.error('[APK PLUGIN ERROR]', {
                name: error?.name,
                message: error?.message,
                code: error?.cause?.code,
                cause: error?.cause?.message,
                stack: error?.stack
            });

            return reply(
                '❌ *APK DOWNLOAD ERROR*\n\n' +
                `📌 ${details}\n\n` +
                'GitHub Actions logs තුළ [APK FETCH ERROR] ' +
                'සෙවීමෙන් වැඩි විස්තර ලබාගත හැකියි.'
            );
        }
    }
);
