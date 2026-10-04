const { cmd } = require('../command');
const config = require('../config');

const API_URL =
    'https://mr-thinuzz-api-build.vercel.app/api/ytmp4v3/download-all';

// API key:
// Railway Variables → MR_THINUZZ_API_KEY
// config.env → MR_THINUZZ_API_KEY
const API_KEY =
    process.env.MR_THINUZZ_API_KEY ||
    config.MR_THINUZZ_API_KEY ||
    'key_62cb6c23a4c8cca270dd510983b195b9';

function extractYouTubeUrl(text) {
    if (!text) return null;

    const match = text.match(
        /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)[^\s]+|youtu\.be\/[^\s]+)/i
    );

    return match
        ? match[0].replace(/[)>.,]+$/, '')
        : null;
}

function cleanFilename(name) {
    return String(name || 'THENUVA-X-MD.mp4')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .trim()
        .slice(0, 150) || 'THENUVA-X-MD.mp4';
}

function formatSize(bytes) {
    if (!bytes || isNaN(bytes)) {
        return 'Unknown';
    }

    const mb = bytes / 1024 / 1024;

    if (mb >= 1024) {
        return `${(mb / 1024).toFixed(2)} GB`;
    }

    return `${mb.toFixed(2)} MB`;
}

async function requestAPI(youtubeUrl) {
    const params = new URLSearchParams();

    params.set('url', youtubeUrl);

    if (API_KEY) {
        params.set('apiKey', API_KEY);
    }

    const endpoint =
        `${API_URL}?${params.toString()}`;

    console.log(
        '[YTMP4] Request:',
        API_KEY
            ? `${API_URL}?url=...&apiKey=***`
            : `${API_URL}?url=...`
    );

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
            'Accept': 'application/json'
        },
        redirect: 'follow'
    });

    const text = await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch (error) {
        throw new Error(
            `API returned invalid JSON. HTTP ${response.status}`
        );
    }

    if (!response.ok) {
        throw new Error(
            data?.error ||
            `API HTTP ${response.status}`
        );
    }

    return data;
}

async function downloadVideo(videoUrl) {
    console.log(
        '[YTMP4] Downloading video...'
    );

    const response = await fetch(videoUrl, {
        method: 'GET',
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
            'Accept':
                'video/mp4,video/*,*/*'
        },
        redirect: 'follow'
    });

    if (!response.ok) {
        throw new Error(
            `Video download failed: HTTP ${response.status}`
        );
    }

    const buffer = Buffer.from(
        await response.arrayBuffer()
    );

    if (!buffer.length) {
        throw new Error(
            'Video file is empty.'
        );
    }

    return {
        buffer,
        contentType:
            response.headers.get(
                'content-type'
            ) || 'video/mp4'
    };
}

