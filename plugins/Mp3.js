const { cmd } = require('../command');
const yts = require('yt-search');

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = 'web.harvester~youtube-downloader';

const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

function safeFileName(name) {
    return String(name || 'song')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100) || 'song';
}

async function getApifyAudio(videoUrl) {
    const endpoint =
        `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items` +
        `?token=${encodeURIComponent(APIFY_TOKEN)}&timeout=180`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            includeInfo: true,
            maxRequestRetries: 3,
            proxyConfiguration: {
                useApifyProxy: true
            },
            youtubeUrls: [
                { url: videoUrl }
            ]
        }),
        signal: AbortSignal.timeout(190000)
    });

    const responseText = await response.text();

    if (!response.ok) {
        throw new Error(
            `Apify API error (${response.status}): ${responseText.slice(0, 300)}`
        );
    }

    let items;

    try {
        items = JSON.parse(responseText);
    } catch {
        throw new Error('Apify returned invalid JSON.');
    }

    if (!Array.isArray(items) || !items.length) {
        throw new Error('Apify returned no output items.');
    }

    const item = items.find(
        result => result && typeof result.fileUrl === 'string'
    );

    if (!item || !item.fileUrl) {
        throw new Error('Apify output does not contain fileUrl.');
    }

    if (Number.parseFloat(item.fileSize) === 0) {
        throw new Error(
            'Apify reports fileSize as 0.00 MB. The audio may not have been generated.'
        );
    }

    const audioResponse = await fetch(item.fileUrl, {
        headers: {
            'Accept': 'audio/mpeg, audio/*, application/octet-stream, */*'
        },
        signal: AbortSignal.timeout(120000)
    });

    if (!audioResponse.ok) {
        const errorText = await audioResponse.text().catch(() => '');
        throw new Error(
            `Audio URL failed (${audioResponse.status}): ${errorText.slice(0, 200)}`
        );
    }

    const contentType = (
        audioResponse.headers.get('content-type') || ''
    ).toLowerCase();

    if (
        contentType.includes('application/json') ||
        contentType.includes('text/html') ||
        contentType.startsWith('text/')
    ) {
        throw new Error(
            `fileUrl returned ${contentType}, not an audio file.`
        );
    }

    const declaredSize = Number(
        audioResponse.headers.get('content-length') || 0
    );

    if (declaredSize > MAX_AUDIO_SIZE) {
        throw new Error('Audio file exceeds the 25 MB limit.');
    }

    const audioBuffer = Buffer.from(
        await audioResponse.arrayBuffer()
    );

    if (audioBuffer.length < 1024) {
        throw new Error(
            `Audio file is empty or too small (${audioBuffer.length} bytes).`
        );
    }

    if (audioBuffer.length > MAX_AUDIO_SIZE) {
        throw new Error('Audio file exceeds the 25 MB limit.');
    }

    // Check for common audio signatures.
    const isMp3 =
        audioBuffer.length >= 3 &&
        audioBuffer.toString('ascii', 0, 3) === 'ID3';

    const hasMpegFrame =
        audioBuffer.length >= 2 &&
        audioBuffer[0] === 0xFF &&
        (audioBuffer[1] & 0xE0) === 0xE0;

    const isMp4Audio =
        audioBuffer.length >= 12 &&
        audioBuffer.toString('ascii', 4, 8) === 'ftyp';

    if (
        !contentType.startsWith('audio/') &&
        !isMp3 &&
        !hasMpegFrame &&
        !isMp4Audio
    ) {
        throw new Error(
            'The fileUrl did not return a recognizable audio file.'
        );
    }

    return {
        buffer: audioBuffer,
        title: safeFileName(item.fileTitle || 'song'),
        mimeType: contentType.startsWith('audio/')
            ? contentType.split(';')[0]
            : 'audio/mpeg'
    };
}

cmd(
    {
        pattern: 'mp3',
        alias: ['song', 'ytaudio', 'ytmp3'],
        react: '🎵',
        desc: 'Download a song as audio',
        category: 'download',
        filename: __filename
    },
    async (conn, mek, m, { from, args, q, reply }) => {
        try {
            const query = String(q || args?.join(' ') || '').trim();

            if (!query) {
                return reply(
                    '🎵 *YOUTUBE MP3 DOWNLOADER*\n\n' +
                    'භාවිතය: `.mp3 song name`\n\n' +
                    'උදාහරණය: `.mp3 Manike Mage Hithe`'
                );
            }

            if (!APIFY_TOKEN) {
                return reply(
                    '❌ APIFY_TOKEN සකස් කරලා නැහැ.\n' +
                    'Railway Variables හෝ GitHub Secrets වල APIFY_TOKEN එක දාන්න.'
                );
            }

            await reply(
                '╭─〔 🎵 *MP3 DOWNLOADER* 〕\n' +
                `│ 🔎 Song: ${query}\n` +
                '│ ⏳ Searching YouTube...\n' +
                '╰──────────────'
            );

            const search = await yts(query);
            const video = search.videos && search.videos[0];

            if (!video || !video.url) {
                return reply('❌ ඒ නමින් YouTube song එකක් හොයාගන්න බැරි වුණා.');
            }

            await reply(
                '🎶 *Song Found!*\n' +
                `📌 ${video.title}\n` +
                '⬇️ Audio එක සකස් කරමින් ඉන්නවා. ටිකක් ඉන්න...'
            );

            const result = await getApifyAudio(video.url);

            await conn.sendMessage(
                from,
                {
                    audio: result.buffer,
                    mimetype: result.mimeType,
                    fileName: `${result.title}.mp3`,
                    ptt: false
                },
                { quoted: mek }
            );

        } catch (error) {
            console.error('[MP3 DOWNLOADER ERROR]', error);

            const message = String(error.message || '');

            await reply(
                '❌ *MP3 Download Failed*\n\n' +
                `📌 හේතුව: ${message.slice(0, 500)}\n\n` +
                'Apify Actor එකේ Run → Output සහ Log පරීක්ෂා කරන්න.'
            );
        }
    }
);
