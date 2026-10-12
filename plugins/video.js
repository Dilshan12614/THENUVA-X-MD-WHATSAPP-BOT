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
        return reply(
            '⏳ දැනට video request එකක් ක්‍රියාත්මකයි.'
        );
    }

    try {
        if (!q || !q.trim()) {
            return reply(
                '*🎬 THENUVA X MD VIDEO DOWNLOADER*\n\n' +
                'Video URL එකක් ලබා දෙන්න.\n\n' +
                'උදාහරණය:\n' +
                '.video https://www.youtube.com/watch?v=VIDEO_ID'
            );
        }

        const inputUrl = q.trim();
        let parsedUrl;

        try {
            parsedUrl = new URL(inputUrl);
        } catch {
            return reply('❌ නිවැරදි video URL එකක් ලබා දෙන්න.');
        }

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return reply('❌ Invalid video URL.');
        }

        activeRequests.add(from);

        await reply(
            '⏳ *THENUVA X MD*\n\n' +
            '🎬 Video එක ලබාගනිමින් පවතී...\n' +
            'කරුණාකර රැඳී සිටින්න.'
        );

        // Optional API key from GitHub Actions secrets
        const apiKey = process.env.DAVIDCYRIL_API_KEY;

        const apiHeaders = {
            Accept: 'application/json',
            'User-Agent': 'Mozilla/5.0'
        };

        if (apiKey) {
            apiHeaders.authorization = apiKey;
        }

        // Request video information
        const response = await axios.get(API_URL, {
            params: {
                url: inputUrl
            },
            headers: apiHeaders,
            timeout: 120000,
            validateStatus: () => true
        });

        const data = response.data;

        if (response.status === 429) {
            return reply(
                '⏳ *API Rate Limit Reached*\n\n' +
                'API එක requests වැඩි නිසා ප්‍රතික්ෂේප කරලා.\n' +
                'ටික වෙලාවක් ඉඳලා නැවත උත්සාහ කරන්න.'
            );
        }

        if (response.status === 401 || response.status === 403) {
            return reply(
                `❌ API authorization error: HTTP ${response.status}\n\n` +
                'API key එකක් අවශ්‍යද සහ එහි නිවැරදි format එක කුමක්දැයි පරීක්ෂා කරන්න.'
            );
        }

        if (response.status < 200 || response.status >= 300) {
            console.error('[YTMP4 HTTP ERROR]', {
                status: response.status,
                data
            });

            return reply(`❌ API Error: HTTP ${response.status}`);
        }

        if (!data || data.success === false) {
            console.error('[YTMP4 API ERROR]', data);

            return reply(
                '❌ Video download අසාර්ථකයි.\n' +
                (data?.message || 'API එකෙන් video එක ලබාගත නොහැකි වුණා.')
            );
        }

        // Find a download URL in common response formats
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
            }

            for (const value of Object.values(obj)) {
                if (value && typeof value === 'object') {
                    const found = findDownloadUrl(value, depth + 1);
                    if (found) return found;
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
                '⚠️ API response එක ලැබුණා, නමුත් video URL එක හමු වුණේ නැහැ.\n' +
                'GitHub Actions logs වල [YTMP4 RESPONSE] බලන්න.'
            );
        }

        // Download the actual video file
        const fileResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 180000,
            headers: {
                Accept: '*/*',
                'User-Agent': 'Mozilla/5.0'
            },
            maxContentLength: 100 * 1024 * 1024,
            maxBodyLength: 100 * 1024 * 1024,
            validateStatus: () => true
        });

        if (fileResponse.status === 403) {
            console.error('[YTMP4 FILE 403]', {
                contentType: fileResponse.headers['content-type'],
                urlHost: (() => {
                    try {
                        return new URL(downloadUrl).host;
                    } catch {
                        return 'unknown';
                    }
                })()
            });

            return reply(
                '❌ *Video File Access Denied (403)*\n\n' +
                'API එකෙන් ලැබුණු download URL එකට access ප්‍රතික්ෂේප කරලා.\n\n' +
                'හේතුව expired URL එකක් හෝ අවශ්‍ය authorization/header එකක් නොමැති වීම විය හැකියි.\n' +
                'API documentation එකෙන් download request එකේ අවශ්‍ය headers පරීක්ෂා කරන්න.'
            );
        }

        if (fileResponse.status === 429) {
            return reply(
                '⏳ Video server එක requests සීමා කරලා.\n' +
                'ටික වෙලාවක් ඉඳලා නැවත උත්සාහ කරන්න.'
            );
        }

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
            return reply(
                '❌ Video file එක වෙනුවට වෙනත් response එකක් ලැබුණා.'
            );
        }

        const videoBuffer = Buffer.from(fileResponse.data);

        if (!videoBuffer.length) {
            return reply('❌ ලැබුණු video file එක හිස්.');
        }

        await conn.sendMessage(from, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            fileName: 'THENUVA-VIDEO.mp4',
            caption:
                '*🎬 THENUVA X MD*\n\n' +
                '✅ Video download complete'
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

        if (status === 429) {
            return reply(
                '⏳ API එක busy. ටික වෙලාවක් ඉඳලා නැවත උත්සාහ කරන්න.'
            );
        }

        return reply(
            '❌ *Video Download Failed*\n\n' +
            (message || 'Unknown error')
        );

    } finally {
        activeRequests.delete(from);
    }
});
