const axios = require('axios');
const { cmd } = require('../command');

const API_URL = 'https://apis.davidcyril.name.ng/hdvideo';

cmd({
    pattern: 'video',
    alias: ['ytvideo', 'ytmp4', 'hdvideo'],
    react: '🎬',
    desc: 'Download HD video',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(
                '🎬 *THENUVA X MD - HD VIDEO*\n\n' +
                'කරුණාකර Video URL එකක් දෙන්න.\n\n' +
                'උදාහරණය:\n.video https://youtube.com/watch?v=VIDEO_ID'
            );
        }

        if (!/^https?:\/\/\S+/i.test(q.trim())) {
            return reply('❌ නිවැරදි Video URL එකක් ලබා දෙන්න.');
        }

        await reply('⏳ *HD Video එක ලබාගනිමින් පවතී...*');

        const response = await axios.get(API_URL, {
            params: { url: q.trim() },
            timeout: 120000,
            headers: {
                Accept: 'application/json'
            }
        });

        const data = response.data;

        // Find the video URL in the API response
        const findVideoUrl = (obj) => {
            if (!obj || typeof obj !== 'object') return null;

            for (const [key, value] of Object.entries(obj)) {
                if (
                    typeof value === 'string' &&
                    /^https?:\/\//i.test(value) &&
                    /video|download|hd|url|link/i.test(key)
                ) {
                    return value;
                }

                if (value && typeof value === 'object') {
                    const found = findVideoUrl(value);
                    if (found) return found;
                }
            }

            return null;
        };

        const videoUrl = findVideoUrl(data);

        if (!videoUrl) {
            console.log('[VIDEO API RESPONSE]', JSON.stringify(data));
            return reply(
                '❌ API එකෙන් Video URL එකක් හමු වුණේ නැහැ.\n' +
                'API response එක GitHub Actions logs වලින් පරීක්ෂා කරන්න.'
            );
        }

        const videoResponse = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: 180000,
            maxContentLength: 100 * 1024 * 1024,
            maxBodyLength: 100 * 1024 * 1024
        });

        const videoBuffer = Buffer.from(videoResponse.data);

        if (!videoBuffer.length) {
            return reply('❌ Video file එක හිස්.');
        }

        await conn.sendMessage(from, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            fileName: 'THENUVA-HD-VIDEO.mp4',
            caption: '*🎬 THENUVA X MD*\n\n' +
                '✅ HD Video Download Complete'
        }, { quoted: mek });

    } catch (error) {
        console.error(
            '[VIDEO ERROR]',
            error.response?.data || error.message
        );

        return reply(
            '❌ *Video Download Failed*\n\n' +
            'API එකේ error එකක් හෝ download කිරීමේ ගැටලුවක් ඇතිවුණා.\n' +
            'වෙනත් URL එකකින් නැවත උත්සාහ කරන්න.'
        );
    }
});
