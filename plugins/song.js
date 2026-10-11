const { cmd } = require('../command');
const yts = require('yt-search');
const { ytmp3 } = require('@vreden/youtube_scraper');
const config = require('../config');
const { sendListMenu } = require('../lib/buttons');

const BOT = 'THENUVA X MD';
const OWNER = 'Dilshan Ashinsa';
const LINE = '━━━━━━━━━━━━━━━━';

function getYouTubeId(input) {
    const text = String(input || '').trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(text)) return text;

    try {
        const url = new URL(text);
        let id = '';

        if (url.hostname === 'youtu.be' ||
            url.hostname.endsWith('.youtu.be')) {
            id = url.pathname.split('/').filter(Boolean)[0] || '';
        } else if (
            url.hostname.includes('youtube.com') ||
            url.hostname.includes('youtube-nocookie.com')
        ) {
            id = url.searchParams.get('v') || '';

            if (!id) {
                const parts = url.pathname.split('/').filter(Boolean);
                if (['shorts', 'embed', 'live'].includes(parts[0])) {
                    id = parts[1] || '';
                }
            }
        }

        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    } catch {
        return null;
    }
}

function getSeconds(timestamp) {
    if (!timestamp) return 0;

    const parts = String(timestamp).split(':').map(Number);

    if (parts.some(Number.isNaN)) return 0;

    return parts.reduce((total, part) => total * 60 + part, 0);
}

function safeName(name) {
    return String(name || 'THENUVA-SONG')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .trim()
        .slice(0, 140) || 'THENUVA-SONG';
}

function makePanel(title, user, duration, views, status) {
    return `
╭──〔 *${BOT}* 〕──➤
│
│ 🎶 *sᴏɴɢ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*
│ 👋 ʜᴇʟʟᴏ, *${user}* ❤️
│
├──〔 *sᴏɴɢ ɪɴғᴏ* 〕──➤
│
│ 🎵 *ᴛɪᴛʟᴇ* : ${title}
│ ⏱️ *ᴅᴜʀᴀᴛɪᴏɴ* : ${duration || 'Unknown'}
│ 👁️ *ᴠɪᴇᴡs* : ${views || 'Unknown'}
│
├──〔 *sᴛᴀᴛᴜs* 〕──➤
│
│ ${status}
│
╰──${LINE}──➤

> ⚡ *POWERED BY ${BOT}*
> 👑 *${OWNER}*
`.trim();
}

async function showSongMenu(conn, from, data, user, prefix, status) {
    const text = makePanel(
        data.title,
        user,
        data.timestamp,
        Number(data.views || 0).toLocaleString(),
        status
    );

    return sendListMenu(conn, from, {
        title: text,
        buttonText: '🎶 SONG OPTIONS',
        footer: `⚡ ${BOT} • ${OWNER}`,
        image: data.thumbnail,

        sections: [
            {
                title: '🎧 MUSIC CONTROL',
                rows: [
                    {
                        id: `${prefix}song ${data.url}`,
                        title: '🎵 Download Again',
                        description: 'Download this song again'
                    },
                    {
                        id: `${prefix}song`,
                        title: '🔎 Search Song',
                        description: 'Search for another song'
                    },
                    {
                        id: `${prefix}menu`,
                        title: '📋 Main Menu',
                        description: 'Explore all commands'
                    },
                    {
                        id: `${prefix}alive`,
                        title: '🟢 Bot Status',
                        description: 'Check bot status'
                    }
                ]
            }
        ]
    });
}

