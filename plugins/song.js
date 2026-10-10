const { cmd } = require('../command');
const yts = require('yt-search');
const { ytmp3 } = require('@vreden/youtube_scraper');
const config = require('../config');
const { sendListMenu } = require('../lib/buttons');

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
        try {
            if (!q) {
                return reply(
                    '⚠️ *Please provide a song name or YouTube link!*\n\nExample: .song Shape of You'
                );
            }

            const userName =
                pushName ||
                pushname ||
                m?.pushName ||
                'User';

            const prefix = config.PREFIX || '.';
            const botName = 'THENUVA X MD';

            // SEARCHING MESSAGE
            const loadingMsg = await conn.sendMessage(
                from,
                {
                    text: `🎶 *${botName} SONG DOWNLOADER*\n\n👤 User: ${userName}\n🔎 Searching: ${q}\n\n⏳ Please wait...`
                },
                { quoted: mek }
            );

            // SEARCH YOUTUBE
            const search = await yts(q);

            if (!search.videos || search.videos.length === 0) {
                await conn.sendMessage(from, {
                    text: '❌ *Song not found!*\nTry another song name.'
                }, { quoted: mek });
                return;
            }

            const data = search.videos[0];

            // CHECK VIDEO DURATION
            const durationParts = (data.timestamp || '0:00')
                .split(':')
                .map(Number);

            let totalSeconds = 0;

            for (const part of durationParts) {
                totalSeconds = totalSeconds * 60 + part;
            }

            if (totalSeconds > 1800) {
                await conn.sendMessage(from, {
                    text: '⏳ *Sorry! Audio longer than 30 minutes is not supported.*'
                }, { quoted: mek });
                return;
            }

            // SONG DETAILS
            const songText = `
╭──〔 *sᴏɴɢ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 〕──●●►
│
│ 👋 Hello, *${userName}* ❤️
│
│ 🎵 *Title:* ${data.title}
│ ⏱️ *Duration:* ${data.timestamp || 'Unknown'}
│ 👀 *Views:* ${(data.views || 0).toLocaleString()}
│ 📅 *Uploaded:* ${data.ago || 'Unknown'}
│
│ 🎧 *Status:* Downloading audio...
│
╰────────────●●►

> ⚡ *POWERED BY ${botName}*
            `.trim();

            // SHOW SONG DETAILS + INTERACTIVE MENU
            await sendListMenu(conn, from, {
                title: songText,
                buttonText: 'SONG OPTIONS',
                footer: `🎶 POWERED BY ${botName}`,
                image: data.thumbnail,

                sections: [
                    {
                        title: '🎵 SONG MENU',
                        rows: [
                            {
                                id: `${prefix}song ${data.url}`,
                                title: '🎶 Download Song',
                                description: 'Download audio as MP3'
                            },
                            {
                                id: `${prefix}menu`,
                                title: '📋 Main Menu',
                                description: 'Open all bot commands'
                            },
                            {
                                id: `${prefix}alive`,
                                title: '🟢 Bot Status',
                                description: 'Check bot online status'
                            }
                        ]
                    }
                ]
            });

            // UPDATE SEARCH MESSAGE
            await conn.sendMessage(
                from,
                {
                    text: '⏳ *Preparing your audio file...*',
                    edit: loadingMsg.key
                }
            );

            // DOWNLOAD AUDIO
            const songData = await ytmp3(data.url, '192');

            const downloadUrl =
                songData?.download?.url ||
                songData?.url;

            if (!downloadUrl) {
                throw new Error('Audio download URL was not returned by the scraper.');
            }

            // SEND AUDIO
            await conn.sendMessage(
                from,
                {
                    audio: { url: downloadUrl },
                    mimetype: 'audio/mpeg',
                    fileName: `${data.title}.mp3`,
                    ptt: false
                },
                { quoted: mek }
            );

            // SEND DOCUMENT
            await conn.sendMessage(
                from,
                {
                    document: { url: downloadUrl },
                    mimetype: 'audio/mpeg',
                    fileName: `${data.title}.mp3`,
                    caption: `🎶 *${data.title}*\n\n⚡ Powered by ${botName}`
                },
                { quoted: mek }
            );

            await conn.sendMessage(from, {
                text: `✅ *Song downloaded successfully!*\n\n🎵 ${data.title}\n⚡ ${botName}`
            }, { quoted: mek });

        } catch (error) {
            console.error('[SONG ERROR]', error);

            await conn.sendMessage(
                from,
                {
                    text: `❌ *SONG DOWNLOAD ERROR*\n\n${error.message || 'Please try again later.'}`
                },
                { quoted: mek }
            );
        }
    }
);
