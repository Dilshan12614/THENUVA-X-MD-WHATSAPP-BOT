const { cmd } = require('../command');

const API_URL = 'https://supunofc.site/api/download/ytmp4-down';

// API key එක Railway Variables / config.env එකෙන් ගන්න.
// Hard-code කරලා තියෙන්නේ fallback එකක් විතරයි.
const API_KEY =
    process.env.YT_API_KEY || 'supun-y3t6k5ig8pdgv32j8z50usxq';

const RESOLUTIONS = ['1080p', '720p', '480p', '360p'];

function isYouTubeUrl(url) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url);
}

/**
 * Get a FRESH API response.
 *
 * The API may return temporary googlevideo URLs.
 * A cache-buster helps prevent receiving an old/expired URL.
 */
async function getApiData(youtubeUrl) {

    const cacheBuster = `${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 10)}`;

    const params = new URLSearchParams();

    params.set('url', youtubeUrl);

    if (API_KEY) {
        params.set('apikey', API_KEY);
    }

    // Prevent cached API response
    params.set('_t', cacheBuster);

    const apiUrl = `${API_URL}?${params.toString()}`;

    console.log('[YTMP4] API request:', apiUrl.replace(API_KEY, '***'));

    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/151.0.0.0 Mobile Safari/537.36',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
        }
    });

    if (!response.ok) {
        throw new Error(`API HTTP ${response.status}`);
    }

    const data = await response.json();

    if (
        !data ||
        data.success !== true ||
        !Array.isArray(data.result)
    ) {
        console.log('[YTMP4] Invalid API response:', data);
        throw new Error('API returned an invalid response');
    }

    return data;
}

/**
 * Select best available quality.
 */
function selectVideo(data) {

    for (const resolution of RESOLUTIONS) {

        const found = data.result.find(item =>
            String(item.resolution || '').toLowerCase() ===
                resolution.toLowerCase() &&
            item.downloadUrl
        );

        if (found) {
            return found;
        }
    }

    return data.result.find(item => item.downloadUrl);
}

/**
 * Download temporary video URL.
 */
async function downloadVideo(downloadUrl) {

    const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/151.0.0.0 Mobile Safari/537.36',
            'Accept': 'video/mp4,video/*,*/*;q=0.8',
            'Referer': 'https://www.youtube.com/',
            'Cache-Control': 'no-cache'
        }
    });

    if (!response.ok) {
        throw new Error(
            `Video download failed: HTTP ${response.status}`
        );
    }

    const contentType =
        response.headers.get('content-type') || '';

    console.log('[YTMP4] Content-Type:', contentType);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!buffer.length) {
        throw new Error('Downloaded video is empty');
    }

    return buffer;
}

cmd({
    pattern: 'video',
    alias: ['ytmp4', 'playvideo', 'ytvideo'],
    react: '🎬',
    desc: 'Download YouTube video as MP4',
    category: 'download',
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {

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

        const youtubeUrl = q.trim();

        if (!isYouTubeUrl(youtubeUrl)) {
            return reply(
                `❌ *Invalid YouTube URL*\n\n` +
                `Please send a valid YouTube video or Shorts URL.`
            );
        }

        await reply(
            `╭──────────●●►\n` +
            `│ 🎬 *THENUVA X MD*\n` +
            `│\n` +
            `│ ⏳ Processing video...\n` +
            `│ 🔎 Getting fresh download link...\n` +
            `╰──────────●●►`
        );

        /*
         * FIRST ATTEMPT
         */
        let data = await getApiData(youtubeUrl);

        let selected = selectVideo(data);

        if (!selected || !selected.downloadUrl) {
            throw new Error(
                'No playable MP4 download link was returned by the API.'
            );
        }

        console.log(
            `[YTMP4] Selected: ${selected.resolution} | ${selected.size}`
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

        let videoBuffer;

        try {

            /*
             * Try the fresh URL.
             */
            videoBuffer = await downloadVideo(
                selected.downloadUrl
            );

        } catch (firstError) {

            console.log(
                '[YTMP4] First download failed:',
                firstError.message
            );

            /*
             * If temporary googlevideo URL expired / returned 403,
             * request a COMPLETELY FRESH API response.
             */
            if (
                firstError.message.includes('HTTP 403') ||
                firstError.message.includes('HTTP 401') ||
                firstError.message.includes('HTTP 410')
            ) {

                await reply(
                    `🔄 *Download link expired.*\n` +
                    `Getting a fresh link...`
                );

                data = await getApiData(youtubeUrl);

                selected = selectVideo(data);

                if (!selected || !selected.downloadUrl) {
                    throw new Error(
                        'Fresh API response did not contain a download URL.'
                    );
                }

                console.log(
                    `[YTMP4] Fresh URL: ${selected.resolution} | ${selected.size}`
                );

                videoBuffer = await downloadVideo(
                    selected.downloadUrl
                );

            } else {

                throw firstError;
            }
        }

        if (!videoBuffer || !videoBuffer.length) {
            throw new Error('Video download returned no data.');
        }

        const sizeMB =
            (videoBuffer.length / 1024 / 1024).toFixed(2);

        console.log(
            `[YTMP4] Downloaded ${sizeMB} MB`
        );

        /*
         * Send MP4 to WhatsApp
         */
        await conn.sendMessage(
            from,
            {
                video: videoBuffer,
                mimetype: 'video/mp4',
                fileName:
                    `THENUVA-X-MD-${selected.resolution || 'video'}.mp4`,
                caption:
                    `╭──────────●●►\n` +
                    `│ 🎬 *THENUVA X MD*\n` +
                    `│\n` +
                    `│ ✅ *Download Complete*\n` +
                    `│\n` +
                    `│ 🎞️ Quality: ${selected.resolution || 'MP4'}\n` +
                    `│ 📦 Size: ${selected.size || sizeMB + ' MB'}\n` +
                    `│\n` +
                    `│ ⚡ Powered by THENUVA X MD\n` +
                    `╰──────────●●►`
            },
            {
                quoted: mek
            }
        );

        console.log(
            '[YTMP4] Video sent successfully.'
        );

    } catch (error) {

        console.error(
            '[YTMP4 ERROR]',
            error
        );

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
