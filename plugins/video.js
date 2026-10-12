const axios = require('axios');
const { cmd } = require('../command');

const API_URL =
    'https://apis.davidcyril.name.ng/download/ytdl-rapid';

const activeRequests = new Set();
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

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

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return reply('❌ Invalid video URL.');
    }

    activeRequests.add(from);

    try {
        const apiKey = process.env.DAVIDCYRIL_API_KEY;

        if (!apiKey) {
            return reply(
                '❌ DAVIDCYRIL_API_KEY configure කරලා නැහැ.'
            );
        }

        await reply(
            '⏳ *THENUVA X MD*\n\n' +
            '🎬 Video එක ලබාගනිමින් පවතී...\n' +
            '📥 Download සූදානම් කරමින්...'
        );

        // 1. Get download URL from the API
        const response = await axios.get(API_URL, {
            params: {
                url: parsedUrl.href
            },
            headers: {
                'X-API-Key': apiKey,
                Accept: 'application/json'
            },
            timeout: 120000,
            maxContentLength: 2 * 1024 * 1024
        });

        const apiData = response.data;

        console.log(
            '[YTDL-RAPID] API success:',
            apiData?.success
        );

        if (apiData?.success !== true || !apiData?.data) {
            console.error(
                '[YTDL-RAPID] API returned an unsuccessful response.'
            );

            return reply(
                '❌ API එකෙන් video ලබාගත නොහැකි වුණා.\n' +
                (apiData?.message || 'API response එක පරීක්ෂා කරන්න.')
            );
        }

        const result = apiData.data;
        const downloadUrl = result.download_url;
        const title = result.title || 'THENUVA VIDEO';

        console.log('[YTDL-RAPID] Title:', title);
        console.log(
            '[YTDL-RAPID] Download URL received:',
            Boolean(downloadUrl)
        );

        if (
            typeof downloadUrl !== 'string' ||
            !/^https?:\/\//i.test(downloadUrl)
        ) {
            return reply(
                '❌ API response එකේ download URL එක වලංගු නැහැ.'
            );
        }

        // 2. Download the returned URL and follow redirects
        const fileResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 180000,
            maxContentLength: MAX_VIDEO_SIZE,
            maxBodyLength: MAX_VIDEO_SIZE,
            maxRedirects: 10,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                Accept: 'video/*, application/octet-stream, */*'
            },
            validateStatus: () => true
        });

        if (fileResponse.status === 403) {
            console.error(
                '[YTDL-RAPID] Download server returned HTTP 403.'
            );

            return reply(
                '❌ Download server එක access ප්‍රතික්ෂේප කළා (403).\n\n' +
                'API එකෙන් URL එක ලැබුණත් download server එකෙන් ' +
                'video file එක ලබාගත නොහැකියි.'
            );
        }

        if (fileResponse.status === 429) {
            return reply(
                '⏳ Server එක requests සීමා කරලා. පසුව නැවත උත්සාහ කරන්න.'
            );
        }

        if (
            fileResponse.status < 200 ||
            fileResponse.status >= 300
        ) {
            console.error(
                '[YTDL-RAPID] Download HTTP status:',
                fileResponse.status
            );

            return reply(
                `❌ Video download අසාර්ථකයි. HTTP ${fileResponse.status}`
            );
        }

        const contentType = String(
            fileResponse.headers['content-type'] || ''
        ).toLowerCase();

        const videoBuffer = Buffer.from(fileResponse.data);

        // 3. Reject HTML/JSON pages instead of sending them as videos
        const firstBytes = videoBuffer
            .subarray(0, 64)
            .toString('utf8')
            .trimStart()
            .toLowerCase();

        if (
            contentType.includes('text/html') ||
            contentType.includes('application/json') ||
            firstBytes.startsWith('<!doctype html') ||
            firstBytes.startsWith('<html') ||
            firstBytes.startsWith('{')
        ) {
            console.error(
                '[YTDL-RAPID] Server returned non-video content:',
                contentType || 'unknown'
            );

            return reply(
                '❌ Download URL එකෙන් video එක වෙනුවට webpage එකක් ලැබුණා.\n\n' +
                'API provider එකේ download URL format එක හෝ download ක්‍රමය ' +
                'තහවුරු කළ යුතුයි.'
            );
        }

        if (!videoBuffer.length) {
            return reply('❌ ලැබුණු video file එක හිස්.');
        }

        // 4. Check common MP4 and WebM signatures
        const isMP4 =
            videoBuffer.length >= 12 &&
            videoBuffer.toString('ascii', 4, 8) === 'ftyp';

        const isWebM =
            videoBuffer.length >= 4 &&
            videoBuffer.toString('hex', 0, 4) === '1a45dfa3';

        const isMP3 =
            videoBuffer.length >= 3 &&
            videoBuffer.toString('ascii', 0, 3) === 'ID3';

        if (!isMP4 && !isWebM && !isMP3) {
            console.error(
                '[YTDL-RAPID] Unknown file signature.'
            );

            return reply(
                '❌ ලැබුණු file එකේ format එක video එකක් බව තහවුරු කළ නොහැක.'
            );
        }

        if (isMP3) {
            return reply(
                '❌ API එකෙන් video එකක් වෙනුවට MP3 audio එකක් ලැබුණා.'
            );
        }

        if (isWebM) {
            console.log('[YTDL-RAPID] Received WebM video.');
        }

        // 5. Send the video to WhatsApp
        await conn.sendMessage(from, {
            video: videoBuffer,
            mimetype: isMP4 ? 'video/mp4' : 'video/webm',
            fileName: isMP4
                ? 'THENUVA-VIDEO.mp4'
                : 'THENUVA-VIDEO.webm',
            caption:
                '*🎬 THENUVA X MD*\n\n' +
                `📌 *Title:* ${title}\n` +
                `📦 *Size:* ${(videoBuffer.length / (1024 * 1024)).toFixed(2)} MB\n` +
                '✅ *Download Complete*'
        }, {
            quoted: mek
        });

        console.log(
            '[YTDL-RAPID] Video sent successfully.'
        );

    } catch (error) {
        const status = error.response?.status;
        const message =
            error.response?.data?.message ||
            error.message ||
            'Unknown error';

        console.error('[YTDL-RAPID ERROR]', {
            status: status || 'Unknown',
            message
        });

        if (status === 401 || status === 403) {
            return reply(
                '❌ API authorization failed. API key සහ access එක පරීක්ෂා කරන්න.'
            );
        }

        if (status === 429) {
            return reply(
                '⏳ API rate limit එකට පැමිණිලා. පසුව නැවත උත්සාහ කරන්න.'
            );
        }

        if (
            error.code === 'ERR_BAD_RESPONSE' ||
            error.code === 'ECONNABORTED'
        ) {
            return reply(
                '❌ Server response/timeout ගැටලුවක්. නැවත උත්සාහ කරන්න.'
            );
        }

        return reply(
            '❌ Video download අසාර්ථකයි.\n' +
            message
        );

    } finally {
        activeRequests.delete(from);
    }
});
