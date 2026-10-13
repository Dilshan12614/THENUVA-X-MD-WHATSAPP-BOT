const { cmd } = require('../command');
const yts = require('yt-search');
const { ytmp3 } = require('@vreden/youtube_scraper');
const { sendListMenu } = require('../lib/buttons');

const FOOTER = 'ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ';

const pendingSongs = new Map();
const activeDownloads = new Set();

const MAX_FILE_SIZE = 64 * 1024 * 1024;
const MAX_DURATION = 30 * 60;

function isYouTubeUrl(text) {
    try {
        const url = new URL(String(text).trim());

        return (
            ['youtube.com', 'www.youtube.com', 'm.youtube.com',
             'music.youtube.com', 'youtu.be', 'www.youtu.be'].includes(
                url.hostname.toLowerCase()
            ) &&
            ['http:', 'https:'].includes(url.protocol)
        );
    } catch {
        return false;
    }
}

function safeFileName(name) {
    return String(name || 'THENUVA-SONG')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 150) || 'THENUVA-SONG';
}

function getDurationSeconds(timestamp) {
    if (!timestamp || typeof timestamp !== 'string') {
        return 0;
    }

    const parts = timestamp.split(':').map(Number);

    if (
        !parts.length ||
        parts.some(part => !Number.isFinite(part) || part < 0)
    ) {
        return 0;
    }

    return parts.reduce((total, part) => total * 60 + part, 0);
}

async function findSong(query) {
    if (isYouTubeUrl(query)) {
        const result = await yts(query);
        const videos = result?.videos || [];

        const requestedUrl = new URL(query);
        const requestedId = requestedUrl.hostname.includes('youtu.be')
            ? requestedUrl.pathname.slice(1)
            : requestedUrl.searchParams.get('v');

        const exact = videos.find(video => {
            try {
                return new URL(video.url).searchParams.get('v') === requestedId ||
                    new URL(video.url).pathname.slice(1) === requestedId;
            } catch {
                return false;
            }
        });

        if (exact) return exact;

        throw new Error('ඒ YouTube video එක සොයාගන්න බැරි වුණා.');
    }

    const result = await yts(query);
    const videos = result?.videos || [];

    if (!videos.length) {
        throw new Error('Song එකක් හමු වුණේ නැහැ.');
    }

    return videos[0];
}

async function getDownloadUrl(songUrl) {
    if (!isYouTubeUrl(songUrl)) {
        throw new Error('වලංගු YouTube URL එකක් නොවේ.');
    }

    const result = await ytmp3(songUrl, '192');

    if (!result || result.success === false || result.status === false) {
        throw new Error(
            result?.message ||
            result?.error ||
            'MP3 conversion failed.'
        );
    }

    const candidates = [
        result?.download?.url,
        result?.download?.link,
        result?.data?.download?.url,
        result?.data?.download?.link,
        result?.data?.url,
        result?.data?.link,
        result?.downloadUrl,
        result?.download_url,
        result?.url,
        result?.link
    ];

    const downloadUrl = candidates.find(
        value => typeof value === 'string' && value.trim()
    );

    if (!downloadUrl) {
        console.error(
            '[SONG API] No download URL. Response keys:',
            Object.keys(result || {})
        );

        throw new Error(
            'API එකෙන් download URL එකක් ලැබුණේ නැහැ. API response එක පරීක්ෂා කරන්න.'
        );
    }

    let parsedUrl;

    try {
        parsedUrl = new URL(downloadUrl);
    } catch {
        throw new Error('API එකෙන් ලැබුණු download URL එක වලංගු නැහැ.');
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Download URL protocol එක වලංගු නැහැ.');
    }

    return parsedUrl.href;
}

