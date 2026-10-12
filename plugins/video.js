const axios = require('axios');
const { cmd } = require('../command');

const API_URL =
    'https://apis.davidcyril.name.ng/download/ytdl-rapid';

const activeRequests = new Set();
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

// ========================================
// FIND AND NORMALIZE DOWNLOAD URL
// ========================================
function findDownloadUrl(data) {
    const preferredKeys = [
        'download_url',
        'downloadUrl',
        'video_url',
        'videoUrl',
        'url',
        'link',
        'download',
        'links',
        'formats'
    ];

    function normalizeUrl(value) {
        if (typeof value !== 'string') return null;

        let url = value.trim();

        // Handle Markdown links: [URL](URL)
        const markdown = url.match(
            /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/
        );

        if (markdown) {
            url = markdown[2];
        } else {
            const embedded = url.match(
                /\]\((https?:\/\/[^)\s]+)\)/
            );

            if (embedded) {
                url = embedded[1];
            }
        }

        // Handle a URL wrapped in square brackets
        if (
            url.startsWith('[') &&
            url.endsWith(']') &&
            !url.includes('](')
        ) {
            url = url.slice(1, -1);
        }

        url = url.replace(/^["']|["']$/g, '');

        try {
            const parsed = new URL(url);

            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return null;
            }

            return parsed.href;
        } catch {
            return null;
        }
    }

    function scan(value, depth = 0) {
        if (value == null || depth > 8) return null;

        if (typeof value === 'string') {
            return normalizeUrl(value);
        }

        if (typeof value !== 'object') return null;

        for (const key of preferredKeys) {
            if (value[key] !== undefined) {
                const found = scan(value[key], depth + 1);
                if (found) return found;
            }
        }

        for (const item of Object.values(value)) {
            const found = scan(item, depth + 1);
            if (found) return found;
        }

        return null;
    }

    return scan(data);
}

