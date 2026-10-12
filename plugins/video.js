const { cmd } = require('../command');
const { sendListMenu } = require('../lib/buttons');
const { ytmp3 } = require('@vreden/youtube_scraper');

const fetch = global.fetch;

const API_BASE = 'https://apis.davidcyril.name.ng/download/ytmp4?url=https%3A%2F%2Fyoutube.com%2Fwatch%3Fv%3DMwpMEbgC7DA';
const API_KEY = process.env.DAVID_CYRIL_API_KEY;

const MENU_IMAGE = 'https://i.ibb.co/LXTMV60v/0bade47afdf9.jpg';

const FOOTER =
    'ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

const NEWSLETTER_CONTEXT = {
    forwardingScore: 1000,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363403804248705@newsletter',
        newsletterName: 'THENUVA X MD',
        serverMessageId: 143
    }
};

// Check YouTube URLs
function isYouTubeUrl(value) {
    try {
        const url = new URL(value);

        return [
            'youtube.com',
            'www.youtube.com',
            'm.youtube.com',
            'youtu.be',
            'www.youtu.be',
            'music.youtube.com'
        ].includes(url.hostname.toLowerCase());
    } catch {
        return false;
    }
}

// Clean file names
function cleanFileName(name) {
    return String(name || 'YouTube Video')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 150) || 'YouTube Video';
}

// Extract YouTube URL from command
function getYouTubeUrl(q) {
    const parts = String(q || '').trim().split(/\s+/);
    return parts.find(isYouTubeUrl) || null;
}

// Decode URL safely
function decodeUrl(value) {
    const input = String(value || '').trim();

    try {
        return decodeURIComponent(input);
    } catch {
        return input;
    }
}

// Get video information from API
async function getVideoData(url) {
    if (!API_KEY) {
        throw new Error(
            'DAVID_CYRIL_API_KEY is missing in Railway Variables.'
        );
    }

    const apiUrl =
        `${API_BASE}?url=${encodeURIComponent(url)}`;

    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'X-API-Key': API_KEY,
            'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(60000)
    });

    const contentType =
        response.headers.get('content-type') || '';

    if (!response.ok) {
        throw new Error(
            `Video API returned HTTP ${response.status}`
        );
    }

    if (!contentType.toLowerCase().includes('application/json')) {
        throw new Error(
            `Video API returned unexpected content type: ${contentType}`
        );
    }

    const data = await response.json();

    if (
        !data ||
        data.success !== true ||
        !data.result ||
        !data.result.download_url
    ) {
        throw new Error(
            data?.message ||
            'API response did not contain result.download_url'
        );
    }

    return {
        title: cleanFileName(data.result.title),
        url: data.result.download_url,
        quality: data.result.quality || 'Unknown'
    };
}

// Show format selection menu
async function showFormatMenu(conn, mek, from, url) {
    await sendListMenu(conn, from, {
        title: '🎬 THENUVA X MD VIDEO DOWNLOADER',

        buttonText: 'SELECT FORMAT',

        sections: [
            {
                title: 'Choose download format',

                rows: [
                    {
                        id: `.videoaudio ${encodeURIComponent(url)}`,
                        title: '🎵 Audio (MP3)',
                        description: 'Download the audio as MP3'
                    },
                    {
                        id: `.videoplay ${encodeURIComponent(url)}`,
                        title: '🎬 Video (Playable)',
                        description: 'Send a playable MP4 video'
                    },
                    {
                        id: `.videodoc ${encodeURIComponent(url)}`,
                        title: '📁 Video Document',
                        description: 'Send MP4 as a document'
                    }
                ]
            }
        ],

        footer: FOOTER,
        image: MENU_IMAGE
    }, mek);
}

