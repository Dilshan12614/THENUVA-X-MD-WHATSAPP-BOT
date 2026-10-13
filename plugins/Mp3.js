const { cmd } = require('../command');

const API_BASE = 'https://sasa-dev-api.xyz';
const FOOTER = 'ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const TIMEOUT = 60000;

function safeFileName(name = 'audio') {
    return String(name)
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 80) || 'audio';
}

function isHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
}

async function getJson(url, apiKey) {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'User-Agent': 'THENUVA-X-MD/2.0'
        },
        signal: AbortSignal.timeout(TIMEOUT)
    });

    if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
    }

    return response.json();
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

cmd(
    {
        pattern: 'mp3',
        alias: ['song', 'ytaudio', 'ytmp3'],
        react: '🎵',
        desc: 'Download audio using the YouTube MP3 API',
        category: 'download',
        filename: __filename
    },

    async (conn, mek, m, { from, q, reply }) => {
        try {
            const query = String(q || '').trim();

            if (!query) {
                return reply(
                    '╭─〔 *ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 〕──●●►\n' +
                    '│\n' +
                    '│ 🎵 Song name එකක් හෝ YouTube URL එකක් දෙන්න.\n' +
                    '│\n' +
                    '│ උදා: `.mp3 song name`\n' +
                    '│ උදා: `.mp3 https://youtu.be/...`\n' +
                    '╰──────────────────●●►\n\n' +
                    FOOTER
                );
            }

            const apiKey = process.env.SASA_YTMP3_API_KEY;

            if (!apiKey) {
                return reply(
                    '❌ `SASA_YTMP3_API_KEY` environment variable එක සකස් කරලා නැහැ.'
                );
            }

            const endpoint = new URL('/api/yt/mp3-dl', API_BASE);
            endpoint.searchParams.set('q', query);
            endpoint.searchParams.set('apikey', apiKey);

            await reply(
                '╭─〔 *ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 〕──●●►\n' +
                '│ 🎵 Song එක සොයනවා...\n' +
                '│ ⏳ කරුණාකර රැඳී සිටින්න.\n' +
                '╰──────────────────●●►\n\n' +
                FOOTER
            );

            const data = await getJson(endpoint.href, apiKey);

            if (data?.status === false || data?.success === false) {
                throw new Error(
                    data?.message || data?.error || 'API එකෙන් download එක අසාර්ථක වුණා.'
                );
            }

            const info = getAudioInfo(data);

            const title =
                info?.title ||
                info?.name ||
                info?.video_title ||
                'Downloaded Audio';

            const audioUrl =
                info?.download_url ||
                info?.downloadUrl ||
                info?.audio_url ||
                info?.audioUrl ||
                info?.url ||
                info?.link;

            if (!isHttpUrl(audioUrl)) {
                console.error(
                    '[MP3] API response did not contain a usable audio URL.'
                );

                return reply(
                    '❌ API response එකෙන් සෘජු audio URL එකක් හමු වුණේ නැහැ.\n\n' +
                    'API response format එක පරීක්ෂා කළ යුතුයි.\n\n' +
                    FOOTER
                );
            }

            await reply(
                `🎵 *${title}*\n\n` +
                '⬇️ Audio file එක ලබාගන්නවා...\n\n' +
                FOOTER
            );

            const response = await fetch(audioUrl, {
                headers: {
                    'User-Agent': 'THENUVA-X-MD/2.0',
                    Accept: 'audio/mpeg, audio/*, application/octet-stream'
                },
                signal: AbortSignal.timeout(120000)
            });

            if (!response.ok) {
                throw new Error(`Audio server returned HTTP ${response.status}`);
            }

            const contentType = (
                response.headers.get('content-type') || ''
            ).toLowerCase();

            const length = Number(
                response.headers.get('content-length') || 0
            );

            if (length > MAX_FILE_SIZE) {
                throw new Error('Audio file එක 25 MB සීමාව ඉක්මවා ඇත.');
            }

            if (
                contentType.includes('text/html') ||
                contentType.includes('application/json')
            ) {
                throw new Error('Audio වෙනුවට webpage/API response එකක් ලැබුණා.');
            }

            const buffer = Buffer.from(await response.arrayBuffer());

            if (!buffer.length || buffer.length > MAX_FILE_SIZE) {
                throw new Error('Audio file එක හිස් හෝ size limit එක ඉක්මවා ඇත.');
            }

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
                '❌ *MP3 Download Failed*\n\n' +
                `${error.message || 'Unknown error'}\n\n` +
                'API එකේ response format එක හෝ download server එක පරීක්ෂා කරන්න.\n\n' +
                FOOTER
            );
        }
    }
);