// ========================================
// VIDEO DOWNLOADER
// ========================================
cmd({
    pattern: 'video',
    alias: ['ytmp4', 'ytvideo', 'hdvideo'],
    react: '🎬',
    desc: 'Download YouTube video',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {

    if (activeRequests.has(from)) {
        return reply(
            '⏳ දැනට video request එකක් ක්‍රියාත්මකයි. ටිකක් ඉන්න.'
        );
    }

    if (!q || !q.trim()) {
        return reply(
            '*🎬 THENUVA X MD VIDEO DOWNLOADER*\n\n' +
            '📥 YouTube Video Downloader\n\n' +
            'භාවිතය:\n' +
            '.video VIDEO_URL'
        );
    }

    let parsedUrl;

    try {
        parsedUrl = new URL(q.trim());
    } catch {
        return reply('❌ නිවැරදි video URL එකක් ලබා දෙන්න.');
    }

    const allowedHosts = [
        'youtube.com',
        'www.youtube.com',
        'm.youtube.com',
        'music.youtube.com',
        'youtu.be',
        'www.youtu.be'
    ];

    if (
        !['http:', 'https:'].includes(parsedUrl.protocol) ||
        !allowedHosts.includes(parsedUrl.hostname.toLowerCase())
    ) {
        return reply('❌ වලංගු YouTube URL එකක් ලබා දෙන්න.');
    }

    activeRequests.add(from);

    try {
        const apiKey = process.env.DAVIDCYRIL_API_KEY;

        if (!apiKey) {
            return reply(
                '❌ DAVIDCYRIL_API_KEY configure කරලා නැහැ.\n\n' +
                'GitHub → Settings → Secrets and variables → Actions ' +
                'වෙත ගොස් API key එක සකසන්න.'
            );
        }

        await reply(
            '⏳ *THENUVA X MD*\n\n' +
            '🎬 Video එක ලබාගනිමින් පවතී...\n' +
            '📥 කරුණාකර රැඳී සිටින්න.'
        );

        // 1. Request the API
        const response = await axios.get(API_URL, {
            params: {
                url: parsedUrl.href
            },
            headers: {
                'X-API-Key': apiKey,
                Accept: 'application/json'
            },
            timeout: 120000,
            maxContentLength: 2 * 1024 * 1024,
            maxRedirects: 5
        });

        const apiData = response.data;

        console.log(
            '[YTDL-RAPID] API success:',
            apiData?.success
        );

        if (!apiData || typeof apiData !== 'object') {
            return reply(
                '❌ API එකෙන් නිවැරදි response එකක් ලැබුණේ නැහැ.'
            );
        }

        if (apiData.success === false) {
            return reply(
                '❌ API download අසාර්ථකයි.\n' +
                String(apiData.message || 'Video එක ලබාගත නොහැක.')
            );
        }

        const result =
            apiData.data ||
            apiData.result ||
            apiData;

        const title = String(
            result.title ||
            apiData.title ||
            'THENUVA VIDEO'
        ).slice(0, 180);

        const downloadUrl = findDownloadUrl(result);

        console.log('[YTDL-RAPID] Title:', title);
        console.log(
            '[YTDL-RAPID] Download URL received:',
            Boolean(downloadUrl)
        );

        if (!downloadUrl) {
            console.error(
                '[YTDL-RAPID] No valid download URL found.'
            );

            console.log(
                '[YTDL-RAPID] Response:',
                JSON.stringify(apiData).slice(0, 3000)
            );

            return reply(
                '❌ API response එකෙන් download URL එක හඳුනාගත නොහැක.\n' +
                'GitHub Actions logs පරීක්ෂා කරන්න.'
            );
        }

        // 2. Download the actual file
        console.log('[YTDL-RAPID] Download host:', new URL(downloadUrl).hostname);

        const fileResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 180000,
            maxContentLength: MAX_VIDEO_SIZE,
            maxBodyLength: MAX_VIDEO_SIZE,
            maxRedirects: 10,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                Accept: 'video/mp4, video/webm, application/octet-stream, */*'
            },
            validateStatus: () => true
        });

        const status = fileResponse.status;

        if (status === 403) {
            return reply(
                '❌ Download server එක access ප්‍රතික්ෂේප කළා (403).\n' +
                'API provider එකේ download access එක පරීක්ෂා කරන්න.'
            );
        }

        if (status === 404) {
            return reply(
                '❌ Download link එක කල් ඉකුත් වී හෝ නොපවතින එකක් විය හැකියි (404).'
            );
        }

        if (status === 429) {
            return reply(
                '⏳ Download server එකේ rate limit එකට පැමිණ ඇත. පසුව උත්සාහ කරන්න.'
            );
        }

        if (status < 200 || status >= 300) {
            console.error(
                '[YTDL-RAPID] Download HTTP status:',
                status
            );

            return reply(
                `❌ Video download අසාර්ථකයි. HTTP ${status}`
            );
        }

        const contentType = String(
            fileResponse.headers['content-type'] || ''
        ).toLowerCase();

        const videoBuffer = Buffer.from(
            fileResponse.data || []
        );

        if (!videoBuffer.length) {
            return reply('❌ ලැබුණු video file එක හිස්.');
        }

        if (videoBuffer.length > MAX_VIDEO_SIZE) {
            return reply(
                '❌ Video එක 100 MB සීමාව ඉක්මවා ඇත.'
            );
        }

        // 3. Reject HTML and JSON
        const beginning = videoBuffer
            .subarray(0, 512)
            .toString('utf8')
            .trimStart()
            .toLowerCase();

        if (
            contentType.includes('text/html') ||
            contentType.includes('application/json') ||
            beginning.startsWith('<!doctype html') ||
            beginning.startsWith('<html') ||
            beginning.startsWith('{')
        ) {
            console.error(
                '[YTDL-RAPID] Non-video content:',
                contentType
            );

            return reply(
                '❌ Download URL එකෙන් video එක වෙනුවට webpage/API response එකක් ලැබුණා.\n\n' +
                'URL එක හඳුනාගෙන තිබුණත් server එකෙන් සැබෑ video file එක ලැබී නැහැ.'
            );
        }

        // 4. Check actual file signature
        const isMP4 =
            videoBuffer.length >= 12 &&
            videoBuffer.toString('ascii', 4, 8) === 'ftyp';

        const isWebM =
            videoBuffer.length >= 4 &&
            videoBuffer.toString('hex', 0, 4) === '1a45dfa3';

        if (!isMP4 && !isWebM) {
            console.error(
                '[YTDL-RAPID] Unsupported file signature:',
                videoBuffer.subarray(0, 16).toString('hex'),
                'Content-Type:',
                contentType
            );

            return reply(
                '❌ ලැබුණු file එක MP4/WebM video එකක් බව තහවුරු කළ නොහැක.\n' +
                'GitHub Actions logs පරීක්ෂා කරන්න.'
            );
        }

        // 5. Send to WhatsApp
        await conn.sendMessage(from, {
            video: videoBuffer,
            mimetype: isMP4
                ? 'video/mp4'
                : 'video/webm',
            fileName: isMP4
                ? 'THENUVA-VIDEO.mp4'
                : 'THENUVA-VIDEO.webm',
            caption:
                '*🎬 THENUVA X MD*\n\n' +
                `📌 *Title:* ${title}\n` +
                `📦 *Size:* ${(videoBuffer.length / 1048576).toFixed(2)} MB\n` +
                '✅ *Download Complete*'
        }, {
            quoted: mek
        });

        console.log(
            '[YTDL-RAPID] Video sent successfully.'
        );

    } catch (error) {
        const status = error.response?.status;

        console.error('[YTDL-RAPID ERROR]', {
            status: status || 'Unknown',
            code: error.code || 'Unknown',
            message: error.message
        });

        if (status === 401 || status === 403) {
            return reply(
                '❌ API authorization අසාර්ථකයි. API key සහ access එක පරීක්ෂා කරන්න.'
            );
        }

        if (status === 429) {
            return reply(
                '⏳ API rate limit එකට පැමිණ ඇත. පසුව නැවත උත්සාහ කරන්න.'
            );
        }

        if (
            error.code === 'ECONNABORTED' ||
            error.code === 'ETIMEDOUT'
        ) {
            return reply(
                '⏳ Download එකට වැඩි වෙලාවක් ගත වුණා. නැවත උත්සාහ කරන්න.'
            );
        }

        if (
            error.code === 'ERR_BAD_RESPONSE' ||
            error.code === 'ERR_FR_MAX_BODY_LENGTH_EXCEEDED' ||
            error.code === 'ERR_BAD_REQUEST'
        ) {
            return reply(
                '❌ Server response එක හෝ file size එක සම්බන්ධ ගැටලුවක්.'
            );
        }

        return reply(
            '❌ Video download අසාර්ථකයි.\n' +
            String(error.message || 'Unknown error')
        );

    } finally {
        activeRequests.delete(from);
    }
});
