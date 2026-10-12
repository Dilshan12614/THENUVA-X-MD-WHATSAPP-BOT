const axios = require('axios');
const { cmd } = require('../command');

const API_URL =
    'https://apis.davidcyril.name.ng/download/ytdl-rapid';

const activeRequests = new Set();
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

function findDownloadUrl(data) {
    const seen = new Set();

    function scan(value, depth = 0) {
        if (!value || depth > 6) return null;

        if (typeof value === 'string') {
            if (
                /^https?:\/\//i.test(value) &&
                /\.(mp4|webm)(?:[?#]|$)/i.test(value)
            ) {
                return value;
            }
            return null;
        }

        if (typeof value !== 'object') return null;
        if (seen.has(value)) return null;
        seen.add(value);

        const preferredKeys = [
            'download_url',
            'downloadUrl',
            'video_url',
            'videoUrl',
            'url',
            'link',
            'download',
            'video',
            'links',
            'formats',
            'data',
            'result'
        ];

        for (const key of preferredKeys) {
            if (value[key] !== undefined) {
                const found = scan(value[key], depth + 1);
                if (found) return found;
            }
        }

        for (const [key, item] of Object.entries(value)) {
            if (preferredKeys.includes(key)) continue;
            const found = scan(item, depth + 1);
            if (found) return found;
        }

        return null;
    }

    return scan(data);
}

cmd({
    pattern: 'video',
    alias: ['ytmp4', 'ytvideo', 'hdvideo'],
    react: '🎬',
    desc: 'Download video',
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
            'භාවිතය: .video VIDEO_URL'
        );
    }

    let parsedUrl;

    try {
        parsedUrl = new URL(q.trim());
    } catch {
        return reply('❌ නිවැරදි video URL එකක් ලබා දෙන්න.');
    }

    if (
        !['http:', 'https:'].includes(parsedUrl.protocol) ||
        !['youtube.com', 'www.youtube.com', 'm.youtube.com',
           'youtu.be', 'www.youtu.be'].includes(parsedUrl.hostname)
    ) {
        return reply('❌ වලංගු YouTube URL එකක් ලබා දෙන්න.');
    }

    activeRequests.add(from);

    try {
        const apiKey = process.env.DAVIDCYRIL_API_KEY;

        if (!apiKey) {
            return reply(
                '❌ DAVIDCYRIL_API_KEY environment variable එක සකසා නැහැ.'
            );
        }

        await reply(
            '⏳ *THENUVA X MD*\n\n' +
            '🎬 Video එක ලබාගනිමින් පවතී...\n' +
            '📥 කරුණාකර රැඳී සිටින්න.'
        );

        const response = await axios.get(API_URL, {
            params: { url: parsedUrl.href },
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
            '[YTDL-RAPID] Response:',
            JSON.stringify(apiData).slice(0, 3000)
        );

        if (!apiData || typeof apiData !== 'object') {
            return reply('❌ API එකෙන් නිවැරදි JSON response එකක් ලැබුණේ නැහැ.');
        }

        if (apiData.success === false) {
            return reply(
                '❌ API download අසාර්ථකයි.\n' +
                String(apiData.message || 'Video එක ලබාගත නොහැක.')
            );
        }

        const result = apiData.data || apiData.result || apiData;
        const downloadUrl = findDownloadUrl(result);
        const title = String(
            result.title || apiData.title || 'THENUVA VIDEO'
        ).slice(0, 180);

        if (!downloadUrl) {
            console.error(
                '[YTDL-RAPID] No direct MP4/WebM URL found.'
            );

            return reply(
                '❌ API response එකේ හඳුනාගත හැකි MP4/WebM download URL එකක් නැහැ.\n\n' +
                'Railway logs වල [YTDL-RAPID] Response බලන්න. ' +
                'API එක වෙනස් field එකක URL එකක් දෙනවා නම් ඒ අනුව සකස් කළ යුතුයි.'
            );
        }

        const target = new URL(downloadUrl);

        if (!['http:', 'https:'].includes(target.protocol)) {
            return reply('❌ Download URL protocol එක වලංගු නැහැ.');
        }

        const fileResponse = await axios.get(target.href, {
            responseType: 'arraybuffer',
            timeout: 180000,
            maxContentLength: MAX_VIDEO_SIZE,
            maxBodyLength: MAX_VIDEO_SIZE,
            maxRedirects: 10,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                Accept: 'video/mp4, video/webm, application/octet-stream'
            },
            validateStatus: status => status >= 200 && status < 300
        });

        const contentType = String(
            fileResponse.headers['content-type'] || ''
        ).toLowerCase();

        const videoBuffer = Buffer.from(fileResponse.data || []);

        if (!videoBuffer.length) {
            return reply('❌ Download කළ file එක හිස්.');
        }

        if (videoBuffer.length > MAX_VIDEO_SIZE) {
            return reply('❌ Video එක 100 MB සීමාව ඉක්මවා ඇත.');
        }

        const start = videoBuffer
            .subarray(0, 512)
            .toString('utf8')
            .trimStart()
            .toLowerCase();

        if (
            contentType.includes('text/html') ||
            contentType.includes('application/json') ||
            start.startsWith('<!doctype html') ||
            start.startsWith('<html') ||
            start.startsWith('{')
        ) {
            console.error(
                '[YTDL-RAPID] Non-video response:',
                contentType
            );

            return reply(
                '❌ Download URL එකෙන් video file එකක් වෙනුවට webpage/API response එකක් ලැබුණා.\n\n' +
                'මෙය API provider එකේ download link එක හෝ access එක සම්බන්ධ ගැටලුවක් විය හැකියි.'
            );
        }

        const isMP4 =
            videoBuffer.length >= 12 &&
            videoBuffer.toString('ascii', 4, 8) === 'ftyp';

        const isWebM =
            videoBuffer.length >= 4 &&
            videoBuffer.toString('hex', 0, 4) === '1a45dfa3';

        if (!isMP4 && !isWebM) {
            console.error(
                '[YTDL-RAPID] Unknown file signature:',
                contentType,
                videoBuffer.subarray(0, 16).toString('hex')
            );

            return reply(
                '❌ ලැබුණු file එක MP4/WebM video එකක් බව තහවුරු කළ නොහැක.'
            );
        }

        await conn.sendMessage(from, {
            video: videoBuffer,
            mimetype: isMP4 ? 'video/mp4' : 'video/webm',
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
                '❌ API/download server access ප්‍රතික්ෂේප කළා. API key සහ අවසර පරීක්ෂා කරන්න.'
            );
        }

        if (status === 429) {
            return reply(
                '⏳ Requests සීමාවට පැමිණ ඇත. පසුව නැවත උත්සාහ කරන්න.'
            );
        }

        if (error.code === 'ERR_BAD_RESPONSE') {
            return reply(
                '❌ Server එකෙන් වැරදි response එකක් ලැබුණා.'
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

        if (error.response) {
            return reply(
                `❌ Download අසාර්ථකයි. HTTP ${status || 'Error'}`
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
