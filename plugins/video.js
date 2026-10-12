const axios = require('axios');
const { cmd } = require('../command');

const API_URL =
    'https://apis.davidcyril.name.ng/download/ytmp4';

const activeRequests = new Set();

cmd({
    pattern: 'video',
    alias: ['ytmp4', 'ytvideo', 'hdvideo'],
    react: '🎬',
    desc: 'Download 360p video',
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
            '📺 Quality: 360p\n\n' +
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
                '❌ DAVIDCYRIL_API_KEY එක configure කරලා නැහැ.'
            );
        }

        await reply(
            '⏳ *THENUVA X MD*\n\n' +
            '🎬 Video එක ලබාගනිමින් පවතී...\n' +
            '📺 Quality: 360p'
        );

        // Request 360p video from the API
        const response = await axios.get(API_URL, {
            params: {
                url: parsedUrl.href,
                quality: '360p'
            },
            headers: {
                'X-API-Key': apiKey,
                Accept: 'application/json'
            },
            timeout: 120000
        });

        const data = response.data;

        if (!data || data.success !== true || !data.result) {
            console.error('[YTMP4 API ERROR]', data);

            return reply(
                '❌ Video download අසාර්ථකයි.\n' +
                (data?.message || 'API එකෙන් video එක ලබාගත නොහැකි වුණා.')
            );
        }

        const result = data.result;
        const downloadUrl = result.download_url;

        if (
            typeof downloadUrl !== 'string' ||
            !/^https?:\/\//i.test(downloadUrl)
        ) {
            return reply(
                '❌ API response එකේ download URL එක හමු වුණේ නැහැ.'
            );
        }

        console.log('[YTMP4] Title:', result.title);
        console.log('[YTMP4] Returned quality:', result.quality);

        // Download the MP4 immediately; signed URLs can expire.
        const fileResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 180000,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                Accept: '*/*',
                Referer: 'https://www.youtube.com/'
            },
            maxContentLength: 100 * 1024 * 1024,
            maxBodyLength: 100 * 1024 * 1024,
            validateStatus: () => true
        });

        if (fileResponse.status === 403) {
            console.error('[YTMP4] Download server returned HTTP 403');

            return reply(
                '❌ Video server එක access ප්‍රතික්ෂේප කළා (403).\n\n' +
                'API එකෙන් ලැබුණු download URL එකට access අවසර නැති විය හැකියි.'
            );
        }

        if (fileResponse.status === 429) {
            return reply(
                '⏳ API rate limit එකට පැමිණිලා. පසුව නැවත උත්සාහ කරන්න.'
            );
        }

        if (fileResponse.status < 200 || fileResponse.status >= 300) {
            return reply(
                `❌ Video download failed: HTTP ${fileResponse.status}`
            );
        }

        const contentType =
            fileResponse.headers['content-type'] || '';

        if (
            contentType.includes('application/json') ||
            contentType.includes('text/html') ||
            contentType.startsWith('text/plain')
        ) {
            return reply(
                '❌ Video file එක වෙනුවට error response එකක් ලැබුණා.'
            );
        }

        const videoBuffer = Buffer.from(fileResponse.data);

        if (!videoBuffer.length) {
            return reply('❌ Video file එක හිස්.');
        }

        await conn.sendMessage(from, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            fileName: 'THENUVA-360P-VIDEO.mp4',
            caption:
                '*🎬 THENUVA X MD*\n\n' +
                `📌 *Title:* ${result.title || 'Video'}\n` +
                `📺 *Quality:* ${result.quality || 'API selected'}\n` +
                '✅ *Download Complete*'
        }, {
            quoted: mek
        });

    } catch (error) {
        const status = error.response?.status;
        const message =
            error.response?.data?.message || error.message;

        console.error('[YTMP4 ERROR]', {
            status: status || 'Unknown',
            message
        });

        if (status === 401 || status === 403) {
            return reply(
                '❌ API authorization failed. API key එක පරීක්ෂා කරන්න.'
            );
        }

        if (status === 429) {
            return reply(
                '⏳ API එක දැනට busy. පසුව නැවත උත්සාහ කරන්න.'
            );
        }

        return reply(
            '❌ Video download අසාර්ථකයි.\n' +
            (message || 'Unknown error')
        );

    } finally {
        activeRequests.delete(from);
    }
});