cmd({
    pattern: 'song',
    alias: ['play', 'music', 'ytmp3'],
    react: '🎶',
    desc: 'Search and download songs as MP3',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, pushName, pushname, reply }) => {
    try {
        if (!q || !String(q).trim()) {
            return reply(
                `╭──〔 *${BOT}* 〕──➤\n` +
                `│\n` +
                `│ 🎶 *SONG DOWNLOADER*\n` +
                `│\n` +
                `│ ➤ .song song name\n` +
                `│ ➤ .song YouTube link\n` +
                `│\n` +
                `╰──${LINE}──➤`
            );
        }

        const prefix = config.PREFIX || '.';
        const user =
            pushName ||
            pushname ||
            m?.pushName ||
            m?.pushname ||
            'User';

        const query = String(q).trim();

        const loading = await conn.sendMessage(from, {
            text:
                `╭──〔 *${BOT}* 〕──➤\n` +
                `│\n` +
                `│ 🔎 *SEARCHING MUSIC*\n` +
                `│\n` +
                `│ 🎵 ${query}\n` +
                `│ ⏳ Please wait...\n` +
                `│\n` +
                `╰──${LINE}──➤`
        }, { quoted: mek });

        // ━━━ SEARCH / DIRECT VIDEO LINK ━━━
        let video = null;
        const videoId = getYouTubeId(query);

        if (videoId) {
            try {
                const result = await yts({ videoId });
                if (result && result.title) video = result;
            } catch (err) {
                console.log('[SONG VIDEO LOOKUP]', err.message);
            }
        } else {
            // Try the standard yt-search query first.
            try {
                let result = await yts(query);

                if (!result?.videos?.length) {
                    result = await yts({ query });
                }

                if (result?.videos?.length) {
                    video = result.videos[0];
                }
            } catch (err) {
                console.log('[SONG SEARCH FIRST TRY]', err.message);

                // One fallback attempt.
                try {
                    const result = await yts({ query });
                    if (result?.videos?.length) {
                        video = result.videos[0];
                    }
                } catch (fallbackError) {
                    console.log('[SONG SEARCH FALLBACK]', fallbackError.message);
                }
            }
        }

        if (!video) {
            await conn.sendMessage(from, {
                text:
                    `╭──〔 *${BOT}* 〕──➤\n` +
                    `│\n` +
                    `│ ❌ *SEARCH UNAVAILABLE*\n` +
                    `│\n` +
                    `│ ➤ Check the song name or YouTube link.\n` +
                    `│ ➤ Try again in a little while.\n` +
                    `│\n` +
                    `╰──${LINE}──➤`
            }, { quoted: mek });
            return;
        }

        const id = video.videoId || getYouTubeId(video.url);
        const videoUrl = video.url ||
            (id ? `https://www.youtube.com/watch?v=${id}` : '');

        if (!videoUrl) {
            throw new Error('Could not determine the YouTube video URL.');
        }

        const timestamp =
            video.timestamp ||
            video.duration?.timestamp ||
            'Unknown';

        const data = {
            title: video.title || 'Unknown title',
            url: videoUrl,
            timestamp,
            views: video.views || 0,
            thumbnail: video.thumbnail ||
                video.image ||
                `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
        };

        // ━━━ CHECK DURATION ━━━
        const seconds = getSeconds(timestamp);

        if (seconds > 1800) {
            await conn.sendMessage(from, {
                text:
                    `╭──〔 *${BOT}* 〕──➤\n` +
                    `│\n` +
                    `│ ⏳ *SONG TOO LONG*\n` +
                    `│ ➤ Maximum supported duration: 30 minutes.\n` +
                    `│\n` +
                    `╰──${LINE}──➤`
            }, { quoted: mek });
            return;
        }

        // ━━━ BEAUTIFUL SONG MENU ━━━
        await showSongMenu(
            conn,
            from,
            data,
            user,
            prefix,
            '🔄 Finding your MP3 file...'
        );

        // ━━━ DOWNLOAD MP3 ━━━
        const result = await ytmp3(data.url, '192');

        const downloadUrl =
            result?.download?.url ||
            result?.download_url ||
            result?.url;

        if (!downloadUrl) {
            throw new Error(
                'The MP3 service did not return a download URL.'
            );
        }

        const fileName = `${safeName(data.title)}.mp3`;

        // ━━━ SEND AUDIO ━━━
        await conn.sendMessage(from, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mpeg',
            fileName,
            ptt: false
        }, { quoted: mek });

        // ━━━ SEND MP3 DOCUMENT ━━━
        const documentCaption = `
╭──〔 *ᴍᴘ3 ғɪʟᴇ* 〕──➤
│
│ 🎵 *${data.title}*
│
├──〔 *ғɪʟᴇ ɪɴғᴏ* 〕──➤
│
│ 📁 *ғᴏʀᴍᴀᴛ* : MP3 Audio
│ 💾 *ғɪʟᴇ* : ${fileName}
│ ✅ *sᴛᴀᴛᴜs* : Ready
│
╰──${LINE}──➤

> ⚡ *${BOT}*
> 👑 *${OWNER}*
`.trim();

        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            mimetype: 'audio/mpeg',
            fileName,
            caption: documentCaption
        }, { quoted: mek });

        // ━━━ COMPLETION MENU ━━━
        await showSongMenu(
            conn,
            from,
            data,
            user,
            prefix,
            '✅ MP3 download completed successfully!'
        );

    } catch (error) {
        console.error('[SONG DOWNLOAD ERROR]', error);

        await conn.sendMessage(from, {
            text:
                `╭──〔 *${BOT} ERROR* 〕──➤\n` +
                `│\n` +
                `│ ❌ *DOWNLOAD FAILED*\n` +
                `│\n` +
                `│ ⚠️ ${error.message || 'Unknown error'}\n` +
                `│\n` +
                `│ ➤ Please try again later.\n` +
                `│\n` +
                `╰──${LINE}──➤`
        }, { quoted: mek });
    }
});
