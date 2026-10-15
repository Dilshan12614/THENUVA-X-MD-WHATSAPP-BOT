const { cmd } = require('../command');
const yts = require('yt-search');

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

function findAudioUrl(data) {
    const queue = Array.isArray(data) ? [...data] : [data];
    const seen = new Set();

    while (queue.length) {
        const item = queue.shift();

        if (!item || typeof item !== 'object' || seen.has(item)) {
            continue;
        }

        seen.add(item);

        for (const key of [
            'audioUrl',
            'audio_url',
            'downloadUrl',
            'download_url',
            'url',
            'link'
        ]) {
            const value = item[key];

            if (
                typeof value === 'string' &&
                /^https?:\/\//i.test(value) &&
                /\.(mp3|m4a)(?:[?#]|$)/i.test(value)
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

    while (queue.length) {
        const item = queue.shift();

        if (!item || typeof item !== 'object') continue;

        for (const key of ['title', 'fileTitle', 'videoTitle']) {
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
        console.error(
            '[APIFY MP3 NON-JSON]',
            responseText.slice(0, 500)
        );
        throw new Error('Apify වෙතින් JSON output එකක් ලැබුණේ නැහැ.');
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
        console.error('[APIFY MP3 EMPTY OUTPUT]', responseText.slice(0, 1500));
        throw new Error(
            'Apify output එක හිස්. Actor Log සහ Output පරීක්ෂා කරන්න.'
        );
    }

    const audioUrl = findAudioUrl(items);

    if (!audioUrl) {
        console.error(
            '[APIFY MP3 OUTPUT]',
            JSON.stringify(items).slice(0, 2500)
        );

        throw new Error(
            'MP3 URL එකක් ලැබුණේ නැහැ. Actor එක MP3 format එක සහාය දක්වනවාද බලන්න.'
        );
    }

    return {
        audioUrl,
        title: findTitle(items, fallbackTitle)
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
        const details = await response.text().catch(() => '');

        console.error(
            '[MP3 FILE HTTP ERROR]',
            response.status,
            details.slice(0, 500)
        );

        throw new Error(`Audio download HTTP ${response.status}`);
    }

    const contentType = (
        response.headers.get('content-type') || ''
    ).toLowerCase();

    if (
        contentType.startsWith('text/') ||
        contentType.includes('application/json')
    ) {
        const details = await response.text().catch(() => '');
        console.error('[MP3 INVALID CONTENT]', contentType, details.slice(0, 300));

        throw new Error('Download URL එක audio file එකක් ලබාදුන්නේ නැහැ.');
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

    const hasId3 =
        buffer.length >= 3 &&
        buffer.toString('ascii', 0, 3) === 'ID3';

    const hasMpegFrame =
        buffer.length >= 2 &&
        buffer[0] === 0xFF &&
        (buffer[1] & 0xE0) === 0xE0;

    if (
        !contentType.startsWith('audio/') &&
        !contentType.includes('application/octet-stream') &&
        !hasId3 &&
        !hasMpegFrame
    ) {
        throw new Error(
            `ලැබුණු ගොනුව MP3 audio එකක් නොවෙයි (${contentType || 'unknown'}).`
        );
    }

    return buffer;
}

async function processSong(conn, mek, from, query, reply) {
    try {
        if (!APIFY_TOKEN) {
            return reply(
                '❌ Railway Variables හෝ GitHub Secrets වල APIFY_TOKEN සකස් කරන්න.'
            );
        }

        await conn.sendMessage(from, {
            react: { text: '🔎', key: mek.key }
        });

        const video = isYouTubeUrl(query)
            ? { url: query, title: 'YouTube Audio' }
            : (await yts(query))?.videos?.[0];

        if (!video?.url || !isYouTubeUrl(video.url)) {
            return reply('❌ YouTube song එක හමු වුණේ නැහැ.');
        }

        await reply(
            '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━╮\n' +
            '┃ 🎵 *ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            `┃ 📌 ${video.title || query}\n` +
            '┃ ⏳ Audio එක බාගත කරමින්...\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );

        const actor = await getActorOutput(
            video.url,
            video.title || query
        );

        console.log('[APIFY MP3] Title:', actor.title);
        console.log('[APIFY MP3] Audio URL received:', Boolean(actor.audioUrl));

        const audioBuffer = await downloadAudio(actor.audioUrl);

        console.log('[APIFY MP3] Downloaded bytes:', audioBuffer.length);

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

        const message = error.message === 'FILE_TOO_LARGE'
            ? 'Audio file එක 64 MB සීමාව ඉක්මවයි.'
            : String(error.message || 'Unknown error').slice(0, 300);

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

                if (!from || !pendingSongs.has(from)) continue;

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
                    )
                );
            } catch (error) {
                console.error('[MP3 LISTENER ERROR]', error.message);
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
            '┃ 🎶 Song එකේ නම හෝ YouTube URL එක එවන්න.\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );
    }

    return processSong(conn, mek, from, query, reply);
});