function looksLikeMp3(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
        return false;
    }

    // ID3 metadata header
    if (
        buffer[0] === 0x49 &&
        buffer[1] === 0x44 &&
        buffer[2] === 0x33
    ) {
        return true;
    }

    // MPEG audio frame sync
    for (let i = 0; i < Math.min(buffer.length - 1, 8192); i++) {
        if (
            buffer[i] === 0xff &&
            (buffer[i + 1] & 0xe0) === 0xe0
        ) {
            return true;
        }
    }

    return false;
}

async function downloadSong(conn, from, quoted, song, format) {
    const key = `${from}:${format}`;

    if (activeDownloads.has(key)) {
        return conn.sendMessage(from, {
            text: '⏳ *මේ format එකේ download එකක් දැනටමත් ක්‍රියාත්මකයි.*'
        }, { quoted });
    }

    activeDownloads.add(key);

    try {
        await conn.sendMessage(from, {
            text: format === 'audio'
                ? '🎧 *MP3 Audio එක සකස් කරමින්... ටිකක් ඉන්න.*'
                : '📁 *MP3 Document එක සකස් කරමින්... ටිකක් ඉන්න.*'
        }, { quoted });

        const downloadUrl = await getDownloadUrl(song.url);

        const response = await fetch(downloadUrl, {
            signal: AbortSignal.timeout(120000),
            headers: {
                'User-Agent': 'Mozilla/5.0 THENUVA-X-MD'
            }
        });

        if (!response.ok) {
            throw new Error(`Download server HTTP ${response.status}`);
        }

        const contentType = (
            response.headers.get('content-type') || ''
        ).toLowerCase();

        if (
            contentType.includes('text/html') ||
            contentType.includes('application/json') ||
            contentType.includes('text/plain')
        ) {
            throw new Error(
                'Server එක MP3 file එක වෙනුවට HTML/text response එකක් ලබා දුන්නා.'
            );
        }

        const declaredSize = Number(
            response.headers.get('content-length') || 0
        );

        if (declaredSize > MAX_FILE_SIZE) {
            throw new Error('File එක 64 MB සීමාව ඉක්මවා තිබෙනවා.');
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (!buffer.length) {
            throw new Error('Downloaded file එක හිස්.');
        }

        if (buffer.length > MAX_FILE_SIZE) {
            throw new Error('File එක 64 MB සීමාව ඉක්මවා තිබෙනවා.');
        }

        if (!looksLikeMp3(buffer)) {
            throw new Error(
                'ලැබුණු file එක වලංගු MP3 audio එකක් නොවේ. API එකේ download response එක පරීක්ෂා කරන්න.'
            );
        }

        const fileName = `${safeFileName(song.title)}.mp3`;

        if (format === 'audio') {
            await conn.sendMessage(from, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                fileName,
                ptt: false
            }, { quoted });
        } else {
            await conn.sendMessage(from, {
                document: buffer,
                mimetype: 'audio/mpeg',
                fileName,
                caption:
                    `╭─〔 *🎵 SONG DOWNLOADED 🎵* 〕\n` +
                    `│\n` +
                    `│ 🎶 *Title:* ${song.title}\n` +
                    `│ ⏱️ *Duration:* ${song.timestamp || 'Unknown'}\n` +
                    `│\n` +
                    `╰────────────────\n\n` +
                    `*${FOOTER}*`
            }, { quoted });
        }

    } catch (error) {
        console.error('[SONG DOWNLOAD ERROR]', error);

        await conn.sendMessage(from, {
            text:
                `❌ *Download failed!*\n\n` +
                `${error.message || 'Unknown error'}\n\n` +
                `🔄 නැවත උත්සාහ කරන්න.`
        }, { quoted }).catch(err => {
            console.error('[SONG ERROR MESSAGE]', err);
        });

    } finally {
        activeDownloads.delete(key);
    }
}

// ==========================================
// SONG SEARCH + FORMAT MENU
// ==========================================

