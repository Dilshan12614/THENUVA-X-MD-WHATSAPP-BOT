
const { cmd } = require('../command');
const yts = require('yt-search');
const { sendListMenu } = require('../lib/buttons');

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = 'ZSKNl5eniyeAPcPkf';
const API_URL =
    `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`;

const MAX_SIZE = 64 * 1024 * 1024;
const TIMEOUT = 300000;
const FOOTER = '> ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

// Video IDs are saved so the selection command can find the song.
const songResults = new Map();
const activeDownloads = new Set();

function cleanName(value) {
    return String(value || 'THENUVA-X-MD')
        .replace(/[\\/:*?"<>|\x00-\x1F]/g, '')
        .trim()
        .slice(0, 100) || 'THENUVA-X-MD';
}

function isYouTubeUrl(value) {
    try {
        const url = new URL(value);
        return [
            'youtube.com',
            'www.youtube.com',
            'm.youtube.com',
            'music.youtube.com',
            'youtu.be',
            'www.youtu.be'
        ].includes(url.hostname.toLowerCase());
    } catch {
        return false;
    }
}

async function searchSongs(query) {
    const result = await yts(query);
    const videos = result?.videos || [];
    const unique = new Map();

    for (const item of videos) {
        if (!item?.videoId || !/^[\w-]{11}$/.test(item.videoId)) {
            continue;
        }

        if (!unique.has(item.videoId)) {
            unique.set(item.videoId, {
                id: item.videoId,
                title: cleanName(item.title),
                url: `https://www.youtube.com/watch?v=${item.videoId}`,
                author: item.author?.name || 'YouTube',
                duration: item.timestamp || 'Unknown',
                savedAt: Date.now()
            });
        }

        if (unique.size >= 5) break;
    }

    return [...unique.values()];
}

async function getAudioUrl(video) {
    if (!APIFY_TOKEN) {
        throw new Error('APIFY_TOKEN is missing in Railway Variables.');
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

    const body = await response.text();

    if (!response.ok) {
        console.error('[MP3 API]', response.status, body.slice(0, 500));
        throw new Error(`Apify returned HTTP ${response.status}`);
    }

    let parsed;

    try {
        parsed = JSON.parse(body);
    } catch {
        throw new Error('Apify did not return valid JSON.');
    }

    const root = Array.isArray(parsed)
        ? parsed
        : [parsed];

    const queue = [...root];
    const visited = new Set();

    while (queue.length) {
        const item = queue.shift();

        if (!item || typeof item !== 'object' || visited.has(item)) {
            continue;
        }

        visited.add(item);

        // Prefer fields explicitly identified as audio/download URLs.
        for (const key of [
            'audioUrl',
            'audio_url',
            'mp3Url',
            'mp3_url',
            'audioDownloadUrl',
            'downloadUrl',
            'download_url'
        ]) {
            const value = item[key];

            if (
                typeof value === 'string' &&
                /^https?:\/\//i.test(value) &&
                !/\.html?(?:[?#]|$)/i.test(value)
            ) {
                return value;
            }
        }

        for (const [key, value] of Object.entries(item)) {
            if (
                value &&
                typeof value === 'object'
            ) {
                queue.push(value);
            } else if (
                typeof value === 'string' &&
                /^https?:\/\//i.test(value) &&
                /^(audio|mp3|download)/i.test(key)
            ) {
                return value;
            }
        }
    }

    console.error('[MP3 API OUTPUT]', JSON.stringify(parsed).slice(0, 2000));
    throw new Error('Apify output did not contain an audio download URL.');
}

async function downloadAudio(url) {
    const response = await fetch(url, {
        headers: { Accept: 'audio/*, application/octet-stream, */*' },
        signal: AbortSignal.timeout(TIMEOUT)
    });

    if (!response.ok) {
        throw new Error(`Audio server returned HTTP ${response.status}`);
    }

    const contentType =
        (response.headers.get('content-type') || '').toLowerCase();

    if (
        contentType.includes('text/html') ||
        contentType.startsWith('text/') ||
        contentType.includes('application/json')
    ) {
        throw new Error('Download server returned a webpage instead of audio.');
    }

    const declaredSize = Number(
        response.headers.get('content-length') || 0
    );

    if (declaredSize > MAX_SIZE) {
        throw new Error('FILE_TOO_LARGE');
    }

    if (!response.body) {
        throw new Error('Empty audio response.');
    }

    const chunks = [];
    let totalSize = 0;

    for await (const chunk of response.body) {
        const buffer = Buffer.from(chunk);
        totalSize += buffer.length;

        if (totalSize > MAX_SIZE) {
            try {
                await response.body.cancel();
            } catch {}

            throw new Error('FILE_TOO_LARGE');
        }

        chunks.push(buffer);
    }

    const audio = Buffer.concat(chunks);

    if (!audio.length) {
        throw new Error('Downloaded audio is empty.');
    }

    const looksLikeAudio =
        audio.subarray(0, 3).toString() === 'ID3' ||
        (
            audio.length > 1 &&
            audio[0] === 0xff &&
            (audio[1] & 0xe0) === 0xe0
        ) ||
        audio.subarray(4, 8).toString() === 'ftyp' ||
        audio.subarray(0, 4).toString() === 'OggS';

    if (!contentType.startsWith('audio/') && !looksLikeAudio) {
        throw new Error('The downloaded file does not look like audio.');
    }

    return audio;
}

async function sendSelectedSong(conn, mek, from, video) {
    if (activeDownloads.has(from)) {
        return conn.sendMessage(
            from,
            { text: '⏳ Download එකක් දැනට ක්‍රියාත්මකයි. ටිකක් ඉන්න.' },
            { quoted: mek }
        );
    }

    activeDownloads.add(from);

    try {
        await conn.sendMessage(from, {
            text:
                '╭━━〔 *ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅ* 〕━━╮\n' +
                `┃ 🎵 ${video.title}\n` +
                '┃ ⏳ Audio එක සකස් කරමින්...\n' +
                '╰━━━━━━━━━━━━━━━━━━╯\n' +
                FOOTER
        }, { quoted: mek });

        const audioUrl = await getAudioUrl(video);
        const audio = await downloadAudio(audioUrl);

        await conn.sendMessage(from, {
            audio,
            mimetype: 'audio/mpeg',
            fileName: `${cleanName(video.title)}.mp3`,
            ptt: false
        }, { quoted: mek });

    } catch (error) {
        console.error('[MP3 DOWNLOAD ERROR]', error);

        const reason = error.message === 'FILE_TOO_LARGE'
            ? 'Audio file එක 64 MB සීමාව ඉක්මවයි.'
            : String(error.message || 'Unknown error').slice(0, 250);

        await conn.sendMessage(from, {
            text: `❌ *MP3 Download Failed*\n${reason}\n\n${FOOTER}`
        }, { quoted: mek });

    } finally {
        activeDownloads.delete(from);
    }
}

// Search songs and show a separate selection button for each result.
cmd({
    pattern: 'mp3',
    alias: ['song', 'ytaudio', 'ytmp3'],
    react: '🎵',
    desc: 'Search songs and download MP3',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    const query = (args || []).join(' ').trim();

    if (!query) {
        return reply(
            '🎧 *YouTube MP3 Downloader*\n\n' +
            'Song එකේ නම සමඟ command එක ගහන්න.\n\n' +
            'උදාහරණය: `.mp3 sansara sihine`\n\n' +
            'ඊට පස්සේ කැමති song button එක ඔබන්න.\n' +
            FOOTER
        );
    }

    if (isYouTubeUrl(query)) {
        let videoId;

        try {
            const url = new URL(query);
            videoId = url.hostname.includes('youtu.be')
                ? url.pathname.split('/').filter(Boolean)[0]
                : url.searchParams.get('v');
        } catch {}

        if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
            return reply('❌ නිවැරදි YouTube video link එකක් දෙන්න.');
        }

        return sendSelectedSong(conn, mek, from, {
            id: videoId,
            title: 'YouTube Audio',
            url: `https://www.youtube.com/watch?v=${videoId}`
        });
    }

    try {
        await conn.sendMessage(from, {
            react: { text: '🔎', key: mek.key }
        }).catch(() => {});

        const results = await searchSongs(query);

        if (!results.length) {
            return reply('❌ ගීත හමු වුණේ නැහැ. වෙනත් නමක් උත්සාහ කරන්න.');
        }

        for (const video of results) {
            songResults.set(video.id, video);
        }

        // Remove expired search results from memory.
        for (const [id, video] of songResults) {
            if (Date.now() - video.savedAt > 15 * 60 * 1000) {
                songResults.delete(id);
            }
        }

        return await sendListMenu(conn, from, {
            title:
                '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━╮\n' +
                '┃ 🎧 *SELECT YOUR SONG*\n' +
                `┃ 🔎 ${cleanName(query)}\n` +
                '┃\n' +
                '┃ ගීතයක් තෝරන්න.\n' +
                '┃ තේරූ විගස download වේ.\n' +
                '╰━━━━━━━━━━━━━━━━━━╯',

            buttonText: 'SELECT SONG',

            sections: [{
                title: '🎵 SEARCH RESULTS',
                rows: results.map((video, index) => ({
                    id: `thenuva:mp3pick:${video.id}`,
                    title: `${index + 1}. ${video.title}`.slice(0, 70),
                    description:
                        `${video.author} • ${video.duration}`.slice(0, 70)
                }))
            }],

            footer: FOOTER
        }, mek);

    } catch (error) {
        console.error('[MP3 SEARCH ERROR]', error);
        return reply(
            '❌ Song search අසාර්ථකයි.\n' +
            'yt-search package එක සහ internet connection එක පරීක්ෂා කරන්න.'
        );
    }
});

// This command is called by button-actions.js after a song is selected.
cmd({
    pattern: 'mp3pick',
    desc: 'Download the selected song',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    const videoId = String((args || [])[0] || '').trim();

    if (!/^[\w-]{11}$/.test(videoId)) {
        return reply('❌ Song selection එක නිවැරදි නැහැ. .mp3 නැවත භාවිත කරන්න.');
    }

    const video = songResults.get(videoId);

    if (!video || Date.now() - video.savedAt > 15 * 60 * 1000) {
        songResults.delete(videoId);

        return reply(
            '⌛ මේ song selection එක කල් ඉකුත් වෙලා.\n' +
            'නැවත `.mp3 song name` භාවිත කර ගීතයක් තෝරන්න.'
        );
    }

    return sendSelectedSong(conn, mek, from, video);
});
