const { cmd } = require('../command');

const API_URL = 'https://supunofc.site/api/download/ytmp4-down';
const API_KEY = process.env.YT_API_KEY || '';

// Preferred → fallback resolutions
const RESOLUTIONS = ['1080p', '720p', '480p', '360p'];

function isYouTubeUrl(url) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url);
}

cmd({
    pattern: 'video',
    alias: ['ytmp4', 'playvideo', 'ytvideo'],
    react: '🎬',
    desc: 'Download YouTube video as MP4',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {

    try {

        if (!q) {
            return reply(
                `╭──────────●●►\n` +
                `│ 🎬 *THENUVA X MD*\n` +
                `│\n` +
                `│ Use:\n` +
                `│ .video <YouTube URL>\n` +
                `│\n` +
                `│ Example:\n` +
                `│ .video https://youtu.be/xxxx\n` +
                `╰──────────●●►`
            );
        }

        if (!isYouTubeUrl(q.trim())) {
            return reply('❌ Please send a valid YouTube URL.');
        }

        const youtubeUrl = q.trim();

        await reply(
            `╭──────────●●►\n` +
            `│ 🎬 *THENUVA X MD*\n` +
            `│\n` +
            `│ ⏳ Processing video...\n` +
            `│ 🔎 Getting download link...\n` +
            `╰──────────●●►`
        );

        // Build API URL
        const apiUrl =
            `${API_URL}?url=${encodeURIComponent(youtubeUrl)}` +
            (API_KEY ? `&apikey=${encodeURIComponent(API_KEY)}` : '');

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        if (!response.ok) {
            throw new Error(`API HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data || data.success !== true || !Array.isArray(data.result)) {
            console.log('YT API Response:', data);
            return reply(
                `❌ *Download failed*\n\n` +
                `The YouTube API did not return a valid video.`
            );
        }

        /*
         * Find the best available resolution.
         * 1080p → 720p → 480p → 360p
         */
        let selected = null;

        for (const resolution of RESOLUTIONS) {
            selected = data.result.find(
                item =>
                    String(item.resolution).toLowerCase() ===
                    resolution.toLowerCase() &&
                    item.downloadUrl
            );

            if (selected) break;
        }

        // If preferred resolutions are unavailable,
        // use the first valid result.
        if (!selected) {
            selected = data.result.find(item => item.downloadUrl);
        }

        if (!selected || !selected.downloadUrl) {
            return reply(
                `❌ No playable MP4 download link was returned by the API.`
            );
        }

        console.log(
            `[YTMP4] Resolution: ${selected.resolution} | Size: ${selected.size}`
        );

        await reply(
            `╭──────────●●►\n` +
            `│ 🎬 *THENUVA X MD*\n` +
            `│\n` +
            `│ ✅ Video found\n` +
            `│ 🎞️ Quality: ${selected.resolution}\n` +
            `│ 📦 Size: ${selected.size || 'Unknown'}\n` +
            `│\n` +
            `│ ⬇️ Downloading...\n` +
            `╰──────────●●►`
        );

        /*
         * Fetch the temporary googlevideo download URL.
         * We download it ourselves so the temporary URL does not
         * need to remain valid while WhatsApp processes it.
         */
        const videoResponse = await fetch(selected.downloadUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'video/mp4,*/*'
            }
        });

        if (!videoResponse.ok) {
            throw new Error(
                `Video download failed: HTTP ${videoResponse.status}`
            );
        }

        const contentType =
            videoResponse.headers.get('content-type') || 'video/mp4';

        if (!contentType.includes('video') && !contentType.includes('octet')) {
            console.log('Unexpected content type:', contentType);
        }

        const arrayBuffer = await videoResponse.arrayBuffer();
        const videoBuffer = Buffer.from(arrayBuffer);

        if (!videoBuffer.length) {
            throw new Error('Downloaded video is empty.');
        }

        console.log(
            `[YTMP4] Downloaded ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`
        );

        await conn.sendMessage(
            from,
            {
                video: videoBuffer,
                mimetype: 'video/mp4',
                fileName: `THENUVA-X-MD-${selected.resolution || 'video'}.mp4`,
                caption:
                    `╭──────────●●►\n` +
                    `│ 🎬 *THENUVA X MD*\n` +
                    `│\n` +
                    `│ 🎞️ Quality: ${selected.resolution || 'MP4'}\n` +
                    `│ 📦 Size: ${selected.size || 'Unknown'}\n` +
                    `│\n` +
                    `│ ⚡ Powered by THENUVA X MD\n` +
                    `╰──────────●●►`
            },
            { quoted: mek }
        );

        console.log('[YTMP4] Video sent successfully.');

    } catch (error) {

        console.error('[YTMP4 ERROR]', error);

        return reply(
            `╭──────────●●►\n` +
            `│ ❌ *DOWNLOAD ERROR*\n` +
            `│\n` +
            `│ ${error.message || 'Unknown error'}\n` +
            `│\n` +
            `│ Please try another YouTube video.\n` +
            `╰──────────●●►`
        );
    }
});
