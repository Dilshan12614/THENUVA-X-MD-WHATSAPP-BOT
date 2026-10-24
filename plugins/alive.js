const { cmd } = require('../command');
const config = require('../config');
const os = require('os');
const { runtime } = require('../lib/functions');
const yts = require('yt-search');
const { ytmp3 } = require('@vreden/youtube_scraper');

// ========================================
// THENUVA X MD ALIVE CONFIG
// ========================================

const BOT_NAME = 'THENUVA X MD';
const OWNER_NAME = 'Dilshan Ashinsa';
const VERSION = 'v2.0.0';

const ALIVE_IMAGE = 'https://i.ibb.co/LXTMV60v/0bade47afdf9.jpg';

// Sinhala DJ / Remix searches
const REMIX_SEARCHES = [
    'RU CHAYA Sinhala DJ remix',
    'RU CHAYA remix songs',
    'Sinhala trending remix songs',
    'Sinhala bass boosted remix',
    'Sinhala DJ remix 2026'
];

// ========================================
// DURATION HELPER
// ========================================

function durationToSeconds(timestamp) {
    if (!timestamp || typeof timestamp !== 'string') {
        return Infinity;
    }

    const parts = timestamp.split(':').map(Number);

    if (
        parts.length < 2 ||
        parts.length > 3 ||
        parts.some(part => !Number.isFinite(part))
    ) {
        return Infinity;
    }

    return parts.reduce(
        (total, part) => total * 60 + part,
        0
    );
}

// ========================================
// SEND RANDOM REMIX AUDIO
// ========================================

async function sendRandomRemix(conn, from, mek) {
    try {
        const query =
            REMIX_SEARCHES[
                Math.floor(Math.random() * REMIX_SEARCHES.length)
            ];

        console.log(`[ALIVE MUSIC] Searching: ${query}`);

        const search = await yts(query);

        if (!search?.videos?.length) {
            console.log('[ALIVE MUSIC] No songs found.');
            return;
        }

        const candidates = search.videos
            .slice(0, 10)
            .filter(video => {
                const seconds = durationToSeconds(video.timestamp);

                return (
                    video.url &&
                    seconds > 0 &&
                    seconds <= 1800
                );
            });

        if (!candidates.length) {
            console.log('[ALIVE MUSIC] No suitable remix found.');
            return;
        }

        const video =
            candidates[
                Math.floor(Math.random() * candidates.length)
            ];

        console.log(`[ALIVE MUSIC] Selected: ${video.title}`);

        const songData = await ytmp3(video.url, '192');
        const audioUrl = songData?.download?.url;

        if (!audioUrl) {
            console.log('[ALIVE MUSIC] MP3 URL unavailable.');
            return;
        }

        await conn.sendMessage(
            from,
            {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                fileName: 'THENUVA-X-MD-RANDOM-REMIX.mp3',
                ptt: false
            },
            { quoted: mek }
        );

        console.log(`[ALIVE MUSIC] Audio sent: ${video.title}`);

    } catch (error) {
        console.error(
            '[ALIVE MUSIC ERROR]',
            error.stack || error.message
        );
    }
}

// ========================================
// ALIVE COMMAND
// ========================================

cmd(
    {
        pattern: 'alive',
        alias: ['online', 'status'],
        react: '🟢',
        desc: 'Check bot status and play a random remix',
        category: 'main',
        filename: __filename
    },

    async (conn, mek, m, { from, pushname, reply }) => {
        try {
            const userName =
                pushname ||
                m?.pushName ||
                m?.pushname ||
                'User';

            const prefix = config.PREFIX || '.';

            const uptime = runtime(process.uptime());

            const usedMemory = (
                process.memoryUsage().rss / 1024 / 1024
            ).toFixed(2);

            const totalMemory = (
                os.totalmem() / 1024 / 1024 / 1024
            ).toFixed(2);

            const aliveText = [
                '╭━━〔 🤖 ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ 〕━━╮',
                '',
                `👋 Hello, *${userName}!* ❤️`,
                '',
                '╭─〔 *sᴛᴀᴛᴜs ᴘᴀɴᴇʟ* 〕──●●►',
                '│',
                '│ 🟢 *sᴛᴀᴛᴜs*  : ONLINE',
                `│ ⏳ *ᴜᴘᴛɪᴍᴇ*  : ${uptime}`,
                `│ 💾 *ʀᴀᴍ*     : ${usedMemory} MB`,
                `│ 🖥️ *ᴛᴏᴛᴀʟ ʀᴀᴍ* : ${totalMemory} GB`,
                `│ ⚙️ *ʜᴏsᴛ*     : ${os.hostname()}`,
                `│ ⌨️ *ᴘʀᴇғɪx*   : ${prefix}`,
                `│ 🧬 *ᴠᴇʀsɪᴏɴ*  : ${VERSION}`,
                `│ 👑 *ᴏᴡɴᴇʀ*    : ${OWNER_NAME}`,
                '│',
                '╰─────────────────●●►',
                '',
                `✨ *${BOT_NAME} is running successfully!*`,
                '',
                '🎵 _Preparing a random Sinhala remix..._',
                '',
                '> ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa'
            ].join('\n');

            // Send a normal message, with an image if available
            if (ALIVE_IMAGE && /^https?:\/\//i.test(ALIVE_IMAGE)) {
                try {
                    await conn.sendMessage(
                        from,
                        {
                            image: { url: ALIVE_IMAGE },
                            caption: aliveText
                        },
                        { quoted: mek }
                    );
                } catch (imageError) {
                    console.error(
                        '[ALIVE IMAGE ERROR]',
                        imageError.message
                    );

                    await reply(aliveText);
                }
            } else {
                await reply(aliveText);
            }

            // Send a random remix after the status message
            await sendRandomRemix(conn, from, mek);

        } catch (error) {
            console.error(
                '[ALIVE ERROR]',
                error.stack || error.message
            );

            try {
                await conn.sendMessage(
                    from,
                    {
                        text:
                            '❌ *ALIVE ERROR*\n\n' +
                            `${error.message || 'Unknown error'}`
                    },
                    { quoted: mek }
                );
            } catch (sendError) {
                console.error(
                    '[ALIVE ERROR REPLY FAILED]',
                    sendError.message
                );
            }
        }
    }
);
