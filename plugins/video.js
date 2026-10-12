const { cmd } = require('../command');
const { sendListMenu } = require('../lib/buttons');
const { ytmp3 } = require('@vreden/youtube_scraper');

const fetch = global.fetch;

const API_BASE = 'https://apis.davidcyril.name.ng/download/ytmp4';
const API_KEY = process.env.DAVID_CYRIL_API_KEY;

const MENU_IMAGE = 'https://i.ibb.co/LXTMV60v/0bade47afdf9.jpg';
const CHANNEL_URL = 'https://whatsapp.com/channel/0029VbDTWC7HFxOwuNxNHV1z';

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

function isYouTubeUrl(value) {
    try {
        const url = new URL(value);
        return (
            ['youtube.com', 'www.youtube.com', 'm.youtube.com',
             'youtu.be', 'www.youtu.be', 'music.youtube.com']
                .includes(url.hostname.toLowerCase())
        );
    } catch {
        return false;
    }
}

function cleanFileName(name) {
    return String(name || 'YouTube Video')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 150) || 'YouTube Video';
}

function getYouTubeUrl(q) {
    const parts = String(q || '').trim().split(/\s+/);
    return parts.find(isYouTubeUrl) || null;
}

async function getVideoData(url) {
    if (!API_KEY) {
        throw new Error(
            'DAVID_CYRIL_API_KEY is missing in Railway Variables.'
        );
    }

    const apiUrl = `${API_BASE}?url=${encodeURIComponent(url)}`;

    const response = await fetch(apiUrl, {
        headers: {
            'X-API-Key': API_KEY,
            'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(60000)
    });

    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
        throw new Error(`Video API returned HTTP ${response.status}`);
    }

    if (!contentType.includes('application/json')) {
        throw new Error(
            `Video API returned unexpected content type: ${contentType}`
        );
    }

    const data = await response.json();

    if (!data?.success || !data?.result?.download_url) {
        throw new Error(
            data?.message || 'API response did not contain result.download_url'
        );
    }

    return {
        title: cleanFileName(data.result.title),
        thumbnail: data.result.thumbnail,
        url: data.result.download_url,
        quality: data.result.quality || 'unknown'
    };
}

async function showFormatMenu(conn, mek, from, url) {
    const encodedUrl = encodeURIComponent(url);

    await sendListMenu(conn, from, {
        title: '🎬 THENUVA X MD VIDEO DOWNLOADER',
        text:
            '╭─〔 *ᴠɪᴅᴇᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 〕─●●►\n' +
            '│\n' +
            '│ 🔗 Link received successfully!\n' +
            '│\n' +
            '│ 🎵 Audio — MP3\n' +
            '│ 🎬 Video — Playable\n' +
            '│ 📁 Video — Document\n' +
            '│\n' +
            '╰────────────────●●►',
        buttonText: 'SELECT FORMAT',
        sections: [
            {
                title: 'Choose download format',
                rows: [
                    {
                        title: '🎵 Audio (MP3)',
                        description: 'Download the audio as MP3',
                        rowId: `.videoaudio ${encodedUrl}`
                    },
                    {
                        title: '🎬 Video (Playable)',
                        description: 'Send a playable MP4 video',
                        rowId: `.videoplay ${encodedUrl}`
                    },
                    {
                        title: '📁 Video Document',
                        description: 'Send MP4 as a document',
                        rowId: `.videodoc ${encodedUrl}`
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
                'Example:\n.video https://youtube.com/watch?v=MwpMEbgC7DA'
            );
        }

        await showFormatMenu(conn, mek, from, url);
    } catch (error) {
        console.error('[VIDEO MENU ERROR]', error);
        await reply('❌ Format menu එක පෙන්වන්න බැරි වුණා. නැවත උත්සාහ කරන්න.');
    }
});

// Download audio as MP3
cmd({
    pattern: 'videoaudio',
    react: '🎵',
    desc: 'Download YouTube audio as MP3',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const encodedUrl = String(q || '').trim().split(/\s+/)[0];
        const url = decodeURIComponent(encodedUrl || '');

        if (!isYouTubeUrl(url)) {
            return await reply('⚠️ Valid YouTube URL එකක් නැහැ.');
        }

        await reply('⏳ *Audio MP3 එක සකස් කරමින්...*');

        const audioData = await ytmp3(url, '192');
        const audioUrl = audioData?.download?.url;

        if (!audioUrl) {
            throw new Error('Audio API did not return a download URL');
        }

        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: 'THENUVA-X-MD.mp3',
            contextInfo: NEWSLETTER_CONTEXT
        }, { quoted: mek });

        await reply('✅ *MP3 Audio එක යැව්වා!*');
    } catch (error) {
        console.error('[VIDEO AUDIO ERROR]', error);
        await reply('❌ Audio download එක අසාර්ථකයි. වෙනත් link එකක් උත්සාහ කරන්න.');
    }
});

// Download as playable video
cmd({
    pattern: 'videoplay',
    react: '🎬',
    desc: 'Send playable YouTube video',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const encodedUrl = String(q || '').trim().split(/\s+/)[0];
        const url = decodeURIComponent(encodedUrl || '');

        if (!isYouTubeUrl(url)) {
            return await reply('⚠️ Valid YouTube URL එකක් නැහැ.');
        }

        await reply('⏳ *Playable video එක download කරමින්...*');

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
        }, { quoted: mek });

    } catch (error) {
        console.error('[VIDEO PLAY ERROR]', error);
        await reply(`❌ Video download එක අසාර්ථකයි.\n${error.message}`);
    }
});

// Download as video document
cmd({
    pattern: 'videodoc',
    react: '📁',
    desc: 'Send YouTube video as a document',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const encodedUrl = String(q || '').trim().split(/\s+/)[0];
        const url = decodeURIComponent(encodedUrl || '');

        if (!isYouTubeUrl(url)) {
            return await reply('⚠️ Valid YouTube URL එකක් නැහැ.');
        }

        await reply('⏳ *Video document එක සකස් කරමින්...*');

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
        }, { quoted: mek });

    } catch (error) {
        console.error('[VIDEO DOCUMENT ERROR]', error);
        await reply(`❌ Video document එක යවන්න බැරි වුණා.\n${error.message}`);
    }
});
