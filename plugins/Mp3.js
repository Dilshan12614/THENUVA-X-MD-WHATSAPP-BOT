const { cmd } = require('../command');

const API_URL =
    'https://mr-thinuzz-api-build.vercel.app/api/ytmp3/download';

// Optional API key.
// Railway Variables එකේ YT_API_KEY තිබුණොත් automatically use වෙනවා.
// නැත්නම් key නැතුව request කරනවා.
const API_KEY = process.env.YT_API_KEY || 'key_62cb6c23a4c8cca270dd510983b195b9';

function extractYouTubeUrl(text) {
    if (!text) return null;

    const match = text.match(
        /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)[^\s]+|youtu\.be\/[^\s]+)/i
    );

    return match
        ? match[0].replace(/[)>.,]+$/, '')
        : null;
}

function cleanFilename(name) {
    return String(name || 'THENUVA-X-MD.mp3')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .trim()
        .slice(0, 150) || 'THENUVA-X-MD.mp3';
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

    // Key තිබුණොත් විතරක් යවනවා.
    if (API_KEY) {
        params.set('apiKey', API_KEY);
    }

    const endpoint =
        `${API_URL}?${params.toString()}`;

    console.log(
        '[YTMP3] Request:',
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

async function downloadAudio(audioUrl) {
    console.log(
        '[YTMP3] Downloading audio...'
    );

    const response = await fetch(audioUrl, {
        method: 'GET',
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
            'Accept':
                'audio/mpeg,audio/*,*/*'
        },
        redirect: 'follow'
    });

    if (!response.ok) {
        throw new Error(
            `Audio download failed: HTTP ${response.status}`
        );
    }

    const buffer = Buffer.from(
        await response.arrayBuffer()
    );

    if (!buffer.length) {
        throw new Error(
            'Audio file is empty.'
        );
    }

    return {
        buffer,
        contentType:
            response.headers.get(
                'content-type'
            ) || 'audio/mpeg'
    };
}

cmd(
    {
        pattern: 'mp3',
        alias: [
            'ytmp3',
            'song',
            'audio'
        ],
        react: '🎵',
        desc: 'Download YouTube audio as MP3',
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
                              /^\.?(mp3|ytmp3|song|audio)\s*/i,
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
                    '│ `.mp3 https://youtu.be/VIDEO_ID`\n' +
                    '╰──────────●●►'
                );
            }

            // ─────────────────────────
            // SEARCH
            // ─────────────────────────

            await reply(
                '╭──────────●●►\n' +
                '│ 🎵 *THENUVA X MD MP3*\n' +
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
                '[YTMP3] API status:',
                api?.status
            );

            // ─────────────────────────
            // API ERROR
            // ─────────────────────────

            if (!api?.status) {

                let message =
                    api?.error ||
                    'MP3 download failed.';

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
                    '│ ❌ *YTMP3 API ERROR*\n' +
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
                'YouTube Audio';

            const thumbnail =
                data.thumbnail ||
                null;

            const duration =
                data.duration ||
                'N/A';

            const quality =
                data.quality_found ||
                'MP3';

            const audioUrl =
                data.links?.audio;

            const originalFilename =
                data.filename ||
                `${title}.mp3`;

            if (!audioUrl) {
                return reply(
                    '╭──────────●●►\n' +
                    '│ ❌ *AUDIO LINK NOT FOUND*\n' +
                    '│\n' +
                    '│ API එක MP3 download URL එකක් return කරලා නැහැ.\n' +
                    '╰──────────●●►'
                );
            }

            console.log(
                '[YTMP3] Title:',
                title
            );

            console.log(
                '[YTMP3] Quality:',
                quality
            );

            // ─────────────────────────
            // FOUND
            // ─────────────────────────

            await reply(
                '╭──────────●●►\n' +
                '│ 🎵 *MP3 FOUND*\n' +
                '│\n' +
                `│ 🎶 ${title}\n` +
                `│ ⏱️ ${duration}\n` +
                `│ 🎧 ${quality}\n` +
                '│\n' +
                '│ ⬇️ Downloading...\n' +
                '│ ▰▰▰▱▱ 60%\n' +
                '╰──────────●●►'
            );

            // ─────────────────────────
            // DOWNLOAD MP3
            // ─────────────────────────

            let audio;

            try {

                audio =
                    await downloadAudio(
                        audioUrl
                    );

            } catch (downloadError) {

                console.error(
                    '[YTMP3] Audio download failed:',
                    downloadError.message
                );

                return reply(
                    '╭──────────●●►\n' +
                    '│ ❌ *AUDIO DOWNLOAD FAILED*\n' +
                    '│\n' +
                    `│ ${downloadError.message}\n` +
                    '│\n' +
                    '│ API එක link එකක් ලබාදී ඇත,\n' +
                    '│ නමුත් media server එකෙන් file එක ලබාගන්න බැරි වුණා.\n' +
                    '╰──────────●●►'
                );
            }

            // ─────────────────────────
            // FILE SIZE
            // ─────────────────────────

            const fileSize =
                formatSize(
                    audio.buffer.length
                );

            console.log(
                '[YTMP3] Size:',
                fileSize
            );

            // ─────────────────────────
            // SEND TO WHATSAPP
            // ─────────────────────────

            await reply(
                '╭──────────●●►\n' +
                '│ 📤 *SENDING MP3...*\n' +
                '│\n' +
                `│ 📦 Size: ${fileSize}\n` +
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
                    .endsWith('.mp3')
            ) {
                filename += '.mp3';
            }

            await conn.sendMessage(
                from,
                {
                    audio: audio.buffer,
                    mimetype: 'audio/mpeg',
                    fileName: filename,
                    ptt: false
                },
                {
                    quoted: mek
                }
            );

            // ─────────────────────────
            // COMPLETE
            // ─────────────────────────

            console.log(
                '[YTMP3] Sent successfully:',
                title
            );

            return;

        } catch (error) {

            console.error(
                '[YTMP3 ERROR]',
                error
            );

            return reply(
                '╭──────────●●►\n' +
                '│ ❌ *YTMP3 ERROR*\n' +
                '│\n' +
                `│ ${error.message || 'Unknown error'}\n` +
                '╰──────────●●►'
            );
        }
    }
);
