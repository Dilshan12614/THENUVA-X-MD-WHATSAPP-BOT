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
            '📺 Video Downloader\n\n' +
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

        // 1. Request video information from ytdl-rapid
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
                '[YTDL-RAPID] API error:',
                apiData?.message || 'Invalid response'
            );

            return reply(
                '❌ API එකෙන් video විස්තර ලබාගත නොහැකි වුණා.\n' +
                (apiData?.message || 'API response එක පරීක්ෂා කරන්න.')
            );
        }

        const result = apiData.data;
        const downloadUrl = result.download_url;
        const title = result.title || 'THENUVA VIDEO';

        console.log('[YTDL-RAPID] Title:', title);
        console.log('[YTDL-RAPID] Download URL received:', Boolean(downloadUrl));

        if (
            typeof downloadUrl !== 'string' ||
            !/^https?:\/\//i.test(downloadUrl)
        ) {
            return reply(
                '❌ API response එකේ download URL එක වලංගු නැහැ.'
            );
        }

        // 2. Download the video returned by the API
        const fileResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 180000,
            maxContentLength: MAX_VIDEO_SIZE,
            maxBodyLength: MAX_VIDEO_SIZE,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                Accept: 'video/mp4,video/*,application/octet-stream,*/*'
            },
            validateStatus: () => true
        });

        if (fileResponse.status === 403) {
            const contentType =
                fileResponse.headers['content-type'] || 'unknown';

            console.error(
                '[YTDL-RAPID] Download HTTP 403. Content-Type:',
                contentType
            );

            return reply(
                '❌ Download server එක HTTP 403 ලබා දුන්නා.\n\n' +
                'API request එක සාර්ථකයි, නමුත් video server එකෙන් ' +
                'file එක ලබාගැනීමට අවසර ලැබුණේ නැහැ.\n' +
                'නැවුම් download URL එකක් ලබාගෙන නැවත උත්සාහ කරන්න.'
            );
        }

        if (fileResponse.status === 429) {
            return reply(
                '⏳ Requests වැඩි නිසා server එක තාවකාලිකව සීමා කරලා. පසුව උත්සාහ කරන්න.'
            );
        }

        if (fileResponse.status < 200 || fileResponse.status >= 300) {
            console.error(
                '[YTDL-RAPID] Download HTTP status:',
                fileResponse.status
            );

            return reply(
                `❌ Video download අසාර්ථකයි. HTTP ${fileResponse.status}`
            );
        }

        const contentType =
            fileResponse.headers['content-type'] || '';

        const videoBuffer = Buffer.from(fileResponse.data);

        if (
            contentType.includes('application/json') ||
            contentType.includes('text/html') ||
            contentType.startsWith('text/plain')
        ) {
            console.error(
                '[YTDL-RAPID] Server returned non-video content:',
                contentType
            );

            return reply(
                '❌ Video file එක වෙනුවට server error response එකක් ලැබුණා.'
            );
        }

        if (!videoBuffer.length) {
            return reply('❌ Download කළ video file එක හිස්.');
        }

        if (videoBuffer.length > MAX_VIDEO_SIZE) {
            return reply(
                '❌ Video file එක 100 MB සීමාව ඉක්මවා තිබෙනවා.'
            );
        }

        // 3. Send video to WhatsApp
        await conn.sendMessage(from, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            fileName: 'THENUVA-VIDEO.mp4',
            caption:
                '*🎬 THENUVA X MD*\n\n' +
                `📌 *Title:* ${title}\n` +
                `📦 *Size:* ${(videoBuffer.length / (1024 * 1024)).toFixed(2)} MB\n` +
                '✅ *Download Complete*'
        }, {
            quoted: mek
        });

        console.log(
            '[YTDL-RAPID] Video sent successfully:',
            title
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
                '❌ API authorization failed. API key එක සහ API access එක පරීක්ෂා කරන්න.'
            );
        }

        if (status === 429) {
            return reply(
                '⏳ API rate limit එකට පැමිණිලා. පසුව නැවත උත්සාහ කරන්න.'
            );
        }

        if (error.code === 'ERR_BAD_RESPONSE') {
            return reply(
                '❌ Server response එකේ ගැටලුවක් තියෙනවා. නැවත උත්සාහ කරන්න.'
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
