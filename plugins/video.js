const axios = require('axios');
const { cmd } = require('../command');
const config = require('../config');

const API_BASE = 'https://sasa-dev-api.xyz/api/yt/mp4-dl';

// API key එක config එකෙන් ගන්න
const API_KEY =
    process.env.SASA_API_KEY ||
    config.SASA_API_KEY ||
    '';

function getYouTubeUrl(text = '') {
    const match = text.match(
        /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[\w-]+|youtu\.be\/[\w-]+|youtube\.com\/shorts\/[\w-]+)/i
    );

    return match ? match[0] : null;
}

function cleanFileName(text = '') {
    return text
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80) || 'youtube-video';
}

async function downloadVideo(videoUrl, quality) {
    const apiUrl = `${API_BASE}?` +
        new URLSearchParams({
            apikey: API_KEY,
            url: videoUrl,
            quality: String(quality),
            raw: '1'
        }).toString();

    console.log(`[YTMP4] Requesting ${quality}p`);

    const response = await axios.get(apiUrl, {
        responseType: 'arraybuffer',
        maxRedirects: 5,
        timeout: 120000,
        headers: {
            'User-Agent': 'Mozilla/5.0'
        },
        validateStatus: status => status >= 200 && status < 400
    });

    const contentType =
        response.headers['content-type'] ||
        response.headers['Content-Type'] ||
        '';

    // API එක direct MP4 redirect කළා නම්
    if (
        contentType.includes('video/') ||
        contentType.includes('application/octet-stream')
    ) {
        return {
            buffer: Buffer.from(response.data),
            contentType
        };
    }

    // JSON response එකක් ආවොත් download URL එක extract කරන්න
    let data;

    try {
        const text = Buffer.from(response.data).toString('utf8');
        data = JSON.parse(text);
    } catch {
        throw new Error(`API returned an unsupported response for ${quality}p`);
    }

    const downloadUrl =
        data?.downloadUrl ||
        data?.url ||
        data?.result?.downloadUrl ||
        data?.result?.url ||
        data?.result?.download ||
        data?.data?.downloadUrl ||
        data?.data?.url;

    if (!downloadUrl) {
        throw new Error(
            data?.message ||
            data?.error ||
            `No download URL returned for ${quality}p`
        );
    }

    console.log(`[YTMP4] Download URL received for ${quality}p`);

    const videoResponse = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        maxRedirects: 5,
        timeout: 180000,
        headers: {
            'User-Agent': 'Mozilla/5.0'
        }
    });

    return {
        buffer: Buffer.from(videoResponse.data),
        contentType:
            videoResponse.headers['content-type'] || 'video/mp4'
    };
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

        if (!API_KEY) {
            return reply(
                '❌ *SASA API KEY NOT SET*\n\n' +
                'Add this Railway variable:\n' +
                '`SASA_API_KEY=YOUR_API_KEY`'
            );
        }

        const input = q || '';

        const videoUrl = getYouTubeUrl(input);

        if (!videoUrl) {
            return reply(
                '❌ *YouTube URL එකක් දෙන්න.*\n\n' +
                `Example:\n${config.PREFIX}video https://youtu.be/xxxxxxxx`
            );
        }

        await reply(
            '⏳ *Downloading YouTube Video...*\n\n' +
            '🎬 Preparing MP4...\n' +
            '📺 Quality: *720p*\n' +
            '⚡ Please wait...'
        );

        const qualities = [720, 480, 360];

        let result = null;
        let selectedQuality = null;
        let lastError = null;

        for (const quality of qualities) {
            try {
                result = await downloadVideo(videoUrl, quality);

                if (result?.buffer?.length > 1000) {
                    selectedQuality = quality;
                    break;
                }

            } catch (error) {
                lastError = error;
                console.error(
                    `[YTMP4] ${quality}p failed:`,
                    error?.message || error
                );
            }
        }

        if (!result || !result.buffer || result.buffer.length < 1000) {
            return reply(
                '❌ *VIDEO DOWNLOAD FAILED*\n\n' +
                '720p / 480p / 360p වලින් video එක ලබාගන්න බැරි වුණා.\n\n' +
                `Error: ${lastError?.message || 'Unknown error'}`
            );
        }

        const fileName =
            `CYBER-XMD_${Date.now()}_${selectedQuality}p.mp4`;

        console.log(
            `[YTMP4] Sending ${selectedQuality}p | ` +
            `${(result.buffer.length / 1024 / 1024).toFixed(2)} MB`
        );

        await conn.sendMessage(
            from,
            {
                video: result.buffer,
                mimetype: 'video/mp4',
                fileName,
                caption:
                    `╭───────────────●●►\n` +
                    `│ 🎬 *CYBER XMD*\n` +
                    `├───────────────●●►\n` +
                    `│ 📺 Quality : *${selectedQuality}p*\n` +
                    `│ 🎞️ Format : *MP4*\n` +
                    `│ ⚡ Powered by : *SASA DEV API*\n` +
                    `╰───────────────●●►`
            },
            {
                quoted: mek
            }
        );

    } catch (error) {

        console.error('[YTMP4 ERROR]', error);

        return reply(
            '❌ *YOUTUBE DOWNLOAD ERROR*\n\n' +
            `${error?.message || error}`
        );
    }
});
