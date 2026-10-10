const { cmd } = require('../command');
const yts = require('yt-search');
const { ytmp3 } = require('@vreden/youtube_scraper');
const config = require('../config');
const { sendListMenu } = require('../lib/buttons');

const BOT_NAME = 'THENUVA X MD';
const OWNER_NAME = 'Dilshan Ashinsa';
const SONG_IMAGE =
    'https://i.ibb.co/7JWk0d08/11625411f042.jpg';

const LINE = '━━━━━━━━━━━━━━━━━━';

function formatSongPanel(title, userName, duration, views, uploaded, status) {
    return `
╭─〔 *${BOT_NAME}* 〕─➤
│
│ 🎶 *SONG DOWNLOADER*
│ 👋 Hello, *${userName}* ❤️
│
├─〔 *SONG DETAILS* 〕─➤
│
│ 🎵 *Title:* ${title}
│ ⏱️ *Duration:* ${duration}
│ 👁️ *Views:* ${views}
│ 📅 *Uploaded:* ${uploaded}
│
├─〔 *DOWNLOAD STATUS* 〕─➤
│
│ ${status}
│
╰─${LINE}─➤

> ⚡ *POWERED BY ${BOT_NAME}*
> 👑 *${OWNER_NAME}*
`.trim();
}

function getDurationSeconds(timestamp = '') {
    const parts = String(timestamp).split(':').map(Number);

    if (!parts.length || parts.some(Number.isNaN)) return 0;

    return parts.reduce((total, part) => total * 60 + part, 0);
}

function safeFileName(name = 'song') {
    return String(name)
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 150) || 'song';
}

