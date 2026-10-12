const { cmd } = require('../command');

const API_BASE = 'https://sasa-dev-api.xyz/api/yt/mp4-dl';
const API_KEY = process.env.SASA_YTMP4_API_KEY;

const TIMEOUT = 120000;
const MAX_VIDEO_SIZE = 64 * 1024 * 1024;

function findDownloadUrl(data, depth = 0) {
    if (!data || typeof data !== 'object' || depth > 6) {
        return null;
    }

    const fields = [
        'download_url',
        'downloadUrl',
        'video_url',
        'videoUrl',
        'url',
        'link',
        'download'
    ];

    for (const key of fields) {
        const value = data[key];

        if (
            typeof value === 'string' &&
            /^https?:\/\//i.test(value)
        ) {
            return value;
        }
    }

    for (const key of ['result', 'data', 'response']) {
        if (data[key] && typeof data[key] === 'object') {
            const found = findDownloadUrl(data[key], depth + 1);
            if (found) return found;
        }
    }

    return null;
}

function findTitle(data) {
    return (
        data?.title ||
        data?.result?.title ||
        data?.data?.title ||
        'YouTube Video'
    );
}

function isYouTubeUrl(value) {
    try {
        const parsed = new URL(value);

        const hosts = [
            'youtube.com',
            'www.youtube.com',
            'm.youtube.com',
            'youtu.be',
            'www.youtu.be',
            'youtube-nocookie.com',
            'www.youtube-nocookie.com'
        ];

        return (
            ['http:', 'https:'].includes(parsed.protocol) &&
            hosts.includes(parsed.hostname)
        );
    } catch {
        return false;
    }
}

