const axios = require('axios');
const { cmd } = require('../command');

const API_URL = 'https://apis.davidcyril.name.ng/hdvideo';

// Prevent multiple simultaneous requests in this process.
const activeRequests = new Set();

cmd({
    pattern: 'video',
    alias: ['ytvideo', 'ytmp4', 'hdvideo'],
    react: '🎬',
    desc: 'Download HD video',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {

    if (activeRequests.has(from)) {
        return reply(
            '⏳ *THENUVA X MD*\n\n' +
            'දැනට request එකක් ක්‍රියාත්මකයි. එය අවසන් වනතුරු ඉන්න.'
        );
    }

    try {
        if (!q || !q.trim()) {
            return reply(
                '🎬 *THENUVA X MD - HD VIDEO*\n\n' +
                'Video URL එකක් ලබා දෙන්න.\n\n' +
                'උදාහරණය:\n' +
                '.video https://www.youtube.com/watch?v=VIDEO_ID'
            );
        }

        const videoInput = q.trim();

        let parsedUrl;

        try {
            parsedUrl = new URL(videoInput);
        } catch {
            return reply('❌ නිවැරදි Video URL එකක් ලබා දෙන්න.');
        }

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return reply('❌ HTTP හෝ HTTPS Video URL එකක් ලබා දෙන්න.');
        }

        activeRequests.add(from);

        await reply(
            '⏳ *THENUVA X MD*\n\n' +
            '🎬 HD Video එක ලබාගනිමින් පවතී...\n' +
            'කරුණාකර රැඳී සිටින්න.'
        );

        // Optional API authorization token from config.env
        const token = process.env.DAVIDCYRIL_API_KEY;

        const headers = {
            Accept: 'application/json'
        };

        if (token) {
            headers.authorization = token;
        }

        const response = await axios.get(API_URL, {
            params: {
                url: videoInput
            },
            headers,
            timeout: 120000,
            validateStatus: () => true
        });

        const data = response.data;

        if (response.status === 429) {
            return reply(
                '⏳ *API Rate Limit Reached*\n\n' +
                'API එකෙන් requests වැඩි නිසා ප්‍රතික්ෂේප කරලා.\n' +
                'ටික වෙලාවක් ඉඳලා නැවත උත්සාහ කරන්න.'
            );
        }

        if (response.status < 200 || response.status >= 300) {
            console.error('[VIDEO API HTTP ERROR]', {
                status: response.status,
                data
            });

            return reply(
                `❌ API Error: HTTP ${response.status}\n\n` +
                'පසුව නැවත උත්සාහ කරන්න.'
            );
        }

        if (!data || data.success === false) {
            console.error('[VIDEO API ERROR]', data);

            return reply(
                '❌ *HD Video Job Failed*\n\n' +
                (data?.message || 'API එකෙන් video job එක සෑදිය නොහැකි වුණා.') +
                '\n\nපසුව නැවත උත්සාහ කරන්න.'
            );
        }

        // Search common response fields for the actual video URL.
        const urlKeys = [
            'video',
            'videoUrl',
            'video_url',
            'downloadUrl',
            'download_url',
            'download',
            'url',
            'link'
        ];

        function findVideoUrl(obj, depth = 0) {
            if (!obj || typeof obj !== 'object' || depth > 5) {
                return null;
            }

            for (const key of urlKeys) {
                const value = obj[key];

                if (
                    typeof value === 'string' &&
                    /^https?:\/\//i.test(value)
                ) {
                    return value;
                }
            }

            for (const value of Object.values(obj)) {
                if (value && typeof value === 'object') {
                    const found = findVideoUrl(value, depth + 1);

                    if (found) return found;
                }
            }

            return null;
        }

        const videoUrl = findVideoUrl(data);

        if (!videoUrl) {
            console.log(
                '[VIDEO API RESPONSE]',
                JSON.stringify(data).slice(0, 6000)
            );

            return reply(
                '⚠️ API response එක ලැබුණා. නමුත් video download URL එක හමු වුණේ නැහැ.\n\n' +
                'GitHub Actions logs වල [VIDEO API RESPONSE] පරීක්ෂා කරන්න.'
            );
        }

        const videoResponse = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: 180000,
            maxContentLength: 100 * 1024 * 1024,
            maxBodyLength: 100 * 1024 * 1024,
            validateStatus: () => true
        });

        if (videoResponse.status < 200 || videoResponse.status >= 300) {
            return reply(
                `❌ Video file එක download කරන්න බැරි වුණා. HTTP ${videoResponse.status}`
            );
        }

        const contentType =
            videoResponse.headers['content-type'] || '';

        if (
            contentType.includes('application/json') ||
            contentType.includes('text/html')
        ) {
            return reply(
                '❌ API එකෙන් video file එක වෙනුවට වෙනත් response එකක් ලැබුණා.'
            );
        }

        const videoBuffer = Buffer.from(videoResponse.data);

        if (!videoBuffer.length) {
            return reply('❌ ලැබුණු video file එක හිස්.');
        }

        await conn.sendMessage(from, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            fileName: 'THENUVA-HD-VIDEO.mp4',
            caption:
                '*🎬 THENUVA X MD*\n\n' +
                '✅ HD Video Download Complete'
        }, {
            quoted: mek
        });

    } catch (error) {
        const status = error.response?.status;
        const apiData = error.response?.data;

        console.error('[VIDEO ERROR]', {
            status: status || 'Unknown',
            message: apiData?.message || error.message
        });

        if (status === 429) {
            return reply(
                '⏳ API එක දැනට busy.\n' +
                'ටික වෙලාවක් ඉඳලා නැවත උත්සාහ කරන්න.'
            );
        }

        if (error.code === 'ECONNABORTED') {
            return reply(
                '⏱️ API request එකට වැඩි වෙලාවක් ගත වුණා. පසුව නැවත උත්සාහ කරන්න.'
            );
        }

        return reply(
            '❌ *Video Download Failed*\n\n' +
            (apiData?.message || error.message || 'Unknown error')
        );

    } finally {
        activeRequests.delete(from);
    }
});
