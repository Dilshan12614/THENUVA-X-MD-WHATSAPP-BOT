const { cmd } = require('../command');
const yts = require('yt-search');

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = 's62HHSEOW9w92prnI';

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

function safeFileName(value) {
    return String(value || 'THENUVA-X-MD')
        .replace(/[\\/:*?"<>|\x00-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100) || 'THENUVA-X-MD';
}

function getMessageText(message) {
    const msg = message?.message || {};
    const inner = msg.ephemeralMessage?.message || {};

    return (
        msg.conversation ||
        msg.extendedTextMessage?.text ||
        msg.imageMessage?.caption ||
        msg.videoMessage?.caption ||
        inner.conversation ||
        inner.extendedTextMessage?.text ||
        ''
    ).trim();
}

async function getActorOutput(videoUrl) {
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
                includeInfo: true,
                maxRequestRetries: 3,
                proxyConfiguration: {
                    useApifyProxy: true
                },
                youtubeUrls: [
                    { url: videoUrl }
                ]
            }),
            signal: AbortSignal.timeout(TIMEOUT)
        }
    );

    const text = await response.text();

    if (!response.ok) {
        console.error(
            '[APIFY MP3 HTTP ERROR]',
            response.status,
            text.slice(0, 1000)
        );

        throw new Error(`Apify HTTP ${response.status}`);
    }

    let output;

    try {
        output = JSON.parse(text);
    } catch {
        console.error(
            '[APIFY MP3 NON-JSON RESPONSE]',
            response.headers.get('content-type'),
            text.slice(0, 300)
        );

        throw new Error('Apify Actor එකෙන් වලංගු JSON output එකක් ලැබුණේ නැහැ.');
    }

    // Apify run-sync-get-dataset-items normally returns an array.
    // Also tolerate an object wrapper if the Actor returns one.
    let items = Array.isArray(output)
        ? output
        : Array.isArray(output?.items)
            ? output.items
            : Array.isArray(output?.data)
                ? output.data
                : output && typeof output === 'object'
                    ? [output]
                    : [];

    if (!items.length) {
        console.error(
            '[APIFY MP3 EMPTY OUTPUT]',
            text.slice(0, 1500)
        );

        throw new Error(
            'Apify output එක හිස්. Actor Run → Output සහ Log පරීක්ෂා කරන්න.'
        );
    }

    const item = items.find(
        entry => entry && (
            entry.fileUrl ||
            entry.audioUrl ||
            entry.audio_url ||
            entry.downloadUrl ||
            entry.download_url
        )
    );

    if (!item) {
        console.error(
            '[APIFY MP3 OUTPUT]',
            JSON.stringify(output).slice(0, 2000)
        );

        throw new Error('Output එකේ audio file URL එකක් හමු වුණේ නැහැ.');
    }

    const audioUrl =
        item.fileUrl ||
        item.audioUrl ||
        item.audio_url ||
        item.downloadUrl ||
        item.download_url;

    if (!/^https?:\/\//i.test(audioUrl)) {
        throw new Error('Actor එකෙන් ලැබුණු audio URL එක වලංගු නැහැ.');
    }

    return {
        audioUrl,
        title: safeFileName(
            item.fileTitle ||
            item.title ||
            item.information?.title ||
            item.information?.videoTitle ||
            'THENUVA-X-MD'
        )
    };
}