cmd({
    pattern: 'video',
    alias: ['ytmp4', 'ytvideo'],
    react: '🎬',
    desc: 'Download YouTube video',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        const input = args.join(' ').trim();

        if (!input) {
            return reply(
                '╭━━〔 *THENUVA X MD* 〕━━╮\n' +
                '┃ 🎬 *YOUTUBE DOWNLOADER*\n' +
                '╰━━━━━━━━━━━━━━━━━━╯\n\n' +
                '📌 භාවිතය:\n' +
                '`.video YouTube_URL`\n\n' +
                '🔗 YouTube video URL එකක් එවන්න.'
            );
        }

        if (!isYouTubeUrl(input)) {
            return reply('❌ නිවැරදි YouTube URL එකක් ලබා දෙන්න.');
        }

        if (!API_KEY) {
            console.error('[SASA YTMP4] API key is missing');

            return reply(
                '❌ SASA_YTMP4_API_KEY GitHub Secret එක සකස් කරලා නැහැ.'
            );
        }

        await conn.sendMessage(from, {
            react: { text: '⏳', key: mek.key }
        });

        const apiUrl = new URL(API_BASE);
        apiUrl.searchParams.set('apikey', API_KEY);
        apiUrl.searchParams.set('url', input);

        // API එකට අවශ්‍ය අගයන් තහවුරු කරන තුරු
        // endpoint එකේ දී ඇති parameter names භාවිත කරයි.
        apiUrl.searchParams.set('quality', '360p');
        apiUrl.searchParams.set('raw', 'false');

        console.log('[SASA YTMP4] Request started');

        const apiResponse = await fetch(apiUrl.toString(), {
            headers: {
                Accept: 'application/json',
                'User-Agent': 'THENUVA-X-MD/2.0'
            },
            signal: AbortSignal.timeout(TIMEOUT)
        });

        const contentType =
            apiResponse.headers.get('content-type') || '';

        const responseText = await apiResponse.text();

        console.log('[SASA YTMP4] HTTP:', apiResponse.status);
        console.log('[SASA YTMP4] Content-Type:', contentType);
        console.log(
            '[SASA YTMP4] Response:',
            responseText.slice(0, 500)
        );

        if (!apiResponse.ok) {
            if (apiResponse.status === 403) {
                return reply(
                    '❌ *SASA API — HTTP 403*\n\n' +
                    'API server එක request එක ප්‍රතික්ෂේප කළා.\n\n' +
                    '🔑 API key එක සහ endpoint permissions පරීක්ෂා කරන්න.\n' +
                    '📋 GitHub Actions logs වල response එකත් බලන්න.'
                );
            }

            return reply(
                `❌ API Error: HTTP ${apiResponse.status}\n` +
                'GitHub Actions logs පරීක්ෂා කරන්න.'
            );
        }

        if (!contentType.toLowerCase().includes('application/json')) {
            console.error(
                '[SASA YTMP4] Expected JSON, received:',
                contentType
            );

            return reply(
                '❌ API එක JSON response එකක් ලබා දුන්නේ නැහැ.\n' +
                'GitHub Actions logs පරීක්ෂා කරන්න.'
            );
        }

        let data;

        try {
            data = JSON.parse(responseText);
        } catch {
            return reply('❌ API response එක නිවැරදි JSON එකක් නොවේ.');
        }

        if (
            data.success === false ||
            data.status === 'error' ||
            data.error
        ) {
            const message =
                typeof data.error === 'string'
                    ? data.error
                    : data.message || 'API download failed';

            console.error('[SASA YTMP4] API message:', message);

            return reply(`❌ API Error: ${message}`);
        }

        const downloadUrl = findDownloadUrl(data);

        if (!downloadUrl) {
            console.error(
                '[SASA YTMP4] Download URL missing. Response keys:',
                Object.keys(data)
            );

            return reply(
                '❌ API response එකේ download URL එක හමු වුණේ නැහැ.\n' +
                'සැබෑ API response format එක අනුව code එක update කළ යුතුයි.'
            );
        }

        let parsedDownloadUrl;

        try {
            parsedDownloadUrl = new URL(downloadUrl);
        } catch {
            return reply('❌ API එකෙන් ලැබුණු download URL එක වැරදියි.');
        }

        if (!['https:', 'http:'].includes(parsedDownloadUrl.protocol)) {
            return reply('❌ API download URL protocol එක වලංගු නැහැ.');
        }

        await reply('📥 වීඩියෝව download කරමින් පවතී...');

        const videoResponse = await fetch(downloadUrl, {
            headers: {
                Accept: 'video/mp4, video/*, application/octet-stream'
            },
            signal: AbortSignal.timeout(TIMEOUT)
        });

        if (!videoResponse.ok) {
            throw new Error(
                `Video download returned HTTP ${videoResponse.status}`
            );
        }

        const videoType =
            videoResponse.headers.get('content-type') || '';

        if (
            !videoType.toLowerCase().includes('video/') &&
            !videoType.toLowerCase().includes('application/octet-stream')
        ) {
            console.error(
                '[SASA YTMP4] Non-video download response:',
                videoType
            );

            throw new Error(
                `Download URL returned non-video content: ${videoType}`
            );
        }

        const declaredSize = Number(
            videoResponse.headers.get('content-length') || 0
        );

        if (declaredSize > MAX_VIDEO_SIZE) {
            return reply('❌ වීඩියෝ ගොනුව 64 MB සීමාව ඉක්මවයි.');
        }

        const videoBuffer = Buffer.from(
            await videoResponse.arrayBuffer()
        );

        if (videoBuffer.length === 0) {
            throw new Error('Downloaded video is empty');
        }

        if (videoBuffer.length > MAX_VIDEO_SIZE) {
            return reply('❌ වීඩියෝ ගොනුව 64 MB සීමාව ඉක්මවයි.');
        }

        const title = String(findTitle(data))
            .replace(/[\\/:*?"<>|]/g, '')
            .slice(0, 100);

        await conn.sendMessage(from, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            fileName: `${title || 'THENUVA-X-MD'}.mp4`,
            caption:
                `🎬 *${title}*\n\n` +
                '⚡ *Downloaded by THENUVA X MD*'
        }, { quoted: mek });

        await conn.sendMessage(from, {
            react: { text: '✅', key: mek.key }
        });

    } catch (error) {
        console.error('[SASA YTMP4 ERROR]', error.message);

        await conn.sendMessage(from, {
            react: { text: '❌', key: mek.key }
        });

        return reply(
            '❌ *VIDEO DOWNLOAD FAILED*\n\n' +
            `${error.message}\n\n` +
            'GitHub Actions logs පරීක්ෂා කරන්න.'
        );
    }
});
