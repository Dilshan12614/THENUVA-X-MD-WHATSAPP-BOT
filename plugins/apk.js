const { cmd } = require('../command');

const API_BASE = 'https://sasa-dev-api.xyz';
const APTOIDE_META = 'https://ws2.aptoide.com/api/7/app/getMeta';
const FOOTER = 'ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

const pendingApps = new Map();
const MAX_FILE_SIZE = 200 * 1024 * 1024;
const TIMEOUT = 30000;

function safeName(name = 'app') {
    return String(name)
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 90) || 'app';
}

function formatSize(bytes) {
    if (!Number.isFinite(Number(bytes)) || Number(bytes) <= 0) {
        return 'Unknown';
    }

    const mb = Number(bytes) / (1024 * 1024);
    return mb >= 1024
        ? `${(mb / 1024).toFixed(2)} GB`
        : `${mb.toFixed(2)} MB`;
}

function isDirectDownload(url) {
    if (typeof url !== 'string') return false;

    try {
        const parsed = new URL(url);
        if (!['https:', 'http:'].includes(parsed.protocol)) return false;

        return /\.(apk|xapk)(?:$|[?#])/i.test(
            parsed.pathname + parsed.search
        );
    } catch {
        return false;
    }
}

async function getJson(url) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'THENUVA-X-MD/2.0',
            Accept: 'application/json'
        },
        signal: AbortSignal.timeout(TIMEOUT)
    });

    if (!response.ok) {
        throw new Error(`API HTTP ${response.status}`);
    }

    return response.json();
}

function getResults(data) {
    const result = data?.result;

    if (Array.isArray(result)) return result;
    if (result && typeof result === 'object') return [result];

    return [];
}

function getStoreLink(app) {
    const link = app?.link || app?.page || app?.web_url;

    try {
        const url = new URL(link);
        if (url.protocol === 'https:' || url.protocol === 'http:') {
            return url.href;
        }
    } catch {}

    return null;
}

/*
 * Package name extraction is only a best-effort fallback.
 * Never treat the result as confirmed unless Aptoide metadata
 * returns a usable download URL.
 */
function guessPackageFromLink(link) {
    try {
        const host = new URL(link).hostname.toLowerCase();

        if (!host.endsWith('.aptoide.com')) return null;

        let name = host.slice(0, -'.aptoide.com'.length);

        if (name.endsWith('.en')) {
            name = name.slice(0, -3);
        }

        if (
            name.length <= 180 &&
            /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/.test(name)
        ) {
            return name;
        }
    } catch {}

    return null;
}

async function resolveAptoideDownload(link) {
    const packageName = guessPackageFromLink(link);
    if (!packageName) return null;

    const endpoint = new URL(APTOIDE_META);
    endpoint.searchParams.set('package_name', packageName);

    const data = await getJson(endpoint.href);

    const file =
        data?.data?.file ||
        data?.apk ||
        data?.data?.apk ||
        null;

    const url = file?.path || file?.path_alt;

    if (typeof url !== 'string') return null;

    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
            return null;
        }

        return {
            url: parsed.href,
            packageName,
            size: Number(file?.size) || 0
        };
    } catch {
        return null;
    }
}

async function downloadApk(url, expectedSize = 0) {
    if (expectedSize > MAX_FILE_SIZE) {
        throw new Error('File is larger than the configured size limit.');
    }

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'THENUVA-X-MD/2.0',
            Accept: 'application/vnd.android.package-archive, application/octet-stream, */*'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(120000)
    });

    if (!response.ok) {
        throw new Error(`Download HTTP ${response.status}`);
    }

    const contentType = (
        response.headers.get('content-type') || ''
    ).toLowerCase();

    const contentLength = Number(
        response.headers.get('content-length') || 0
    );

    if (contentLength > MAX_FILE_SIZE) {
        throw new Error('Downloaded file exceeds the size limit.');
    }

    if (contentType.includes('text/html') ||
        contentType.includes('application/json')) {
        throw new Error('The server returned a webpage, not an APK file.');
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (!buffer.length || buffer.length > MAX_FILE_SIZE) {
        throw new Error('Invalid file size.');
    }

    // APK files are ZIP containers and normally begin with PK.
    if (
        buffer.length < 4 ||
        buffer[0] !== 0x50 ||
        buffer[1] !== 0x4b
    ) {
        throw new Error('The server response is not a valid APK/ZIP file.');
    }

    return buffer;
}

