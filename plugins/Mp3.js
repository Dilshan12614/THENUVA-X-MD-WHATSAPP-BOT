const { cmd } = require('../command');

const API_BASE = 'https://sasa-dev-api.xyz';
const FOOTER = 'ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const API_TIMEOUT = 60000;
const DOWNLOAD_TIMEOUT = 120000;

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

async function readJsonResponse(response) {
    const text = await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(
            `API returned HTTP ${response.status}; invalid JSON response: ` +
            text.slice(0, 250)
        );
    }

    if (!response.ok) {
        const message =
            data?.message ||
            data?.error ||
            data?.msg ||
            'The API rejected the request';

        throw new Error(`API HTTP ${response.status}: ${message}`);
    }

    return data;
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
        info?.link,
        info?.result?.download_url,
        info?.data?.download_url
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
        throw new Error(`Audio download failed: HTTP ${response.status}`);
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
        throw new Error('Download server එකෙන් audio වෙනුවට webpage එකක් ලැබුණා.');
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (!buffer.length) {
        throw new Error('Audio file එක හිස්.');
    }

    if (buffer.length > MAX_FILE_SIZE) {
        throw new Error('Audio file එක 25 MB සීමාව ඉක්මවා ඇත.');
    }

    // MP3 files normally start with ID3 or an MPEG audio frame.
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

            // This API expects a YouTube URL in its "url" parameter.
            // Resolve song names through YouTube search first.
            let youtubeUrl = query;

            if (!/^https?:\/\//i.test(query)) {
                let yts;

                try {
                    yts = require('yt-search');
                } catch {
                    throw new Error(
                        'Song name search සඳහා yt-search dependency එක install කරලා නැහැ.'
                    );
                }

                const searchResults = await yts(query);
                const firstVideo = searchResults?.videos?.[0];

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

            const validHost =
                parsedUrl.hostname === 'youtu.be' ||
                parsedUrl.hostname === 'youtube.com' ||
                parsedUrl.hostname.endsWith('.youtube.com');

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

            const endpoint = new URL('/api/yt/mp3-dl', API_BASE);

            endpoint.searchParams.set('apikey', apiKey);
            endpoint.searchParams.set('url', youtubeUrl);
            endpoint.searchParams.set('quality', '128');
            endpoint.searchParams.set('raw', 'false');

            const response = await fetchWithTimeout(
                endpoint.href,
                {
                    headers: {
                        Accept: 'application/json',
                        'User-Agent': 'THENUVA-X-MD/2.0'
                    }
                },
                API_TIMEOUT
            );

            const data = await readJsonResponse(response);

            if (data?.status === false || data?.success === false) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    'MP3 API එකෙන් download එක අසාර්ථක වුණා.'
                );
            }

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
            const fileName = `${safeFileName(title)}.mp3`;

            await conn.sendMessage(
                from,
                {
                    audio: buffer,
                    mimetype: 'audio/mpeg',
                    fileName,
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
                '│ නැවත උත්සාහ කරන්න.\n' +
                '╰──────────────────●●►\n\n' +
                FOOTER
            );
        }
    }
);
