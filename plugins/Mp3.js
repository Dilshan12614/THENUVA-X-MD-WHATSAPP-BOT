const { cmd } = require('../command');
const { ytmp3 } = require('@vreden/youtube_scraper');

const API_BASE = 'https://sasa-dev-api.xyz';
const FOOTER =
    '> ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const API_TIMEOUT = 60000;
const DOWNLOAD_TIMEOUT = 120000;
const MAX_RETRIES = 2;

// Prevent simultaneous requests for the same chat.
const activeChats = new Set();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function safeFileName(name = 'audio') {
    return String(name)
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 80) || 'audio';
}

function isHttpUrl(value) {
    if (typeof value !== 'string') return false;

    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
}

async function fetchWithTimeout(url, options = {}, timeout = API_TIMEOUT) {
    return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(timeout)
    });
}

async function fetchMp3WithRetry(endpoint) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        let response;
        let raw;

        try {
            response = await fetchWithTimeout(
                endpoint,
                {
                    headers: {
                        Accept: 'application/json',
                        'User-Agent': 'THENUVA-X-MD/2.0'
                    }
                },
                API_TIMEOUT
            );

            raw = await response.text();
        } catch (error) {
            if (attempt < MAX_RETRIES) {
                const waitMs = 5000 * (attempt + 1);

                console.log(
                    `[MP3] Network error. Retry in ${waitMs / 1000}s.`
                );

                await sleep(waitMs);
                continue;
            }

            throw new Error(`MP3 API connection failed: ${error.message}`);
        }

        let data;

        try {
            data = JSON.parse(raw);
        } catch {
            if (response.status === 429 && attempt < MAX_RETRIES) {
                await sleep(30000 * (attempt + 1));
                continue;
            }

            throw new Error(
                `API HTTP ${response.status}: ` +
                raw.slice(0, 200)
            );
        }

        const apiMessage =
            data?.message ||
            data?.error ||
            data?.msg ||
            '';

        const rateLimited =
            response.status === 429 ||
            /rate.?limit|too many requests/i.test(String(apiMessage));

        if (rateLimited) {
            if (attempt < MAX_RETRIES) {
                const retryAfter = Number(
                    response.headers.get('retry-after')
                );

                const waitMs = retryAfter > 0
                    ? Math.min(retryAfter * 1000, 120000)
                    : 30000 * (attempt + 1);

                console.log(
                    `[MP3] API rate limited. Waiting ${waitMs / 1000}s before retry ${attempt + 1}/${MAX_RETRIES}.`
                );

                await sleep(waitMs);
                continue;
            }

            throw new Error(
                'YouTube engine එක තවම rate limited. ' +
                'මිනිත්තු කිහිපයකින් නැවත උත්සාහ කරන්න.'
            );
        }

        if (!response.ok) {
            throw new Error(
                `API HTTP ${response.status}: ` +
                (apiMessage || 'Request failed')
            );
        }

        if (data?.status === false || data?.success === false) {
            throw new Error(
                apiMessage || 'MP3 API එකෙන් download එක අසාර්ථක වුණා.'
            );
        }

        return data;
    }

    throw new Error('MP3 API එක දැනට භාවිතා කළ නොහැක.');
}

function getAudioInfo(data) {
    const candidates = [
        data?.result,
        data?.data,
        data?.result?.data,
        data?.data?.result
    ];

    for (const item of candidates) {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
            return item;
        }
    }

    return data;
}

function getAudioUrl(info) {
    const candidates = [
        info?.download_url,
        info?.downloadUrl,
        info?.audio_url,
        info?.audioUrl,
        info?.download,
        info?.url,
        info?.link
    ];

    return candidates.find(isHttpUrl) || null;
}

function getTitle(info) {
    return String(
        info?.title ||
        info?.name ||
        info?.video_title ||
        info?.song ||
        'THENUVA_X_MD_Audio'
    );
}