cmd(
    {
        pattern: 'apk',
        alias: ['downloadapk', 'playstore', 'app'],
        react: '📦',
        desc: 'Search apps and download APK when a direct file is available',
        category: 'download',
        filename: __filename
    },
    async (conn, mek, m, { from, q, reply }) => {
        try {
            const query = String(q || '').trim();

            if (!query) {
                return reply(
                    '*📦 APK DOWNLOADER*\n\n' +
                    'App එකේ නම ලබා දෙන්න.\n\n' +
                    'උදාහරණය: `.apk whatsapp`\n\n' +
                    FOOTER
                );
            }

            // If a search is pending, ".apk 1" selects the first result.
            const selection = query.match(/^(\d+)$/);
            const saved = pendingApps.get(from);

            if (selection && saved) {
                const index = Number(selection[1]) - 1;
                const app = saved.apps[index];

                if (!app) {
                    return reply(
                        `❌ Invalid selection. 1 - ${saved.apps.length} අතර අංකයක් දෙන්න.`
                    );
                }

                pendingApps.delete(from);

                const title = String(app.title || 'Unknown app');
                const storeLink = getStoreLink(app);

                await reply(
                    `⏳ *${title}*\n\n` +
                    'Download link එක පරීක්ෂා කරනවා...\n\n' +
                    FOOTER
                );

                let directUrl = null;
                let expectedSize = 0;

                // Use an explicit direct URL only if the API supplies one.
                const possibleDirect =
                    app.download_url ||
                    app.apk_url ||
                    app.download ||
                    app.file_url;

                if (isDirectDownload(possibleDirect)) {
                    directUrl = possibleDirect;
                    expectedSize = Number(app.size_bytes) || 0;
                } else if (storeLink) {
                    try {
                        const resolved = await resolveAptoideDownload(storeLink);

                        if (resolved) {
                            directUrl = resolved.url;
                            expectedSize = resolved.size;
                        }
                    } catch (error) {
                        console.error(
                            '[APK] Aptoide metadata lookup failed:',
                            error.message
                        );
                    }
                }

                if (!directUrl) {
                    if (storeLink) {
                        return reply(
                            `❌ *සෘජු APK download link එකක් ලබාගන්න බැරි වුණා.*\n\n` +
                            `📱 *App:* ${title}\n` +
                            `🔖 *Version:* ${app.version || 'Unknown'}\n` +
                            `📦 *Size:* ${app.size || 'Unknown'}\n\n` +
                            `🌐 *Store page:*\n${storeLink}\n\n` +
                            'API එකෙන් සෘජු APK URL එකක් නොලැබුණු නිසා file එකක් ලෙස යැව්වේ නැහැ.\n\n' +
                            FOOTER
                        );
                    }

                    return reply(
                        '❌ මේ app එකට වලංගු download URL එකක් ලැබුණේ නැහැ.\n\n' +
                        FOOTER
                    );
                }

                await reply('⬇️ APK file එක ලබාගන්න උත්සාහ කරනවා...');

                const buffer = await downloadApk(directUrl, expectedSize);
                const fileName = `${safeName(title)}.apk`;

                await conn.sendMessage(
                    from,
                    {
                        document: buffer,
                        mimetype: 'application/vnd.android.package-archive',
                        fileName,
                        caption:
                            `📦 *${title}*\n` +
                            `🔖 Version: ${app.version || 'Unknown'}\n` +
                            `💾 Size: ${formatSize(buffer.length)}\n\n` +
                            FOOTER
                    },
                    { quoted: mek }
                );

                return;
            }

            const apiKey = process.env.SASA_DEV_API_KEY;

            if (!apiKey) {
                return reply(
                    '❌ `SASA_DEV_API_KEY` environment variable එක සකස් කරලා නැහැ.'
                );
            }

            const endpoint = new URL('/api/search/apk', API_BASE);
            endpoint.searchParams.set('mode', 'search_dl');
            endpoint.searchParams.set('apikey', apiKey);
            endpoint.searchParams.set('q', query);

            await reply(
                `🔎 *APK SEARCH*\n\n` +
                `📱 Search: ${query}\n` +
                'App results සොයනවා...\n\n' +
                FOOTER
            );

            const data = await getJson(endpoint.href);
            const apps = getResults(data).slice(0, 10);

            if (data?.status !== true || apps.length === 0) {
                return reply(
                    '❌ App results හමු වුණේ නැහැ.\n\n' +
                    'වෙනත් app නමක් යොදා නැවත උත්සාහ කරන්න.'
                );
            }

            pendingApps.set(from, {
                apps,
                createdAt: Date.now()
            });

            // Remove stale selections.
            for (const [chat, entry] of pendingApps.entries()) {
                if (Date.now() - entry.createdAt > 10 * 60 * 1000) {
                    pendingApps.delete(chat);
                }
            }

            let text =
                '╭─〔 *ᴀᴘᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 〕──●●►\n' +
                `│ 🔎 Search: ${query}\n` +
                '╰──────────────────●●►\n\n';

            apps.forEach((app, index) => {
                text +=
                    `*${index + 1}. ${app.title || 'Unknown app'}*\n` +
                    `   🔖 Version: ${app.version || 'Unknown'}\n` +
                    `   💾 Size: ${app.size || 'Unknown'}\n`;

                if (app.rating) {
                    text += `   ⭐ Rating: ${app.rating}\n`;
                }

                text += '\n';
            });

            text +=
                '╭─〔 *ᴄʜᴏᴏsᴇ ᴀɴ ᴀᴘᴘ* 〕──●●►\n' +
                '│ තෝරාගැනීමට: `.apk 1`\n' +
                '│ දෙවැනි app එකට: `.apk 2`\n' +
                '╰──────────────────●●►\n\n' +
                'සටහන: සියලුම results සඳහා direct APK link එකක් තිබෙන බව සහතික නැහැ.\n\n' +
                FOOTER;

            return reply(text);
        } catch (error) {
            console.error('[APK] Error:', error.message);

            return reply(
                '❌ *APK Downloader Error*\n\n' +
                `${error.message || 'Unknown error'}\n\n` +
                'නැවත උත්සාහ කරන්න. Direct download server එකෙන් file එකක් නොලැබුණොත් app store link එක භාවිතා කරන්න.'
            );
        }
    }
);
