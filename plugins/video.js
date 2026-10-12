const { cmd } = require('../command');

const API_BASE = 'https://sasa-dev-api.xyz/api/yt/mp4-dl';
const API_KEY = process.env.SASA_YTMP4_API_KEY;

const TIMEOUT = 120000;
const MAX_VIDEO_SIZE = 64 * 1024 * 1024;

function findDownloadUrl(data) {
    if (!data || typeof data !== 'object') return null;

    const keys = [
        'download_url',
        'downloadUrl',
        'video_url',
        'videoUrl',
        'url',
        'link',
        'download',
        'result',
        'data'
    ];

    for (const key of keys) {
        const value = data[key];

        if (
            typeof value === 'string' &&
            /^https?:\/\//i.test(value)
        ) {
            return value;
        }

        if (value && typeof value === 'object') {
            const found = findDownloadUrl(value);
            if (found) return found;
        }
    }

    return null;
}

function findTitle(data) {
    if (!data || typeof data !== 'object') return 'YouTube Video';

    return (
        data.title ||
        data.result?.title ||
        data.data?.title ||
        'YouTube Video'
    );
}

cmd({
    pattern: 'video',
    alias: ['ytmp4', 'ytvideo'],
    react: '🎬',
    desc: 'Download YouTube video as MP4',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        const input = args.join(' ').trim();

        if (!input) {
            return reply(
                '🎬 *THENUVA X MD — VIDEO DOWNLOADER*\n\n' +
                'භාවිතය: `.video YouTube_URL`\n\n' +
                'උදාහරණය: `.video https://youtube.com/watch?v=...`'
            );
        }

        let videoUrl;

        try {
            videoUrl = new URL(input);
        } catch {
            return reply('❌ නිවැරදි YouTube URL එකක් ලබා දෙන්න.');
        }

        if (
            !['youtube.com', 'www.youtube.com', 'm.youtube.com',
              'youtu.be', 'www.youtu.be', 'youtube-nocookie.com',
              'www.youtube-nocookie.com'].includes(videoUrl.hostname)
        ) {
            return reply('❌ YouTube URL එකක් ලබා දෙන්න.');
        }

        if (!API_KEY) {
            return reply(
                '❌ SASA_YTMP4_API_KEY GitHub Actions Secret එක configure කරලා නැහැ.'
            );
        }

        await conn.sendMessage(from, {
            react: { text: '⏳', key: mek.key }
        });

        const apiUrl = new URL(API_BASE);
        apiUrl.searchParams.set('apikey', API_KEY);
        apiUrl.searchParams.set('url', videoUrl.toString());
        apiUrl.searchParams.set('quality', '360p');
        apiUrl.searchParams.set('raw', 'false');

        const apiResponse = await fetch(apiUrl.toString(), {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(TIMEOUT)
        });

        const contentType =
            apiResponse.headers.get('content-type') || '';

        if (!apiResponse.ok) {
            throw new Error(`API returned HTTP ${apiResponse.status}`);
        }

        let data;

        if (contentType.includes('application/json')) {
            data = await apiResponse.json();
        } else {
            throw new Error(
                `API returned ${contentType || 'unknown content type'}, not JSON`
            );
        }

        if (data.success === false || data.status === 'error') {
            throw new Error(
                data.message || data.error || 'API download failed'
            );
        }

        const downloadUrl = findDownloadUrl(data);

        if (!downloadUrl) {
            console.error(
                '[SASA YTMP4] No download URL found. Response keys:',
                Object.keys(data || {})
            );

            return reply(
                '❌ API response එකේ download URL එක හමු වුණේ නැහැ.\n' +
                'API response format එක පරීක්ෂා කරන්න අවශ්‍යයි.'
            );
        }

        await reply('📥 වීඩියෝව ලබාගනිමින් පවතී...');

        const downloadResponse = await fetch(downloadUrl, {
            signal: AbortSignal.timeout(TIMEOUT)
        });

        if (!downloadResponse.ok) {
            throw new Error(
                `Video download returned HTTP ${downloadResponse.status}`
            );
        }

        const fileType =
            downloadResponse.headers.get('content-type') || '';

        if (
            !fileType.toLowerCase().includes('video/') &&
            !fileType.toLowerCase().includes('octet-stream')
        ) {
            throw new Error(
                `Download URL returned non-video content: ${fileType}`
            );
        }

        const declaredSize = Number(
            downloadResponse.headers.get('content-length') || 0
        );

        if (declaredSize > MAX_VIDEO_SIZE) {
            return reply('❌ වීඩියෝ ගොනුව විශාල වැඩියි.');
        }

        const arrayBuffer = await downloadResponse.arrayBuffer();

        if (arrayBuffer.byteLength > MAX_VIDEO_SIZE) {
            return reply('❌ වීඩියෝ ගොනුව 64 MB සීමාව ඉක්මවයි.');
        }

        const buffer = Buffer.from(arrayBuffer);

        if (!buffer.length) {
            throw new Error('Downloaded video is empty');
        }

        await conn.sendMessage(from, {
            video: buffer,
            mimetype: 'video/mp4',
            fileName: 'THENUVA-X-MD.mp4',
            caption:
                `🎬 *${findTitle(data)}*\n\n` +
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
            '❌ *Video Download Failed*\n\n' +
            `${error.message}\n\n` +
            'API response format එක සහ download URL එක පරීක්ෂා කරන්න.'
        );
    }
});
