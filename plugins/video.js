const { cmd } = require('../command');

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = 'ZSKNl5eniyeAPcPkf';
const API_URL =
    `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`;

const TIMEOUT = 300000;
const MAX_VIDEO_SIZE = 64 * 1024 * 1024;

const FOOTER =
    '╭━━━━━━━━━━━━━━━━━━╮\n' +
    '┃ ⚡ ᴘᴏᴡᴇʀᴇᴅ ʙʏ\n' +
    '┃ ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ\n' +
    '╰━━━━━━━━━━━━●●►';

const pendingVideos = new Map();

function isYouTubeUrl(value) {
    try {
        const url = new URL(value);

        return [
            'youtube.com',
            'www.youtube.com',
            'm.youtube.com',
            'youtu.be',
            'www.youtu.be'
        ].includes(url.hostname) &&
        ['http:', 'https:'].includes(url.protocol);
    } catch {
        return false;
    }
}

function findMediaUrl(data, mode) {
    const seen = new Set();
    const queue = [data];

    while (queue.length) {
        const item = queue.shift();

        if (!item || typeof item !== 'object' || seen.has(item)) {
            continue;
        }

        seen.add(item);

        const keys = mode === 'mp3'
            ? ['audioUrl', 'audio_url', 'downloadUrl', 'download_url', 'url', 'link']
            : ['downloadUrl', 'download_url', 'videoUrl', 'video_url', 'url', 'link'];

        for (const key of keys) {
            const value = item[key];

            if (
                typeof value !== 'string' ||
                !/^https?:\/\//i.test(value)
            ) {
                continue;
            }

            if (mode === 'mp3' && /\.(mp3|m4a)(?:[?#]|$)/i.test(value)) {
                return value;
            }

            if (
                mode !== 'mp3' &&
                /\.(mp4|m4v|webm)(?:[?#]|$)/i.test(value)
            ) {
                return value;
            }
        }

        for (const value of Object.values(item)) {
            if (value && typeof value === 'object') {
                queue.push(value);
            }
        }
    }

    return null;
}

function findTitle(data) {
    const queue = Array.isArray(data) ? [...data] : [data];

    while (queue.length) {
        const item = queue.shift();

        if (!item || typeof item !== 'object') continue;

        const title = item.title || item.videoTitle || item.name;

        if (typeof title === 'string' && title.trim()) {
            return title;
        }

        for (const value of Object.values(item)) {
            if (value && typeof value === 'object') {
                queue.push(value);
            }
        }
    }

    return 'YouTube Video';
}

function safeFileName(value) {
    return value
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 100) || 'THENUVA-X-MD';
}

async function sendFormatMenu(conn, from, mek, url) {
    pendingVideos.set(from, url);

    return conn.sendMessage(from, {
        text:
            '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━╮\n' +
            '┃ 🎬 *SELECT FORMAT*\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            '┃\n' +
            '┃ 📥 *Download Options*\n' +
            '┃\n' +
            '┃ 🎵 *Audio (MP3)*\n' +
            '┃ ➜ Download audio only\n' +
            '┃\n' +
            '┃ 🎬 *Video (Playable)*\n' +
            '┃ ➜ MP4 playable video\n' +
            '┃\n' +
            '┃ 📁 *Video Document*\n' +
            '┃ ➜ MP4 as document\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER,
        title: '🎬 SELECT FORMAT',
        buttonText: 'Select',
        sections: [{
            title: '📥 Download Options',
            rows: [
                {
                    title: '🎵 Audio (MP3)',
                    description: 'Download audio only',
                    rowId: '.ytformat_mp3'
                },
                {
                    title: '🎬 Video (Playable)',
                    description: 'MP4 playable video',
                    rowId: '.ytformat_mp4'
                },
                {
                    title: '📁 Video Document',
                    description: 'MP4 as document',
                    rowId: '.ytformat_doc'
                }
            ]
        }]
    }, { quoted: mek });
}

async function downloadSelected(conn, mek, from, reply, mode) {
    try {
        const input = pendingVideos.get(from);

        if (!input) {
            return reply(
                '╭━━〔 *ɴᴏ ᴘᴇɴᴅɪɴɢ ᴠɪᴅᴇᴏ* 〕━━╮\n' +
                '┃ ❌ මුලින් `.video YouTube_URL` යවන්න.\n' +
                '┣━━━━━━━━━━━━━━━━━━╯\n' +
                FOOTER
            );
        }

        if (!APIFY_TOKEN) {
            return reply(
                '╭━━〔 *ᴀᴘɪ ᴄᴏɴғɪɢ* 〕━━╮\n' +
                '┃ ❌ APIFY_TOKEN GitHub Secret එක සකස් කරන්න.\n' +
                '┣━━━━━━━━━━━━━━━━━━╯\n' +
                FOOTER
            );
        }

        await conn.sendMessage(from, {
            react: { text: '⏳', key: mek.key }
        });

        const formatName = mode === 'mp3'
            ? 'Audio (MP3)'
            : mode === 'doc'
                ? 'Video Document'
                : 'Video (Playable)';

        await reply(
            '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━╮\n' +
            '┃ ⏳ *ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...*\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            `┃ 📌 ғᴏʀᴍᴀᴛ: ${formatName}\n` +
            '┃ ➜ ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );

        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${APIFY_TOKEN}`,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                urls: [{ url: input }],
                quality: '1080',
                format: mode === 'mp3' ? 'mp3' : 'default',
                residentialProxyMode: 'disabled',
                proxyCountry: ''
            }),
            signal: AbortSignal.timeout(TIMEOUT)
        });

        const responseText = await apiResponse.text();

        if (!apiResponse.ok) {
            console.error('[APIFY VIDEO] HTTP:', apiResponse.status);
            console.error('[APIFY VIDEO] Error:', responseText.slice(0, 500));
            throw new Error(`Apify API HTTP ${apiResponse.status}`);
        }

        let result;

        try {
            result = JSON.parse(responseText);
        } catch {
            throw new Error('Apify returned invalid JSON');
        }

        const mediaUrl = findMediaUrl(result, mode);

        if (!mediaUrl) {
            console.error(
                '[APIFY VIDEO] Output:',
                JSON.stringify(result).slice(0, 1500)
            );

            throw new Error(
                `Actor output එකේ ${mode === 'mp3' ? 'MP3' : 'MP4'} URL එක හමු වුණේ නැහැ`
            );
        }

        const mediaResponse = await fetch(mediaUrl, {
            headers: {
                Accept: 'video/*, audio/*, application/octet-stream'
            },
            signal: AbortSignal.timeout(TIMEOUT)
        });

        if (!mediaResponse.ok) {
            throw new Error(`Media download HTTP ${mediaResponse.status}`);
        }

        const contentType = (
            mediaResponse.headers.get('content-type') || ''
        ).toLowerCase();

        if (
            mode === 'mp3'
                ? !contentType.includes('audio/')
                : !contentType.includes('video/') &&
                  !contentType.includes('application/octet-stream')
        ) {
            throw new Error(
                `Invalid media content type: ${contentType || 'unknown'}`
            );
        }

        const declaredSize = Number(
            mediaResponse.headers.get('content-length') || 0
        );

        if (declaredSize > MAX_VIDEO_SIZE) {
            throw new Error('FILE_TOO_LARGE');
        }

        const buffer = Buffer.from(await mediaResponse.arrayBuffer());

        if (!buffer.length) {
            throw new Error('Downloaded file is empty');
        }

        if (buffer.length > MAX_VIDEO_SIZE) {
            throw new Error('FILE_TOO_LARGE');
        }

        const title = safeFileName(findTitle(result));

        const caption =
            '╭━━〔 *ᴅᴏᴡɴʟᴏᴀᴅ sᴜᴄᴄᴇss* 〕━━╮\n' +
            `┃ 📌 *${title}*\n` +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            `┃ 🎞️ ғᴏʀᴍᴀᴛ: ${formatName}\n` +
            '┃ ✅ sᴛᴀᴛᴜs: sᴜᴄᴄᴇss\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER;

        if (mode === 'mp3') {
            await conn.sendMessage(from, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`,
                ptt: false
            }, { quoted: mek });

        } else if (mode === 'doc') {
            await conn.sendMessage(from, {
                document: buffer,
                mimetype: 'video/mp4',
                fileName: `${title}.mp4`,
                caption
            }, { quoted: mek });

        } else {
            await conn.sendMessage(from, {
                video: buffer,
                mimetype: 'video/mp4',
                fileName: `${title}.mp4`,
                caption
            }, { quoted: mek });
        }

        pendingVideos.delete(from);

        await conn.sendMessage(from, {
            react: { text: '✅', key: mek.key }
        });

    } catch (error) {
        console.error('[APIFY DOWNLOAD ERROR]', error.message);

        await conn.sendMessage(from, {
            react: { text: '❌', key: mek.key }
        });

        return reply(
            '╭━━〔 *ᴅᴏᴡɴʟᴏᴀᴅ ғᴀɪʟᴇᴅ* 〕━━╮\n' +
            `┃ ❌ ${error.message === 'FILE_TOO_LARGE'
                ? 'ගොනුව 64 MB සීමාව ඉක්මවයි.'
                : error.message}\n` +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );
    }
}

cmd({
    pattern: 'video',
    alias: ['ytmp4', 'ytvideo'],
    react: '🎬',
    desc: 'Download YouTube media',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    const input = args.join(' ').trim();

    if (!input) {
        return reply(
            '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━╮\n' +
            '┃ 🎬 *ʏᴏᴜᴛᴜʙᴇ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            '┃ ➜ .video YouTube_URL\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );
    }

    if (!isYouTubeUrl(input)) {
        return reply(
            '╭━━〔 *ɪɴᴠᴀʟɪᴅ ʟɪɴᴋ* 〕━━╮\n' +
            '┃ ❌ නිවැරදි YouTube URL එකක් ලබා දෙන්න.\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );
    }

    return sendFormatMenu(conn, from, mek, input);
});

cmd({
    pattern: 'ytformat_mp3',
    desc: 'Download selected MP3 format',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    return downloadSelected(conn, mek, from, reply, 'mp3');
});

cmd({
    pattern: 'ytformat_mp4',
    desc: 'Download selected playable MP4 format',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    return downloadSelected(conn, mek, from, reply, 'mp4');
});

cmd({
    pattern: 'ytformat_doc',
    desc: 'Download selected MP4 document format',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    return downloadSelected(conn, mek, from, reply, 'doc');
});
