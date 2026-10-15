const { cmd } = require('../command');
const yts = require('yt-search');
const { sendListMenu } = require('../lib/buttons');

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = 'ZSKNl5eniyeAPcPkf';
const API_URL =
    `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`;

const TIMEOUT = 300000;
const MAX_AUDIO_SIZE = 64 * 1024 * 1024;
const FOOTER = '> ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

// Selected songs are kept in memory until download completes.
const songs = new Map();
const activeDownloads = new Set();
const registeredListeners = new WeakSet();

function safeName(value) {
    return String(value || 'THENUVA-X-MD')
        .replace(/[\\/:*?"<>|\x00-\x1F]/g, '')
        .trim()
        .slice(0, 100) || 'THENUVA-X-MD';
}

function isYouTubeUrl(value) {
    try {
        const url = new URL(value);
        return ['youtube.com', 'www.youtube.com', 'm.youtube.com',
            'music.youtube.com', 'youtu.be', 'www.youtu.be']
            .includes(url.hostname.toLowerCase()) &&
            ['http:', 'https:'].includes(url.protocol);
    } catch {
        return false;
    }
}

async function searchSongs(query) {
    const result = await yts(query);
    const videos = result?.videos || [];
    const unique = new Map();

    for (const video of videos) {
        if (!video?.videoId || !/^[\w-]{11}$/.test(video.videoId)) {
            continue;
        }

        if (!unique.has(video.videoId)) {
            unique.set(video.videoId, {
                id: video.videoId,
                title: safeName(video.title),
                url: `https://www.youtube.com/watch?v=${video.videoId}`,
                duration: video.timestamp || 'Unknown',
                author: video.author?.name || 'YouTube'
            });
        }

        if (unique.size >= 5) break;
    }

    return [...unique.values()];
}

async function getActorAudio(video) {
    if (!APIFY_TOKEN) {
        throw new Error('Railway Variables වල APIFY_TOKEN සකස් කරන්න.');
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
                urls: [{ url: video.url }],
                quality: '1080',
                format: 'mp3',
                residentialProxyMode: 'disabled',
                proxyCountry: ''
            }),
            signal: AbortSignal.timeout(TIMEOUT)
        }
    );

    const text = await response.text();

    if (!response.ok) {
        console.error('[MP3 APIFY ERROR]', response.status, text.slice(0, 500));
        throw new Error(`Apify HTTP ${response.status}`);
    }

    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error('Apify වෙතින් නිවැරදි JSON ලැබුණේ නැහැ.');
    }

    const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.data)
                ? data.data
                : [data];

    const queue = [...items];
    const seen = new Set();
    let audioUrl = null;

    while (queue.length) {
        const item = queue.shift();
        if (!item || typeof item !== 'object' || seen.has(item)) continue;
        seen.add(item);

        for (const key of [
            'audioUrl', 'audio_url', 'mp3Url', 'mp3_url',
            'audioDownloadUrl', 'downloadUrl', 'download_url'
        ]) {
            const value = item[key];

            if (
                typeof value === 'string' &&
                /^https?:\/\//i.test(value) &&
                !/\.html?(?:[?#]|$)/i.test(value)
            ) {
                audioUrl = value;
                break;
            }
        }

        if (audioUrl) break;

        for (const [key, value] of Object.entries(item)) {
            if (
                typeof value === 'string' &&
                /^https?:\/\//i.test(value) &&
                /^(audio|mp3|download|link|url)/i.test(key)
            ) {
                audioUrl = value;
                break;
            }

            if (value && typeof value === 'object') queue.push(value);
        }

        if (audioUrl) break;
    }

    if (!audioUrl) {
        console.error('[MP3 ACTOR OUTPUT]', JSON.stringify(items).slice(0, 2000));
        throw new Error('Apify output එකෙන් audio URL එක හමු වුණේ නැහැ.');
    }

    return audioUrl;
}

async function downloadAudio(url) {
    const response = await fetch(url, {
        redirect: 'follow',
        headers: { Accept: 'audio/*, application/octet-stream, */*' },
        signal: AbortSignal.timeout(TIMEOUT)
    });

    if (!response.ok) throw new Error(`Audio HTTP ${response.status}`);

    const type = (response.headers.get('content-type') || '').toLowerCase();

    if (
        type.startsWith('text/') ||
        type.includes('html') ||
        type.includes('json')
    ) {
        throw new Error('Download URL එක audio වෙනුවට webpage එකක් ලබා දුන්නා.');
    }

    const size = Number(response.headers.get('content-length') || 0);
    if (size > MAX_AUDIO_SIZE) throw new Error('FILE_TOO_LARGE');

    if (!response.body) throw new Error('Audio response එක හිස්.');

    const chunks = [];
    let total = 0;

    for await (const chunk of response.body) {
        const buffer = Buffer.from(chunk);
        total += buffer.length;

        if (total > MAX_AUDIO_SIZE) {
            try {
                await response.body.cancel();
            } catch {}
            throw new Error('FILE_TOO_LARGE');
        }

        chunks.push(buffer);
    }

    const buffer = Buffer.concat(chunks);

    const validSignature =
        buffer.subarray(0, 3).toString() === 'ID3' ||
        (buffer.length > 1 &&
            buffer[0] === 0xff &&
            (buffer[1] & 0xe0) === 0xe0) ||
        buffer.subarray(4, 8).toString() === 'ftyp' ||
        buffer.subarray(0, 4).toString() === 'OggS' ||
        buffer.subarray(8, 12).toString() === 'WAVE';

    if (!buffer.length || (!type.startsWith('audio/') && !validSignature)) {
        throw new Error('ලැබුණු file එක audio file එකක් නොවෙයි.');
    }

    return buffer;
}

async function downloadSelected(conn, mek, from, video) {
    if (activeDownloads.has(from)) {
        return conn.sendMessage(
            from,
            { text: '⏳ මේ chat එකේ download එකක් දැනට ක්‍රියාත්මකයි.' },
            { quoted: mek }
        );
    }

    activeDownloads.add(from);

    try {
        await conn.sendMessage(from, {
            react: { text: '⬇️', key: mek.key }
        }).catch(() => {});

        await conn.sendMessage(from, {
            text:
                '╭━━〔 *ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅ* 〕━━╮\n' +
                `┃ 🎵 ${video.title}\n` +
                '┃ ⏳ Audio එක සකස් කරමින්...\n' +
                '╰━━━━━━━━━━━━━━━━━━╯\n' + FOOTER
        }, { quoted: mek });

        const audioUrl = await getActorAudio(video);
        const audio = await downloadAudio(audioUrl);

        await conn.sendMessage(from, {
            audio,
            mimetype: 'audio/mpeg',
            fileName: `${safeName(video.title)}.mp3`,
            ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, {
            react: { text: '✅', key: mek.key }
        }).catch(() => {});
    } catch (error) {
        console.error('[MP3 DOWNLOAD ERROR]', error);

        const message = error.message === 'FILE_TOO_LARGE'
            ? 'Audio එක 64 MB සීමාව ඉක්මවයි.'
            : String(error.message || 'Download failed').slice(0, 220);

        await conn.sendMessage(from, {
            text: `❌ *MP3 Download Failed*\n${message}\n\n${FOOTER}`
        }, { quoted: mek });

        await conn.sendMessage(from, {
            react: { text: '❌', key: mek.key }
        }).catch(() => {});
    } finally {
        activeDownloads.delete(from);
    }
}

async function showResults(conn, mek, from, query) {
    const results = await searchSongs(query);

    if (!results.length) {
        return conn.sendMessage(from, {
            text: '❌ ගීත හමු වුණේ නැහැ. වෙනත් නමක් උත්සාහ කරන්න.'
        }, { quoted: mek });
    }

    for (const video of results) {
        songs.set(video.id, video);
    }

    return sendListMenu(conn, from, {
        title:
            '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━╮\n' +
            '┃ 🎧 *SELECT YOUR SONG*\n' +
            `┃ 🔎 ${safeName(query)}\n` +
            '┃\n' +
            '┃ කැමති ගීතය තෝරන්න.\n' +
            '┃ තේරූ විගස MP3 download වේ.\n' +
            '╰━━━━━━━━━━━━━━━━━━╯',

        buttonText: 'SELECT SONG',

        sections: [{
            title: '🎵 YOUTUBE RESULTS',
            rows: results.map((video, index) => ({
                id: `thenuva:mp3pick:${video.id}`,
                title: `${index + 1}. ${video.title}`.slice(0, 70),
                description: `${video.author} • ${video.duration}`.slice(0, 70)
            }))
        }],

        footer: FOOTER
    }, mek);
}

function registerListener(conn) {
    if (!conn?.ev || registeredListeners.has(conn)) return;
    registeredListeners.add(conn);

    conn.ev.on('messages.upsert', async ({ messages }) => {
        for (const message of messages || []) {
            try {
                if (!message?.message || message.key?.fromMe) continue;

                const msg = message.message;
                const id =
                    msg.interactiveResponseMessage?.nativeFlowResponseMessage
                        ?.paramsJson;

                if (!id) continue;

                let parsed;
                try {
                    parsed = JSON.parse(id);
                } catch {
                    continue;
                }

                const match = /^thenuva:mp3pick:([\w-]{11})$/.exec(
                    parsed.id || ''
                );

                if (!match) continue;

                const from = message.key.remoteJid;
                const video = songs.get(match[1]);

                if (!from || !video) {
                    await conn.sendMessage(from, {
                        text: '❌ මෙම තේරීම කල් ඉකුත් වී ඇත. .mp3 නැවත ගහන්න.'
                    }, { quoted: message });
                    continue;
                }

                // Delete before starting to prevent repeated clicks.
                songs.delete(match[1]);

                await downloadSelected(conn, message, from, video);
            } catch (error) {
                console.error('[MP3 BUTTON ERROR]', error);
            }
        }
    });
}

cmd({
    pattern: 'mp3',
    alias: ['song', 'ytaudio', 'ytmp3'],
    react: '🎵',
    desc: 'Search YouTube songs and download MP3',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    registerListener(conn);

    const query = args.join(' ').trim();

    if (!query) {
        return reply(
            '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━╮\n' +
            '┃ 🎧 *ʏᴏᴜᴛᴜʙᴇ ᴍᴘ3*\n' +
            '┃\n' +
            '┃ 🎶 Song එකේ නම සමඟ command එක ගහන්න.\n' +
            '┃ උදා: .mp3 sansara sihine\n' +
            '╰━━━━━━━━━━━━━━━━━━╯\n' + FOOTER
        );
    }

    if (isYouTubeUrl(query)) {
        const video = {
            id: query.match(/(?:v=|youtu\.be\/)([\w-]{11})/)?.[1],
            title: 'YouTube Audio',
            url: query,
            author: 'YouTube',
            duration: 'Unknown'
        };

        if (!video.id) {
            return reply('❌ නිවැරදි YouTube video URL එකක් එවන්න.');
        }

        return downloadSelected(conn, mek, from, video);
    }

    try {
        await conn.sendMessage(from, {
            react: { text: '🔎', key: mek.key }
        }).catch(() => {});

        return await showResults(conn, mek, from, query);
    } catch (error) {
        console.error('[MP3 SEARCH ERROR]', error);
        return reply('❌ Song search අසාර්ථකයි. ටික වේලාවකින් නැවත උත්සාහ කරන්න.');
    }
});
