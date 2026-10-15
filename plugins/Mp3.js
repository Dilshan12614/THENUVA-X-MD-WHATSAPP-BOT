const { cmd } = require('../command');
const yts = require('yt-search');
const { sendListMenu } = require('../lib/buttons');

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = 'ZSKNl5eniyeAPcPkf';

const API_URL =
    `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`;

const TIMEOUT = 300000;
const MAX_AUDIO_SIZE = 64 * 1024 * 1024;

const FOOTER =
    '> ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

const pendingSongs = new Map();
const registeredListeners = new WeakSet();

function isYouTubeUrl(value) {
    try {
        const url = new URL(value);

        return (
            ['http:', 'https:'].includes(url.protocol) &&
            [
                'youtube.com',
                'www.youtube.com',
                'm.youtube.com',
                'music.youtube.com',
                'youtu.be',
                'www.youtu.be'
            ].includes(url.hostname.toLowerCase())
        );
    } catch {
        return false;
    }
}

function safeFileName(value) {
    return String(value || 'THENUVA-X-MD')
        .replace(/[\\/:*?"<>|\x00-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100) || 'THENUVA-X-MD';
}

function getMessageText(message) {
    let msg = message?.message || {};

    for (let i = 0; i < 5; i++) {
        const wrapped =
            msg.ephemeralMessage?.message ||
            msg.viewOnceMessage?.message ||
            msg.viewOnceMessageV2?.message ||
            msg.documentWithCaptionMessage?.message;

        if (!wrapped) break;
        msg = wrapped;
    }

    return String(
        msg.conversation ||
        msg.extendedTextMessage?.text ||
        msg.imageMessage?.caption ||
        msg.videoMessage?.caption ||
        msg.documentMessage?.caption ||
        ''
    ).trim();
}

function findAudioUrl(data) {
    const queue = Array.isArray(data) ? [...data] : [data];
    const seen = new Set();

    const preferredKeys = [
        'audioUrl',
        'audio_url',
        'mp3Url',
        'mp3_url',
        'audioDownloadUrl',
        'audio_download_url',
        'downloadUrl',
        'download_url',
        'audio',
        'url',
        'link'
    ];

    while (queue.length) {
        const item = queue.shift();

        if (!item || typeof item !== 'object' || seen.has(item)) {
            continue;
        }

        seen.add(item);

        for (const key of preferredKeys) {
            const value = item[key];

            if (
                typeof value === 'string' &&
                /^https?:\/\//i.test(value) &&
                (
                    /\.(mp3|m4a|aac|ogg|opus|wav)(?:[?#]|$)/i.test(value) ||
                    /audio|download|mp3/i.test(key)
                )
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

function findTitle(data, fallback) {
    const queue = Array.isArray(data) ? [...data] : [data];
    const seen = new Set();

    while (queue.length) {
        const item = queue.shift();

        if (!item || typeof item !== 'object' || seen.has(item)) {
            continue;
        }

        seen.add(item);

        for (const key of ['title', 'fileTitle', 'videoTitle', 'name']) {
            if (typeof item[key] === 'string' && item[key].trim()) {
                return safeFileName(item[key]);
            }
        }

        for (const value of Object.values(item)) {
            if (value && typeof value === 'object') {
                queue.push(value);
            }
        }
    }

    return safeFileName(fallback);
}

async function getActorOutput(videoUrl, fallbackTitle) {
    if (!APIFY_TOKEN) {
        throw new Error('APIFY_TOKEN සකස් කරලා නැහැ.');
    }

    const response = await fetch(
        `${API_URL}?token=${encodeURIComponent(APIFY_TOKEN)}&timeout=240`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                urls: [{ url: videoUrl }],
                quality: '1080',
                format: 'mp3',
                residentialProxyMode: 'disabled',
                proxyCountry: ''
            }),
            signal: AbortSignal.timeout(TIMEOUT)
        }
    );

    const responseText = await response.text();

    if (!response.ok) {
        console.error(
            '[APIFY MP3 HTTP ERROR]',
            response.status,
            responseText.slice(0, 1000)
        );

        throw new Error(`Apify HTTP ${response.status}`);
    }

    let output;

    try {
        output = JSON.parse(responseText);
    } catch {
        throw new Error('Apify වෙතින් නිවැරදි JSON output එකක් ලැබුණේ නැහැ.');
    }

    const items = Array.isArray(output)
        ? output
        : Array.isArray(output?.items)
            ? output.items
            : Array.isArray(output?.data)
                ? output.data
                : output && typeof output === 'object'
                    ? [output]
                    : [];

    if (!items.length) {
        throw new Error('Apify output එක හිස්. Actor Log පරීක්ෂා කරන්න.');
    }

    const audioUrl = findAudioUrl(items);

    if (!audioUrl) {
        console.error(
            '[APIFY MP3 OUTPUT]',
            JSON.stringify(items).slice(0, 2000)
        );

        throw new Error(
            'Audio download URL එක හමු වුණේ නැහැ. Actor output එක පරීක්ෂා කරන්න.'
        );
    }

    return {
        audioUrl,
        title: findTitle(items, fallbackTitle)
    };
}

async function downloadAudio(audioUrl) {
    const response = await fetch(audioUrl, {
        redirect: 'follow',
        headers: {
            Accept: 'audio/*, application/octet-stream, */*'
        },
        signal: AbortSignal.timeout(TIMEOUT)
    });

    if (!response.ok) {
        throw new Error(`Audio download HTTP ${response.status}`);
    }

    const contentType = (
        response.headers.get('content-type') || ''
    ).toLowerCase();

    const declaredSize = Number(
        response.headers.get('content-length') || 0
    );

    if (declaredSize > MAX_AUDIO_SIZE) {
        throw new Error('FILE_TOO_LARGE');
    }

    if (
        contentType.startsWith('text/') ||
        contentType.includes('application/json') ||
        contentType.includes('text/html')
    ) {
        throw new Error(
            'Download URL එකෙන් audio වෙනුවට webpage එකක් ලැබුණා.'
        );
    }

    // Prevent unexpectedly large downloads.
    if (!response.body) {
        throw new Error('Audio response එක හිස්.');
    }

    const chunks = [];
    let totalSize = 0;

    for await (const chunk of response.body) {
        const part = Buffer.from(chunk);

        totalSize += part.length;

        if (totalSize > MAX_AUDIO_SIZE) {
            try {
                await response.body.cancel();
            } catch {}

            throw new Error('FILE_TOO_LARGE');
        }

        chunks.push(part);
    }

    const buffer = Buffer.concat(chunks);

    if (!buffer.length) {
        throw new Error('Audio file එක හිස් (0 bytes).');
    }

    const hasId3 =
        buffer.length >= 3 &&
        buffer.toString('ascii', 0, 3) === 'ID3';

    const hasMpegFrame =
        buffer.length >= 2 &&
        buffer[0] === 0xFF &&
        (buffer[1] & 0xE0) === 0xE0;

    const hasMp4Signature =
        buffer.length >= 12 &&
        buffer.toString('ascii', 4, 8) === 'ftyp';

    const hasOggSignature =
        buffer.length >= 4 &&
        buffer.toString('ascii', 0, 4) === 'OggS';

    const hasWavSignature =
        buffer.length >= 12 &&
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WAVE';

    const isAudioContentType = contentType.startsWith('audio/');

    if (
        !isAudioContentType &&
        !hasId3 &&
        !hasMpegFrame &&
        !hasMp4Signature &&
        !hasOggSignature &&
        !hasWavSignature
    ) {
        throw new Error(
            `ලැබුණු ගොනුව audio එකක් නොවෙයි (${contentType || 'unknown'}).`
        );
    }

    return buffer;
}

async function showSongMenu(conn, mek, from) {
    return sendListMenu(
        conn,
        from,
        {
            title:
                '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━╮\n' +
                '┃ 🎧 *ʏᴏᴜᴛᴜʙᴇ ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n' +
                '┃\n' +
                '┃ 🎵 Search and download songs\n' +
                '╰━━━━━━━━━━━━━━━━━━╯',

            buttonText: 'SELECT OPTION',

            sections: [
                {
                    title: '🎶 MP3 OPTIONS',
                    rows: [
                        {
                            title: '🔎 Search Song',
                            description: 'Song name එකෙන් සොයන්න',
                            id: 'thenuva:mp3search'
                        },
                        {
                            title: '🔗 Download by URL',
                            description: 'YouTube link එක භාවිත කරන්න',
                            id: 'thenuva:mp3url'
                        }
                    ]
                }
            ],

            footer: FOOTER
        },
        mek
    );
}

async function processSong(conn, mek, from, query, reply, mode = 'search') {
    try {
        if (!APIFY_TOKEN) {
            return reply(
                '❌ APIFY_TOKEN එක Railway Variables වල සකස් කරන්න.'
            );
        }

        await conn.sendMessage(from, {
            react: { text: '🔎', key: mek.key }
        }).catch(() => {});

        let video;

        if (mode === 'url') {
            if (!isYouTubeUrl(query)) {
                return reply(
                    '❌ නිවැරදි YouTube URL එකක් එවන්න.\n' +
                    'උදා: https://youtu.be/VIDEO_ID'
                );
            }

            video = {
                url: query,
                title: 'YouTube Audio'
            };
        } else if (isYouTubeUrl(query)) {
            video = {
                url: query,
                title: 'YouTube Audio'
            };
        } else {
            const result = await yts(query);
            video = result?.videos?.[0];
        }

        if (!video?.url || !isYouTubeUrl(video.url)) {
            return reply('❌ YouTube song එක හමු වුණේ නැහැ.');
        }

        await reply(
            '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━╮\n' +
            '┃ 🎵 *ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            `┃ 📌 ${safeFileName(video.title || query)}\n` +
            '┃ ⏳ Audio එක බාගත කරමින්...\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );

        const actor = await getActorOutput(
            video.url,
            video.title || query
        );

        console.log('[APIFY MP3] Title:', actor.title);

        const audioBuffer = await downloadAudio(actor.audioUrl);

        console.log('[APIFY MP3] Downloaded bytes:', audioBuffer.length);

        await conn.sendMessage(
            from,
            {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${safeFileName(actor.title)}.mp3`,
                ptt: false
            },
            { quoted: mek }
        );

        await conn.sendMessage(from, {
            react: { text: '✅', key: mek.key }
        }).catch(() => {});

    } catch (error) {
        console.error('[APIFY MP3 ERROR]', error);

        await conn.sendMessage(from, {
            react: { text: '❌', key: mek.key }
        }).catch(() => {});

        const message = error.message === 'FILE_TOO_LARGE'
            ? 'Audio file එක 64 MB සීමාව ඉක්මවයි.'
            : String(error.message || 'Unknown error').slice(0, 250);

        return reply(
            '╭━━〔 *ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅ ғᴀɪʟᴇᴅ* 〕━━╮\n' +
            `┃ ❌ ${message}\n` +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );
    }
}

function registerSongListener(conn) {
    if (!conn?.ev || registeredListeners.has(conn)) return;

    registeredListeners.add(conn);

    conn.ev.on('messages.upsert', async ({ messages }) => {
        for (const incoming of messages || []) {
            try {
                if (!incoming?.message || incoming.key?.fromMe) continue;

                const from = incoming.key?.remoteJid;

                if (!from || from === 'status@broadcast') continue;

                const pending = pendingSongs.get(from);

                if (!pending) continue;

                const query = getMessageText(incoming);

                if (!query || query.startsWith('.')) continue;

                pendingSongs.delete(from);

                await processSong(
                    conn,
                    incoming,
                    from,
                    query,
                    text => conn.sendMessage(
                        from,
                        { text },
                        { quoted: incoming }
                    ),
                    pending.mode
                );
            } catch (error) {
                console.error('[MP3 LISTENER ERROR]', error);
            }
        }
    });
}

function requestSongInput(conn, from, mode, reply) {
    pendingSongs.set(from, { mode });

    return reply(
        mode === 'url'
            ? (
                '╭━━〔 *ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅ* 〕━━╮\n' +
                '┃ 🔗 YouTube URL එක එවන්න.\n' +
                '┃ උදා: https://youtu.be/VIDEO_ID\n' +
                '╰━━━━━━━━━━━━━━━━━━╯\n' +
                FOOTER
            )
            : (
                '╭━━〔 *sᴏɴɢ sᴇᴀʀᴄʜ* 〕━━╮\n' +
                '┃ 🎶 Song name එක එවන්න.\n' +
                '┃ උදා: Sinhala song name\n' +
                '╰━━━━━━━━━━━━━━━━━━╯\n' +
                FOOTER
            )
    );
}

cmd({
    pattern: 'mp3',
    alias: ['song', 'ytaudio', 'ytmp3'],
    react: '🎵',
    desc: 'YouTube MP3 downloader with select menu',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    registerSongListener(conn);

    const query = args.join(' ').trim();

    if (query) {
        return processSong(conn, mek, from, query, reply, 'search');
    }

    return showSongMenu(conn, mek, from);
});

cmd({
    pattern: 'mp3search',
    alias: [],
    desc: 'Search a song for MP3 download',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    registerSongListener(conn);
    return requestSongInput(conn, from, 'search', reply);
});

cmd({
    pattern: 'mp3url',
    alias: [],
    desc: 'Download MP3 from YouTube URL',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    registerSongListener(conn);
    return requestSongInput(conn, from, 'url', reply);
});
