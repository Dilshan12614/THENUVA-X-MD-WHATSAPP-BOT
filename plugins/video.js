const axios = require('axios');
const { cmd } = require('../command');

const API_URL =
    'https://apis.davidcyril.name.ng/download/ytmp4';

const activeRequests = new Set();

cmd({
    pattern: 'video',
    alias: ['ytmp4', 'ytvideo'],
    react: '🎬',
    desc: 'Download video',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    if (activeRequests.has(from)) {
        return reply('⏳ දැනට request එකක් ක්‍රියාත්මකයි.');
    }

    try {
        if (!q || !q.trim()) {
            return reply(
                '*🎬 THENUVA X MD VIDEO DOWNLOADER*\n\n' +
                'භාවිතය:\n.video VIDEO_URL'
            );
        }

        const inputUrl = q.trim();
        let parsed;

        try {
            parsed = new URL(inputUrl);
        } catch {
            return reply('❌ නිවැරදි video URL එකක් ලබා දෙන්න.');
        }

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return reply('❌ Invalid URL.');
        }

        activeRequests.add(from);

        await reply('⏳ Video එක ලබාගනිමින් පවතී...');

        const apiKey = process.env.DAVIDCYRIL_API_KEY;

        const headers = {
            Accept: 'application/json'
        };

        if (apiKey) {
            headers.authorization = apiKey;
        }

        const response = await axios.get(API_URL, {
            params: {
                url: inputUrl
            },
            headers,
            timeout: 120000,
            validateStatus: () => true
        });

        const data = response.data;

        if (response.status === 429) {
            return reply(
                '⚠️ API requests වැඩියි.\n' +
                'ටික වෙලාවක් ඉඳලා නැවත උත්සාහ කරන්න.'
            );
        }

        if (response.status < 200 || response.status >= 300) {
            console.error('[YTMP4 HTTP ERROR]', response.status, data);
            return reply(`❌ API error: HTTP ${response.status}`);
        }

        if (!data || data.success === false) {
            console.error('[YTMP4 API ERROR]', data);

            return reply(
                '❌ Video download අසාර්ථකයි.\n' +
                (data?.message || 'API එකෙන් video එක ලබාගත නොහැකි වුණා.')
            );
        }

        function findDownloadUrl(obj, depth = 0) {
            if (!obj || typeof obj !== 'object' || depth > 6) {
                return null;
            }

            const keys = [
                'download_url',
                'downloadUrl',
                'video_url',
                'videoUrl',
                'download',
                'video',
                'url',
                'link'
            ];

            for (const key of keys) {
                const value = obj[key];

                if (
                    typeof value === 'string' &&
                    /^https?:\/\//i.test(value)
                ) {
                    return value;
                }

                if (value && typeof value === 'object') {
                    const nested = findDownloadUrl(value, depth + 1);
                    if (nested) return nested;
                }
            }

            for (const value of Object.values(obj)) {
                if (value && typeof value === 'object') {
                    const nested = findDownloadUrl(value, depth + 1);
                    if (nested) return nested;
                }
            }

            return null;
        }

        const downloadUrl = findDownloadUrl(data);

        if (!downloadUrl) {
            console.log(
                '[YTMP4 RESPONSE]',
                JSON.stringify(data).slice(0, 5000)
            );

            return reply(
                '⚠️ API response එකෙන් download URL එක හමු වුණේ නැහැ.\n' +
                'GitHub Actions logs වල [YTMP4 RESPONSE] බලන්න.'
            );
        }

        const fileResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 180000,
            maxContentLength: 100 * 1024 * 1024,
            maxBodyLength: 100 * 1024 * 1024,
            validateStatus: () => true
        });

        if (fileResponse.status < 200 || fileResponse.status >= 300) {
            return reply(
                `❌ Video file download error: HTTP ${fileResponse.status}`
            );
        }

        const contentType =
            fileResponse.headers['content-type'] || '';

        if (
            contentType.includes('application/json') ||
            contentType.includes('text/html')
        ) {
            return reply('❌ API එකෙන් video file එකක් ලැබුණේ නැහැ.');
        }

        const buffer = Buffer.from(fileResponse.data);

        if (!buffer.length) {
            return reply('❌ ලැබුණු video file එක හිස්.');
        }

        await conn.sendMessage(from, {
            video: buffer,
            mimetype: 'video/mp4',
            fileName: 'THENUVA-VIDEO.mp4',
            caption:
                '*🎬 THENUVA X MD*\n\n' +
                '✅ Video download complete'
        }, {
            quoted: mek
        });

    } catch (error) {
        console.error('[YTMP4 ERROR]', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message
        });

        if (error.response?.status === 429) {
            return reply('⏳ API එක busy. පසුව නැවත උත්සාහ කරන්න.');
        }

        return reply(
            '❌ Video download අසාර්ථකයි.\n' +
            (error.response?.data?.message || error.message)
        );

    } finally {
        activeRequests.delete(from);
    }
});