// Main command: .video <YouTube URL>
cmd({
    pattern: 'video',
    alias: ['ytv', 'mp4'],
    react: '🎬',
    desc: 'Choose YouTube download format',
    category: 'download',
    use: '.video <YouTube URL>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const url = getYouTubeUrl(q);

        if (!url) {
            return await reply(
                '⚠️ *YouTube link එකක් දෙන්න.*\n\n' +
                'උදාහරණය:\n' +
                '.video https://youtube.com/watch?v=MwpMEbgC7DA'
            );
        }

        await showFormatMenu(conn, mek, from, url);

    } catch (error) {
        console.error('[VIDEO MENU ERROR]', error);

        await reply(
            '❌ Format menu එක පෙන්වන්න බැරි වුණා.\n' +
            'නැවත උත්සාහ කරන්න.'
        );
    }
});

// Audio command: .videoaudio <YouTube URL>
cmd({
    pattern: 'videoaudio',
    react: '🎵',
    desc: 'Download YouTube audio as MP3',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const url = decodeUrl(q);

        if (!isYouTubeUrl(url)) {
            return await reply(
                '⚠️ නිවැරදි YouTube URL එකක් ලබා දෙන්න.'
            );
        }

        await reply('⏳ *Audio MP3 එක සකස් කරමින්...*');

        const audioData = await ytmp3(url, '192');
        const audioUrl = audioData?.download?.url;

        if (!audioUrl) {
            throw new Error(
                'Audio downloader did not return a download URL.'
            );
        }

        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: 'THENUVA-X-MD.mp3',
            contextInfo: NEWSLETTER_CONTEXT
        }, {
            quoted: mek
        });

    } catch (error) {
        console.error('[VIDEO AUDIO ERROR]', error);

        await reply(
            '❌ Audio download එක අසාර්ථකයි.\n' +
            'වෙනත් YouTube link එකක් උත්සාහ කරන්න.'
        );
    }
});

// Playable video command: .videoplay <YouTube URL>
cmd({
    pattern: 'videoplay',
    react: '🎬',
    desc: 'Send playable YouTube video',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const url = decodeUrl(q);

        if (!isYouTubeUrl(url)) {
            return await reply(
                '⚠️ නිවැරදි YouTube URL එකක් ලබා දෙන්න.'
            );
        }

        await reply(
            '⏳ *Playable video එක සකස් කරමින්...*'
        );

        const video = await getVideoData(url);

        await conn.sendMessage(from, {
            video: { url: video.url },
            mimetype: 'video/mp4',
            fileName: `${video.title}.mp4`,

            caption:
                `🎬 *THENUVA X MD VIDEO DOWNLOADER*\n\n` +
                `📌 *Title:* ${video.title}\n` +
                `🎞️ *Quality:* ${video.quality}\n\n` +
                `> ${FOOTER}`,

            contextInfo: NEWSLETTER_CONTEXT
        }, {
            quoted: mek
        });

    } catch (error) {
        console.error('[VIDEO PLAY ERROR]', error);

        await reply(
            '❌ Video download එක අසාර්ථකයි.\n' +
            'API එක හෝ download link එක පරීක්ෂා කරන්න.'
        );
    }
});

// Document command: .videodoc <YouTube URL>
cmd({
    pattern: 'videodoc',
    react: '📁',
    desc: 'Send YouTube video as a document',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const url = decodeUrl(q);

        if (!isYouTubeUrl(url)) {
            return await reply(
                '⚠️ නිවැරදි YouTube URL එකක් ලබා දෙන්න.'
            );
        }

        await reply(
            '⏳ *Video document එක සකස් කරමින්...*'
        );

        const video = await getVideoData(url);

        await conn.sendMessage(from, {
            document: { url: video.url },
            mimetype: 'video/mp4',
            fileName: `${video.title}.mp4`,

            caption:
                `📁 *THENUVA X MD VIDEO DOCUMENT*\n\n` +
                `📌 *Title:* ${video.title}\n` +
                `🎞️ *Quality:* ${video.quality}\n\n` +
                `> ${FOOTER}`,

            contextInfo: NEWSLETTER_CONTEXT
        }, {
            quoted: mek
        });

    } catch (error) {
        console.error('[VIDEO DOCUMENT ERROR]', error);

        await reply(
            '❌ Video document එක යවන්න බැරි වුණා.\n' +
            'API එක හෝ download link එක පරීක්ෂා කරන්න.'
        );
    }
});
