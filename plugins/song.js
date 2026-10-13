const { cmd } = require('../command');
const yts = require('yt-search');
const { ytmp3 } = require('@vreden/youtube_scraper');
const { sendListMenu } = require('../lib/buttons');

const pendingSongs = new Map();
const activeDownloads = new Set();

const FOOTER 

function isYouTubeUrl(text) {
    return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(text);
}

function safeFileName(name) {
    return String(name || 'THENUVA-SONG')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 150) || 'THENUVA-SONG';
}

async function findSong(query) {
    const result = await yts(query);
    const videos = result?.videos || [];

    if (!videos.length) {
        throw new Error('Song එකක් හමු වුණේ නැහැ.');
    }

    if (isYouTubeUrl(query)) {
        const exact = videos.find(video => video.url === query);
        if (exact) return exact;
    }

    return videos[0];
}

async function getDownloadUrl(songUrl) {
    const result = await ytmp3(songUrl, '192');

    if (!result || result.success === false || result.status === false) {
        throw new Error(result?.message || 'MP3 conversion failed.');
    }

    const url =
        result?.download?.url ||
        result?.downloadUrl ||
        result?.url;

    if (!url || typeof url !== 'string') {
        throw new Error('API එකෙන් download URL එකක් ලැබුණේ නැහැ.');
    }

    return url;
}

async function downloadSong(conn, from, quoted, song, format) {
    const key = `${from}:${format}`;

    if (activeDownloads.has(key)) {
        return conn.sendMessage(from, {
            text: '⏳ *මේ format එක දැනටමත් සකස් කරනවා.*'
        }, { quoted });
    }

    activeDownloads.add(key);

    try {
        await conn.sendMessage(from, {
            text: format === 'audio'
                ? '🎧 *MP3 Audio එක සකස් කරමින්...*'
                : '📁 *MP3 Document එක සකස් කරමින්...*'
        }, { quoted });

        const downloadUrl = await getDownloadUrl(song.url);

        const response = await fetch(downloadUrl, {
            signal: AbortSignal.timeout(120000)
        });

        if (!response.ok) {
            throw new Error(`Download server HTTP ${response.status}`);
        }

        const contentType = (
            response.headers.get('content-type') || ''
        ).toLowerCase();

        if (
            contentType.includes('text/html') ||
            contentType.includes('application/json')
        ) {
            throw new Error('Server එකෙන් MP3 file එකක් වෙනුවට වෙනත් content එකක් ලැබුණා.');
        }

        const buffer = Buffer.from(await response.arrayBuffer());

        if (!buffer.length) {
            throw new Error('Downloaded file එක හිස්.');
        }

        if (buffer.length > 64 * 1024 * 1024) {
            throw new Error('File එක 64 MB සීමාව ඉක්මවා තිබෙනවා.');
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
                caption: `🎵 *${song.title}*\n\n${FOOTER}`
            }, { quoted });
        }

    } catch (error) {
        console.error('[SONG DOWNLOAD ERROR]', error);

        await conn.sendMessage(from, {
            text:
                `❌ *Download failed!*\n\n` +
                `${error.message || 'Unknown error'}\n\n` +
                `🔄 නැවත උත්සාහ කරන්න.`
        }, { quoted });

    } finally {
        activeDownloads.delete(key);
    }
}

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
                '🎵 *SONG DOWNLOADER*\n\n' +
                'භාවිතය: `.song song name`\n' +
                'උදාහරණය: `.song Shape of You`'
            );
        }

        await reply('🔎 *Song එක සොයමින්...*');

        const song = await findSong(query);

        const durationText = song.timestamp || 'Unknown';
        const seconds = durationText
            .split(':')
            .map(Number)
            .reduce((total, part) => total * 60 + part, 0);

        if (seconds > 1800) {
            return reply('⚠️ *විනාඩි 30කට වඩා දිග songs සහාය නොදක්වයි.*');
        }

        pendingSongs.set(from, {
            url: song.url,
            title: song.title,
            timestamp: durationText
        });

        const caption =
            `╭─〔 *🎵 SONG DOWNLOADER 🎵* 〕\n` +
            `│\n` +
            `│ 🎶 *Title:* ${song.title}\n` +
            `│ 👤 *Artist:* ${song.author?.name || 'Unknown'}\n` +
            `│ ⏱️ *Duration:* ${durationText}\n` +
            `│\n` +
            `╰────────────────\n\n` +
            `👇 *ඔයාට අවශ්‍ය format එක තෝරන්න.*\n\n` +
            `${FOOTER}`;

        const sections = [{
            title: '🎧 SELECT SONG FORMAT',
            rows: [
                {
                    title: '🎧 MP3 Audio',
                    description: 'Song එක audio message එකක් ලෙස',
                    id: 'thenuva_song_mp3'
                },
                {
                    title: '📁 MP3 Document',
                    description: 'Song එක MP3 file එකක් ලෙස',
                    id: 'thenuva_song_doc'
                }
            ]
        }];

        // Song details, thumbnail සහ format menu එක එකම message එකක
        await sendListMenu(
            conn,
            from,
            {
                title: caption,
                buttonText: '🎵 Select Format',
                sections,
                footer: FOOTER,
                image: song.thumbnail || null
            },
            mek
        );

    } catch (error) {
        console.error('[SONG SEARCH ERROR]', error);

        await reply(
            '❌ *Song එක සොයාගන්න බැරි වුණා.*\n\n' +
            'නම පරීක්ෂා කරලා නැවත උත්සාහ කරන්න.'
        );
    }
});

cmd({
    pattern: 'thenuva_song_mp3',
    desc: 'Download song as MP3 audio',
    dontAddCommandList: true,
    filename: __filename
}, async (conn, mek, m, { from }) => {
    const song = pendingSongs.get(from);

    if (!song) {
        return conn.sendMessage(from, {
            text: '⚠️ මුලින් `.song song name` භාවිතා කරන්න.'
        }, { quoted: mek });
    }

    await downloadSong(conn, from, mek, song, 'audio');
});

cmd({
    pattern: 'thenuva_song_doc',
    desc: 'Download song as MP3 document',
    dontAddCommandList: true,
    filename: __filename
}, async (conn, mek, m, { from }) => {
    const song = pendingSongs.get(from);

    if (!song) {
        return conn.sendMessage(from, {
            text: '⚠️ මුලින් `.song song name` භාවිතා කරන්න.'
        }, { quoted: mek });
    }

    await downloadSong(conn, from, mek, song, 'document');
});
