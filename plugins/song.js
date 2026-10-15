const { cmd } = require('../command');
const yts = require('yt-search');
const { ytmp3 } = require('@vreden/youtube_scraper');
const { sendListMenu } = require('../lib/buttons');

const songCache = new Map();
const activeDownloads = new Set();

const FOOTER = '> ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

function cleanName(name = 'THENUVA-SONG') {
    return String(name)
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100) || 'THENUVA-SONG';
}

function validVideoId(id) {
    return /^[\w-]{11}$/.test(id);
}

function getVideo(id) {
    const entry = songCache.get(id);

    if (!entry || Date.now() - entry.time > 15 * 60 * 1000) {
        songCache.delete(id);
        return null;
    }

    return entry.video;
}

async function showSongResults(conn, mek, from, query) {
    try {
        const result = await yts(query);
        const videos = (result.videos || [])
            .filter(v => v.videoId && validVideoId(v.videoId))
            .slice(0, 5);

        if (!videos.length) {
            return conn.sendMessage(
                from,
                { text: '❌ සිංදු හොයාගන්න බැරි වුණා. වෙනත් නමක් දාලා බලන්න.' },
                { quoted: mek }
            );
        }

        for (const video of videos) {
            songCache.set(video.videoId, {
                video,
                time: Date.now()
            });
        }

        await sendListMenu(conn, from, {
            title: '🎧 ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ',
            buttonText: '🎵 CHOOSE SONG',
            footer: FOOTER,
            sections: [{
                title: '🎶 CHOOSE YOUR SONG BELOW',
                rows: videos.map((video, index) => ({
                    id: `thenuva:songpick:${video.videoId}`,
                    title: `${index + 1}. ${video.title}`.slice(0, 24),
                    description:
                        `${video.author?.name || video.author || 'Unknown'} • ${video.timestamp || 'Unknown length'}`
                            .slice(0, 72)
                }))
            }]
        }, mek);

    } catch (error) {
        console.error('[SONG SEARCH ERROR]', error);

        await conn.sendMessage(
            from,
            { text: '❌ Song search එකේ දෝෂයක් ඇති වුණා. නැවත උත්සාහ කරන්න.' },
            { quoted: mek }
        );
    }
}

async function showDownloadOptions(conn, mek, from, videoId) {
    const video = getVideo(videoId);

    if (!video) {
        return conn.sendMessage(from, {
            text: '⌛ මේ song selection එක කල් ඉකුත් වෙලා. `.song සිංදුවේ නම` දාලා නැවත තෝරන්න.'
        }, { quoted: mek });
    }

    await sendListMenu(conn, from, {
        title: '🎵 SONG DOWNLOAD',
        buttonText: '📥 CHOOSE FORMAT',
        footer: FOOTER,
        sections: [{
            title: '👇 CHOOSE YOUR OPTION BELOW',
            rows: [
                {
                    id: `thenuva:songaudio:${videoId}`,
                    title: '🎧 Download Audio',
                    description: 'MP3 audio file එකක් ලෙස ලබාගන්න'
                },
                {
                    id: `thenuva:songdoc:${videoId}`,
                    title: '📁 Download Document',
                    description: 'MP3 document file එකක් ලෙස ලබාගන්න'
                }
            ]
        }]
    }, mek);
}

async function downloadSelectedSong(conn, mek, from, videoId, type) {
    const video = getVideo(videoId);

    if (!video) {
        return conn.sendMessage(from, {
            text: '⌛ Song selection එක කල් ඉකුත් වෙලා. `.song සිංදුවේ නම` දාලා නැවත තෝරන්න.'
        }, { quoted: mek });
    }

    const taskId = `${videoId}:${type}`;

    if (activeDownloads.has(taskId)) {
        return conn.sendMessage(from, {
            text: '⏳ මේ file එක දැනටමත් සකස් කරනවා. ටිකක් ඉන්න.'
        }, { quoted: mek });
    }

    activeDownloads.add(taskId);

    try {
        await conn.sendMessage(from, {
            text: type === 'audio'
                ? '🎧 *MP3 AUDIO එක සකස් කරනවා...* ⏳'
                : '📁 *MP3 DOCUMENT එක සකස් කරනවා...* ⏳'
        }, { quoted: mek });

        const songData = await ytmp3(video.url, '192');
        const downloadUrl = songData?.download?.url;

        if (!downloadUrl) {
            throw new Error('MP3 download URL not found in API response');
        }

        const fileName = `${cleanName(video.title)}.mp3`;

        if (type === 'audio') {
            await conn.sendMessage(from, {
                audio: { url: downloadUrl },
                mimetype: 'audio/mpeg',
                fileName,
                ptt: false
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, {
                document: { url: downloadUrl },
                mimetype: 'audio/mpeg',
                fileName,
                caption:
                    `📁 *${cleanName(video.title)}*\n\n` +
                    '⚡ Downloaded by THENUVA X MD\n' +
                    FOOTER
            }, { quoted: mek });
        }

    } catch (error) {
        console.error(`[SONG ${type.toUpperCase()} ERROR]`, error);

        await conn.sendMessage(from, {
            text:
                `❌ ${type === 'audio' ? 'Audio' : 'Document'} file එක ලබාගන්න බැරි වුණා.\n` +
                'ටික වේලාවකින් නැවත උත්සාහ කරන්න.'
        }, { quoted: mek });

    } finally {
        activeDownloads.delete(taskId);
    }
}

cmd({
    pattern: 'song',
    alias: ['play', 'music', 'ytmp3'],
    react: '🎧',
    desc: 'Search songs and download as audio or document',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, args, reply }) => {
    const query = q || (args || []).join(' ');

    if (!query) {
        return reply(
            '🎧 *THENUVA X MD SONG DOWNLOADER*\n\n' +
            '🎵 භාවිතය: `.song song name`\n\n' +
            'උදාහරණය: `.song Sanda Mithuri`'
        );
    }

    await showSongResults(conn, mek, from, query);
});

cmd({
    pattern: 'songpick',
    desc: 'Choose a song from search results',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, args }) => {
    const videoId = q || (args || [])[0];

    if (!videoId || !validVideoId(videoId)) {
        return conn.sendMessage(from, {
            text: '❌ Invalid song selection.'
        }, { quoted: mek });
    }

    await showDownloadOptions(conn, mek, from, videoId);
});

cmd({
    pattern: 'songaudio',
    desc: 'Download selected song as MP3 audio',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, args }) => {
    const videoId = q || (args || [])[0];

    if (!videoId || !validVideoId(videoId)) {
        return conn.sendMessage(from, {
            text: '❌ Invalid song selection.'
        }, { quoted: mek });
    }

    await downloadSelectedSong(conn, mek, from, videoId, 'audio');
});

cmd({
    pattern: 'songdoc',
    desc: 'Download selected song as an MP3 document',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, args }) => {
    const videoId = q || (args || [])[0];

    if (!videoId || !validVideoId(videoId)) {
        return conn.sendMessage(from, {
            text: '❌ Invalid song selection.'
        }, { quoted: mek });
    }

    await downloadSelectedSong(conn, mek, from, videoId, 'document');
});