cmd({
    pattern: 'song',
    alias: ['play', 'music', 'ytmp3'],
    react: '🎵',
    desc: 'Search and download YouTube songs',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const query = String(q || '').trim();

        if (!query) {
            return reply(
                '╭─〔 *🎵 SONG DOWNLOADER* 〕\n' +
                '│\n' +
                '│ 🎧 YouTube song එකක් download කරන්න.\n' +
                '│\n' +
                '│ *භාවිතය:*\n' +
                '│ .song song name\n' +
                '│\n' +
                '│ *උදාහරණය:*\n' +
                '│ .song Shape of You\n' +
                '╰────────────────\n\n' +
                `*${FOOTER}*`
            );
        }

        await reply('🔎 *Song එක සොයමින්...*');

        const song = await findSong(query);
        const durationText = song.timestamp || 'Unknown';
        const seconds = getDurationSeconds(durationText);

        if (seconds > MAX_DURATION) {
            return reply(
                '⚠️ *විනාඩි 30කට වඩා දිග audio සඳහා සහාය නොදක්වයි.*'
            );
        }

        // Save the selected song for this chat.
        pendingSongs.set(from, {
            url: song.url,
            title: song.title,
            timestamp: durationText,
            thumbnail: song.thumbnail || null,
            author: song.author?.name || 'Unknown',
            selectedAt: Date.now()
        });

        const caption =
            `╭─〔 *🎵 SONG DOWNLOADER* 〕\n` +
            `│\n` +
            `│ 🎶 *Title:* ${song.title}\n` +
            `│ 👤 *Artist:* ${song.author?.name || 'Unknown'}\n` +
            `│ ⏱️ *Duration:* ${durationText}\n` +
            `│\n` +
            `╰────────────────\n\n` +
            `👇 *ඔයාට අවශ්‍ය download format එක තෝරන්න.*`;

        const sections = [{
            title: '🎧 SELECT SONG FORMAT',
            rows: [
                {
                    title: '🎧 MP3 Audio',
                    description: 'Song එක audio message එකක් ලෙස ලබාගන්න',
                    id: 'thenuva_song_mp3'
                },
                {
                    title: '📁 MP3 Document',
                    description: 'Song එක MP3 file එකක් ලෙස ලබාගන්න',
                    id: 'thenuva_song_doc'
                }
            ]
        }];

        await sendListMenu(
            conn,
            from,
            {
                title: caption,
                buttonText: '🎵 Select Format',
                sections,
                footer: FOOTER,
                image: song.thumbnail || undefined
            },
            mek
        );

    } catch (error) {
        console.error('[SONG SEARCH ERROR]', error);

        await reply(
            '❌ *Song එක සොයාගන්න බැරි වුණා.*\n\n' +
            `${error.message || 'Unknown error'}\n\n` +
            '🔄 Song නම හෝ YouTube URL එක පරීක්ෂා කර නැවත උත්සාහ කරන්න.'
        );
    }
});

// ==========================================
// MP3 AUDIO COMMAND
// ==========================================

cmd({
    pattern: 'thenuva_song_mp3',
    desc: 'Download song as MP3 audio',
    dontAddCommandList: true,
    filename: __filename
}, async (conn, mek, m, { from }) => {
    const song = pendingSongs.get(from);

    if (!song) {
        return conn.sendMessage(from, {
            text: '⚠️ මුලින් `.song song name` භාවිතා කර song එකක් තෝරන්න.'
        }, { quoted: mek });
    }

    await downloadSong(conn, from, mek, song, 'audio');
});

// ==========================================
// MP3 DOCUMENT COMMAND
// ==========================================

cmd({
    pattern: 'thenuva_song_doc',
    desc: 'Download song as MP3 document',
    dontAddCommandList: true,
    filename: __filename
}, async (conn, mek, m, { from }) => {
    const song = pendingSongs.get(from);

    if (!song) {
        return conn.sendMessage(from, {
            text: '⚠️ මුලින් `.song song name` භාවිතා කර song එකක් තෝරන්න.'
        }, { quoted: mek });
    }

    await downloadSong(conn, from, mek, song, 'document');
});