cmd(
    {
        pattern: 'song',
        alias: ['play', 'music', 'ytmp3'],
        react: '🎶',
        desc: 'Download YouTube songs as MP3',
        category: 'download',
        filename: __filename
    },

    async (conn, mek, m, { from, q, pushName, pushname, reply }) => {
        let loadingMsg;

        try {
            if (!q) {
                return reply(
                    `╭─〔 *${BOT_NAME}* 〕─➤\n` +
                    `│\n` +
                    `│ ⚠️ *SONG NAME REQUIRED*\n` +
                    `│\n` +
                    `│ 🎵 Example: .song Shape of You\n` +
                    `│ 🔗 Or send a YouTube link\n` +
                    `│\n` +
                    `╰─${LINE}─➤`
                );
            }

            const userName =
                pushName ||
                pushname ||
                m?.pushName ||
                m?.pushname ||
                'User';

            const prefix = config.PREFIX || '.';
            const query = String(q).trim();

            // ━━━ SEARCHING ━━━
            loadingMsg = await conn.sendMessage(
                from,
                {
                    text:
                        `╭─〔 *${BOT_NAME}* 〕─➤\n` +
                        `│\n` +
                        `│ 🔎 *SEARCHING SONG*\n` +
                        `│ 🎵 ${query}\n` +
                        `│\n` +
                        `│ ⏳ Please wait...\n` +
                        `│\n` +
                        `╰─${LINE}─➤`
                },
                { quoted: mek }
            );

            // ━━━ YOUTUBE SEARCH ━━━
            const search = await yts(query);

            if (!search.videos || search.videos.length === 0) {
                await conn.sendMessage(
                    from,
                    {
                        text:
                            `╭─〔 *${BOT_NAME}* 〕─➤\n` +
                            `│\n` +
                            `│ ❌ *SONG NOT FOUND*\n` +
                            `│ ➜ Try another song name.\n` +
                            `│\n` +
                            `╰─${LINE}─➤`
                    },
                    { quoted: mek }
                );
                return;
            }

            const data = search.videos[0];
            const videoUrl = data.url;

            // ━━━ DURATION CHECK ━━━
            const totalSeconds = getDurationSeconds(data.timestamp);

            if (totalSeconds > 1800) {
                await conn.sendMessage(
                    from,
                    {
                        text:
                            `╭─〔 *${BOT_NAME}* 〕─➤\n` +
                            `│\n` +
                            `│ ⏳ *SONG TOO LONG*\n` +
                            `│ ➜ Maximum duration: 30 minutes\n` +
                            `│\n` +
                            `╰─${LINE}─➤`
                    },
                    { quoted: mek }
                );
                return;
            }

            // ━━━ SONG DETAILS + MENU ━━━
            const detailsText = formatSongPanel(
                data.title,
                userName,
                data.timestamp || 'Unknown',
                Number(data.views || 0).toLocaleString(),
                data.ago || 'Unknown',
                '🔄 Preparing MP3 download...'
            );

            await sendListMenu(conn, from, {
                title: detailsText,
                buttonText: '🎶 SONG OPTIONS',
                footer: `⚡ ${BOT_NAME} • BY ${OWNER_NAME}`,
                image: data.thumbnail || SONG_IMAGE,

                sections: [
                    {
                        title: '🎧 SONG ACTIONS',
                        rows: [
                            {
                                id: `${prefix}song ${videoUrl}`,
                                title: '🎵 Download MP3',
                                description: 'Download this song again'
                            },
                            {
                                id: `${prefix}menu`,
                                title: '📋 Main Menu',
                                description: 'Explore all bot commands'
                            },
                            {
                                id: `${prefix}alive`,
                                title: '🟢 Bot Status',
                                description: 'Check bot uptime and status'
                            }
                        ]
                    }
                ]
            });

            // ━━━ UPDATE SEARCH MESSAGE ━━━
            if (loadingMsg?.key) {
                try {
                    await conn.sendMessage(
                        from,
                        {
                            text: `🎧 *Preparing:* ${data.title}`,
                            edit: loadingMsg.key
                        }
                    );
                } catch (_) {
                    // Some Baileys versions do not support editing messages.
                }
            }

            // ━━━ GET MP3 ━━━
            const songData = await ytmp3(videoUrl, '192');

            const downloadUrl =
                songData?.download?.url ||
                songData?.download_url ||
                songData?.url;

            if (!downloadUrl) {
                throw new Error(
                    'The MP3 provider did not return a download URL.'
                );
            }

            const fileName = `${safeFileName(data.title)}.mp3`;

            // ━━━ SEND MP3 AUDIO ━━━
            await conn.sendMessage(
                from,
                {
                    audio: { url: downloadUrl },
                    mimetype: 'audio/mpeg',
                    fileName,
                    ptt: false
                },
                { quoted: mek }
            );

            // ━━━ SEND MP3 DOCUMENT ━━━
            const documentCaption = `
╭─〔 *MP3 FILE READY* 〕─➤
│
│ 🎵 *${data.title}*
│ 🎧 Format: MP3 Audio
│ 📁 File: ${fileName}
│
│ ✅ Your music file is ready!
│
╰─${LINE}─➤

> ⚡ *${BOT_NAME}*
> 👑 *${OWNER_NAME}*
`.trim();

            await conn.sendMessage(
                from,
                {
                    document: { url: downloadUrl },
                    mimetype: 'audio/mpeg',
                    fileName,
                    caption: documentCaption
                },
                { quoted: mek }
            );

            // ━━━ DOWNLOAD COMPLETE MENU ━━━
            const doneText = `
╭─〔 *DOWNLOAD COMPLETE* 〕─➤
│
│ ✅ Song downloaded successfully!
│
│ 🎵 *Title:* ${data.title}
│ ⏱️ *Duration:* ${data.timestamp || 'Unknown'}
│ 📁 *Format:* MP3
│
╰─${LINE}─➤

> 🎶 ENJOY YOUR MUSIC!
> ⚡ POWERED BY ${BOT_NAME}
`.trim();

            await sendListMenu(conn, from, {
                title: doneText,
                buttonText: '⚡ MORE OPTIONS',
                footer: `👑 ${OWNER_NAME} • ${BOT_NAME}`,
                image: data.thumbnail || SONG_IMAGE,

                sections: [
                    {
                        title: '🎶 WHAT NEXT?',
                        rows: [
                            {
                                id: `${prefix}song ${videoUrl}`,
                                title: '🔁 Download Again',
                                description: 'Send this song again'
                            },
                            {
                                id: `${prefix}song`,
                                title: '🔎 Search Another Song',
                                description: 'Enter another song name'
                            },
                            {
                                id: `${prefix}menu`,
                                title: '📋 Main Menu',
                                description: 'Browse all commands'
                            },
                            {
                                id: `${prefix}alive`,
                                title: '🟢 Bot Status',
                                description: 'View bot status'
                            }
                        ]
                    }
                ]
            });

        } catch (error) {
            console.error('[SONG ERROR]', error);

            await conn.sendMessage(
                from,
                {
                    text:
                        `╭─〔 *${BOT_NAME} ERROR* 〕─➤\n` +
                        `│\n` +
                        `│ ❌ *MP3 DOWNLOAD FAILED*\n` +
                        `│\n` +
                        `│ ⚠️ ${error.message || 'Unknown error'}\n` +
                        `│\n` +
                        `│ ➜ Please try again later.\n` +
                        `│\n` +
                        `╰─${LINE}─➤`
                },
                { quoted: mek }
            );
        }
    }
);