cmd(
    {
        pattern: 'video',
        alias: [
            'ytmp4',
            'playvideo',
            'mp4'
        ],
        react: '🎬',
        desc: 'Download YouTube video as MP4',
        category: 'download',
        filename: __filename
    },

    async (
        conn,
        mek,
        m,
        {
            from,
            body,
            args,
            reply
        }
    ) => {
        try {

            // ─────────────────────────
            // GET YOUTUBE URL
            // ─────────────────────────

            const input =
                args && args.length
                    ? args.join(' ').trim()
                    : body
                        ? body.replace(
                              /^\.?(video|ytmp4|playvideo|mp4)\s*/i,
                              ''
                          ).trim()
                        : '';

            const youtubeUrl =
                extractYouTubeUrl(input);

            if (!youtubeUrl) {
                return reply(
                    '╭──────────●●►\n' +
                    '│ ❌ *INVALID YOUTUBE URL*\n' +
                    '│\n' +
                    '│ Example:\n' +
                    '│ `.video https://youtu.be/VIDEO_ID`\n' +
                    '╰──────────●●►'
                );
            }

            // ─────────────────────────
            // API KEY CHECK
            // ─────────────────────────

            if (!API_KEY) {
                return reply(
                    '╭──────────●●►\n' +
                    '│ ❌ *API KEY NOT CONFIGURED*\n' +
                    '│\n' +
                    '│ Add `MR_THINUZZ_API_KEY`\n' +
                    '│ to config.env / Railway Variables.\n' +
                    '╰──────────●●►'
                );
            }

            // ─────────────────────────
            // SEARCH
            // ─────────────────────────

            await reply(
                '╭──────────●●►\n' +
                '│ 🎬 *THENUVA X MD MP4*\n' +
                '│\n' +
                '│ 🔎 Searching YouTube...\n' +
                '│ ▰▱▱▱▱ 20%\n' +
                '╰──────────●●►'
            );

            // ─────────────────────────
            // API REQUEST
            // ─────────────────────────

            const api =
                await requestAPI(
                    youtubeUrl
                );

            console.log(
                '[YTMP4] API status:',
                api?.status
            );

            // ─────────────────────────
            // API ERROR
            // ─────────────────────────

            if (!api?.status) {

                let message =
                    api?.error ||
                    'MP4 download failed.';

                if (
                    api?.is_verified === false
                ) {
                    message +=
                        '\n\n⚠️ API verification required.';
                }

                if (
                    api?.coins_remaining !== undefined
                ) {
                    message +=
                        `\n💰 Coins: ${api.coins_remaining}`;
                }

                return reply(
                    '╭──────────●●►\n' +
                    '│ ❌ *YTMP4 API ERROR*\n' +
                    '│\n' +
                    `│ ${message}\n` +
                    '╰──────────●●►'
                );
            }

            // ─────────────────────────
            // GET DATA
            // ─────────────────────────

            const data =
                api.data || {};

            const title =
                data.title ||
                'YouTube Video';

            const thumbnail =
                data.thumbnail ||
                null;

            const duration =
                data.duration ||
                'N/A';

            const quality =
                data.quality_found ||
                'MP4';

            const videoUrl =
                data.links?.video;

            const originalFilename =
                data.filename ||
                `${title}.mp4`;

            if (!videoUrl) {
                return reply(
                    '╭──────────●●►\n' +
                    '│ ❌ *VIDEO LINK NOT FOUND*\n' +
                    '│\n' +
                    '│ API එක MP4 download URL එකක්\n' +
                    '│ return කරලා නැහැ.\n' +
                    '╰──────────●●►'
                );
            }

            console.log(
                '[YTMP4] Title:',
                title
            );

            console.log(
                '[YTMP4] Quality:',
                quality
            );

            // ─────────────────────────
            // FOUND
            // ─────────────────────────

            await reply(
                '╭──────────●●►\n' +
                '│ 🎬 *MP4 FOUND*\n' +
                '│\n' +
                `│ 🎞️ ${title}\n` +
                `│ ⏱️ ${duration}\n` +
                `│ 📺 ${quality}\n` +
                '│\n' +
                '│ ⬇️ Downloading...\n' +
                '│ ▰▰▰▱▱ 60%\n' +
                '╰──────────●●►'
            );

            // ─────────────────────────
            // DOWNLOAD MP4
            // ─────────────────────────

            let video;

            try {

                video =
                    await downloadVideo(
                        videoUrl
                    );

            } catch (downloadError) {

                console.error(
                    '[YTMP4] Video download failed:',
                    downloadError.message
                );

                return reply(
                    '╭──────────●●►\n' +
                    '│ ❌ *VIDEO DOWNLOAD FAILED*\n' +
                    '│\n' +
                    `│ ${downloadError.message}\n` +
                    '│\n' +
                    '│ API එක link එකක් ලබාදී ඇත,\n' +
                    '│ නමුත් media server එකෙන් file එක\n' +
                    '│ ලබාගන්න බැරි වුණා.\n' +
                    '╰──────────●●►'
                );
            }

            // ─────────────────────────
            // FILE SIZE
            // ─────────────────────────

            const fileSize =
                formatSize(
                    video.buffer.length
                );

            console.log(
                '[YTMP4] Size:',
                fileSize
            );

            // ─────────────────────────
            // SEND TO WHATSAPP
            // ─────────────────────────

            await reply(
                '╭──────────●●►\n' +
                '│ 📤 *SENDING MP4...*\n' +
                '│\n' +
                `│ 📦 Size: ${fileSize}\n` +
                `│ 📺 Quality: ${quality}\n` +
                '│ ▰▰▰▰▱ 90%\n' +
                '╰──────────●●►'
            );

            let filename =
                cleanFilename(
                    originalFilename
                );

            if (
                !filename
                    .toLowerCase()
                    .endsWith('.mp4')
            ) {
                filename += '.mp4';
            }

            // ─────────────────────────
            // SEND VIDEO FILE
            // ─────────────────────────

            await conn.sendMessage(
                from,
                {
                    video: video.buffer,
                    mimetype: 'video/mp4',
                    fileName: filename,
                    caption:
                        `╭──────────●●►\n` +
                        `│ 🎬 *${title}*\n` +
                        `│ 📺 Quality: ${quality}\n` +
                        `│ 📦 Size: ${fileSize}\n` +
                        `│\n` +
                        `│ 🤖 *THENUVA X MD*\n` +
                        `╰──────────●●►`
                },
                {
                    quoted: mek
                }
            );

            // ─────────────────────────
            // COMPLETE
            // ─────────────────────────

            console.log(
                '[YTMP4] Sent successfully:',
                title
            );

            return;

        } catch (error) {

            console.error(
                '[YTMP4 ERROR]',
                error
            );

            return reply(
                '╭──────────●●►\n' +
                '│ ❌ *YTMP4 ERROR*\n' +
                '│\n' +
                `│ ${error.message || 'Unknown error'}\n` +
                '╰──────────●●►'
            );
        }
    }
);