async function downloadAudio(url) {
    const response = await fetchWithTimeout(
        url,
        {
            headers: {
                'User-Agent': 'THENUVA-X-MD/2.0',
                Accept: 'audio/mpeg, audio/*, application/octet-stream'
            },
            redirect: 'follow'
        },
        DOWNLOAD_TIMEOUT
    );

    if (!response.ok) {
        throw new Error(
            `Audio download failed: HTTP ${response.status}`
        );
    }

    const contentType = (
        response.headers.get('content-type') || ''
    ).toLowerCase();

    const contentLength = Number(
        response.headers.get('content-length') || 0
    );

    if (contentLength > MAX_FILE_SIZE) {
        throw new Error('Audio file එක 25 MB සීමාව ඉක්මවා ඇත.');
    }

    if (
        contentType.includes('text/html') ||
        contentType.includes('application/json')
    ) {
        throw new Error(
            'Download server එකෙන් audio වෙනුවට webpage එකක් ලැබුණා.'
        );
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (!buffer.length) {
        throw new Error('Audio file එක හිස්.');
    }

    if (buffer.length > MAX_FILE_SIZE) {
        throw new Error('Audio file එක 25 MB සීමාව ඉක්මවා ඇත.');
    }

    // Check for a common MP3 signature.
    const hasID3 =
        buffer.length >= 3 &&
        buffer.toString('ascii', 0, 3) === 'ID3';

    const hasMpegFrame =
        buffer.length >= 2 &&
        buffer[0] === 0xff &&
        (buffer[1] & 0xe0) === 0xe0;

    if (!hasID3 && !hasMpegFrame) {
        throw new Error(
            'ලැබුණු file එක MP3 audio එකක් බව තහවුරු කළ නොහැක.'
        );
    }

    return buffer;
}

cmd(
    {
        pattern: 'mp3',
        alias: ['song', 'ytaudio', 'ytmp3'],
        react: '🎵',
        desc: 'Download YouTube audio as MP3',
        category: 'download',
        filename: __filename
    },

    async (conn, mek, m, { from, q, reply }) => {
        if (activeChats.has(from)) {
            return reply(
                '⏳ මේ chat එකේ MP3 request එකක් දැනට ක්‍රියාත්මකයි. ' +
                'ඒක අවසන් වනතුරු රැඳී සිටින්න.'
            );
        }

        activeChats.add(from);

        try {
            const query = String(q || '').trim();

            if (!query) {
                return reply(
                    '╭─〔 *ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 〕──●●►\n' +
                    '│ 🎵 Song name එකක් හෝ YouTube URL එකක් දෙන්න.\n' +
                    '│\n' +
                    '│ උදා: `.mp3 song name`\n' +
                    '│ උදා: `.mp3 https://youtu.be/VIDEO_ID`\n' +
                    '╰──────────────────●●►\n\n' +
                    FOOTER
                );
            }

            let youtubeUrl = query;

            // Search YouTube when the user provides a song name.
            if (!/^https?:\/\//i.test(query)) {
                let yts;

                try {
                    yts = require('yt-search');
                } catch {
                    throw new Error(
                        '`yt-search` dependency එක install කරලා නැහැ.'
                    );
                }

                const results = await yts(query);
                const firstVideo = results?.videos?.[0];

                if (!firstVideo?.url) {
                    return reply('❌ මේ song එක හමු වුණේ නැහැ.');
                }

                youtubeUrl = firstVideo.url;
            }

            let parsedUrl;

            try {
                parsedUrl = new URL(youtubeUrl);
            } catch {
                return reply('❌ නිවැරදි YouTube URL එකක් ලබා දෙන්න.');
            }

            const hostname = parsedUrl.hostname.toLowerCase();

            const validHost =
                hostname === 'youtu.be' ||
                hostname === 'youtube.com' ||
                hostname.endsWith('.youtube.com');

            if (
                !validHost ||
                !['http:', 'https:'].includes(parsedUrl.protocol)
            ) {
                return reply(
                    '❌ YouTube URL එකක් හෝ song name එකක් ලබා දෙන්න.'
                );
            }

            const apiKey = process.env.SASA_YTMP3_API_KEY;

            if (!apiKey) {
                return reply(
                    '❌ `SASA_YTMP3_API_KEY` GitHub Secrets / Railway Variables තුළ සකස් කරලා නැහැ.'
                );
            }

            await reply(
                '╭─〔 *ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 〕──●●►\n' +
                '│ 🔎 Song එක සොයනවා...\n' +
                '│ 🎧 Audio එක සකස් කරනවා...\n' +
                '╰──────────────────●●►\n\n' +
                FOOTER
            );

            const endpoint = new URL(
                '/api/yt/mp3-dl',
                API_BASE
            );

            endpoint.searchParams.set('apikey', apiKey);
            endpoint.searchParams.set('url', youtubeUrl);
            endpoint.searchParams.set('quality', '128');
            endpoint.searchParams.set('raw', 'false');

            const data = await fetchMp3WithRetry(endpoint.href);
            const info = getAudioInfo(data);
            const audioUrl = getAudioUrl(info);

            if (!audioUrl) {
                console.error(
                    '[MP3] API response did not contain a recognised audio URL.'
                );

                return reply(
                    '❌ API එකෙන් සෘජු audio download URL එකක් ලැබුණේ නැහැ.\n\n' +
                    'API response format එක පරීක්ෂා කළ යුතුයි.\n\n' +
                    FOOTER
                );
            }

            const title = getTitle(info);

            await reply(
                `🎵 *${title}*\n\n` +
                '⬇️ MP3 file එක download කරනවා...\n\n' +
                FOOTER
            );

            const buffer = await downloadAudio(audioUrl);

            await conn.sendMessage(
                from,
                {
                    audio: buffer,
                    mimetype: 'audio/mpeg',
                    fileName: `${safeFileName(title)}.mp3`,
                    ptt: false
                },
                { quoted: mek }
            );

        } catch (error) {
            console.error('[MP3 ERROR]', error.message);

            return reply(
                '╭─〔 *ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ᴇʀʀᴏʀ* 〕──●●►\n' +
                `│ ❌ ${error.message || 'Unknown error'}\n` +
                '│\n' +
                '│ YouTube engine එක rate limited නම් ටික වේලාවකින් නැවත උත්සාහ කරන්න.\n' +
                '╰──────────────────●●►\n\n' +
                FOOTER
            );
        } finally {
            activeChats.delete(from);
        }
    }
);