async function downloadAudio(audioUrl) {
    const response = await fetch(audioUrl, {
        headers: {
            Accept: 'audio/*, application/octet-stream, */*'
        },
        signal: AbortSignal.timeout(TIMEOUT)
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');

        console.error(
            '[MP3 FILE URL ERROR]',
            response.status,
            errorText.slice(0, 500)
        );

        throw new Error(`Audio URL HTTP ${response.status}`);
    }

    const contentType = (
        response.headers.get('content-type') || ''
    ).toLowerCase();

    // The Actor may return audio/mp3 rather than audio/mpeg.
    if (
        contentType.includes('application/json') ||
        contentType.includes('text/html') ||
        contentType.startsWith('text/')
    ) {
        const body = await response.text().catch(() => '');

        console.error(
            '[MP3 INVALID CONTENT]',
            contentType,
            body.slice(0, 500)
        );

        throw new Error(
            `Audio URL එක audio file එකක් ලබාදුන්නේ නැහැ (${contentType}).`
        );
    }

    const declaredSize = Number(
        response.headers.get('content-length') || 0
    );

    if (declaredSize > MAX_AUDIO_SIZE) {
        throw new Error('FILE_TOO_LARGE');
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (!buffer.length) {
        throw new Error('Audio file එක හිස් (0 bytes).');
    }

    if (buffer.length > MAX_AUDIO_SIZE) {
        throw new Error('FILE_TOO_LARGE');
    }

    // Accept audio/*, including audio/mp3.
    // If the server omits the MIME type, check common MP3 signatures.
    const hasId3Header =
        buffer.length >= 3 &&
        buffer.toString('ascii', 0, 3) === 'ID3';

    const hasMpegFrame =
        buffer.length >= 2 &&
        buffer[0] === 0xFF &&
        (buffer[1] & 0xE0) === 0xE0;

    if (
        !contentType.startsWith('audio/') &&
        !contentType.includes('application/octet-stream') &&
        !hasId3Header &&
        !hasMpegFrame
    ) {
        throw new Error(
            `ලැබුණු file එක audio/MP3 එකක් නොවෙයි (${contentType || 'unknown'}).`
        );
    }

    return buffer;
}

async function processSong(conn, mek, from, query, reply) {
    try {
        if (!APIFY_TOKEN) {
            return reply(
                '╭━━〔 *ᴀᴘɪ ᴄᴏɴғɪɢ* 〕━━╮\n' +
                '┃ ❌ Railway Variables හෝ GitHub Secrets වල\n' +
                '┃ APIFY_TOKEN සකස් කරන්න.\n' +
                '┣━━━━━━━━━━━━━━━━━━╯\n' +
                FOOTER
            );
        }

        await conn.sendMessage(from, {
            react: { text: '🔎', key: mek.key }
        });

        const video = isYouTubeUrl(query)
            ? { url: query }
            : (await yts(query))?.videos?.[0];

        if (!video?.url) {
            return reply(
                '╭━━〔 *sᴏɴɢ ɴᴏᴛ ғᴏᴜɴᴅ* 〕━━╮\n' +
                '┃ ❌ YouTube song එක හමු වුණේ නැහැ.\n' +
                '┃ ➜ වෙනත් නමක් යොදා උත්සාහ කරන්න.\n' +
                '┣━━━━━━━━━━━━━━━━━━╯\n' +
                FOOTER
            );
        }

        await reply(
            '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━╮\n' +
            '┃ 🎵 *ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            '┃ 🔎 Song found!\n' +
            `┃ 📌 ${video.title || query}\n` +
            '┃ ⏳ Downloading audio...\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );

        const actor = await getActorOutput(video.url);

        console.log('[APIFY MP3] Title:', actor.title);
        console.log('[APIFY MP3] Audio URL received:', Boolean(actor.audioUrl));

        const audioBuffer = await downloadAudio(actor.audioUrl);

        console.log(
            '[APIFY MP3] Downloaded bytes:',
            audioBuffer.length
        );

        await conn.sendMessage(
            from,
            {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${actor.title}.mp3`,
                ptt: false
            },
            { quoted: mek }
        );

        await conn.sendMessage(from, {
            react: { text: '✅', key: mek.key }
        });

    } catch (error) {
        console.error('[APIFY MP3 ERROR]', error);

        await conn.sendMessage(from, {
            react: { text: '❌', key: mek.key }
        }).catch(() => {});

        return reply(
            '╭━━〔 *ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅ ғᴀɪʟᴇᴅ* 〕━━╮\n' +
            `┃ ❌ ${
                error.message === 'FILE_TOO_LARGE'
                    ? 'Audio file එක 64 MB සීමාව ඉක්මවයි.'
                    : String(error.message || 'Unknown error').slice(0, 350)
            }\n` +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );
    }
}

function registerSongListener(conn) {
    if (!conn?.ev || registeredListeners.has(conn)) {
        return;
    }

    registeredListeners.add(conn);

    conn.ev.on('messages.upsert', async ({ messages }) => {
        for (const incoming of messages || []) {
            try {
                if (!incoming?.message || incoming.key?.fromMe) {
                    continue;
                }

                const from = incoming.key?.remoteJid;

                if (!from || !pendingSongs.has(from)) {
                    continue;
                }

                const query = getMessageText(incoming);

                if (!query || query.startsWith('.')) {
                    continue;
                }

                pendingSongs.delete(from);

                await processSong(
                    conn,
                    incoming,
                    from,
                    query,
                    async text => conn.sendMessage(
                        from,
                        { text },
                        { quoted: incoming }
                    ).then(() => {})
                );

            } catch (error) {
                console.error('[MP3 SONG LISTENER ERROR]', error.message);
            }
        }
    });
}

cmd({
    pattern: 'mp3',
    alias: ['song', 'ytaudio', 'ytmp3'],
    react: '🎵',
    desc: 'Search and download YouTube song as MP3',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    registerSongListener(conn);

    const query = args.join(' ').trim();

    if (!query) {
        pendingSongs.set(from, true);

        return reply(
            '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━╮\n' +
            '┃ 🎵 *ʏᴏᴜᴛᴜʙᴇ ᴍᴘ3 sᴇᴀʀᴄʜ*\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            '┃ 🎶 දැන් song එකේ නම එවන්න.\n' +
            '┃ ➜ YouTube URL එකක් වුණත් පුළුවන්.\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );
    }

    return processSong(conn, mek, from, query, reply);
});
