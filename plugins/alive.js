const { cmd } = require('../command');
const config = require('../config');
const { sendListMenu } = require('../lib/buttons');
const os = require('os');
const { runtime } = require('../lib/functions');
const yts = require('yt-search');
const { ytmp3 } = require('@vreden/youtube_scraper');

const ALIVE_IMAGE = 'https://i.ibb.co/LXTMV60v/0bade47afdf9.jpg';

// RU CHAYA style Sinhala DJ / Remix music searches
const REMIX_SEARCHES = [
    'RU CHAYA Sinhala DJ remix',
    'RU CHAYA remix songs',
    'Sinhala DJ remix songs',
    'Sinhala nonstop remix',
    'Sinhala party DJ songs',
    'Sinhala trending remix songs',
    'Sinhala bass boosted remix'
];

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

    return parts.reduce((total, part) => total * 60 + part, 0);
}

// Send a random Sinhala remix audio
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
            candidates[Math.floor(Math.random() * candidates.length)];

        console.log(`[ALIVE MUSIC] Selected: ${video.title}`);

        const songData = await ytmp3(video.url, '192');
        const audioUrl = songData?.download?.url;

        if (!audioUrl) {
            console.log('[ALIVE MUSIC] MP3 URL unavailable.');
            return;
        }

        // Send audio only — no thumbnail or separate document
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
            error.message || error
        );
    }
}

cmd(
    {
        pattern: 'alive',
        alias: ['online', 'status'],
        react: '🟢',
        desc: 'Check bot status and play a random remix',
        category: 'main',
        filename: __filename
    },

    async (conn, mek, m, { from, pushName }) => {
        try {
            // USER INFORMATION
            const userName =
                pushName ||
                m?.pushName ||
                m?.pushname ||
                m?.senderName ||
                'User';

            const prefix = config.PREFIX || '.';
            const uptime = runtime(process.uptime());

            // MEMORY USAGE
            const usedMemory = (
                process.memoryUsage().rss / 1024 / 1024
            ).toFixed(2);

            // ALIVE STATUS TEXT
            const aliveText = `
👋 HELLOW... *${userName}* ❤️
*ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ ɪs ᴀʟɪᴠᴇ ɴᴏᴡ* 🎉

╭──〔 *sᴛᴀᴛᴜs ᴘᴀɴᴇʟ* 〕──●●►
│
│ ⏳ *ᴜᴘᴛɪᴍᴇ*  : ${uptime}
│ 👤 *ᴜsᴇʀ*    : ${userName}
│ 📁 *ʀᴀᴍ*     : ${usedMemory}MB
│ ⚙️ *ʜᴏsᴛ*    : ${os.hostname()}
│ 👨‍💻 *ᴏᴡɴᴇʀ*   : Dilshan Ashinsa
│ 🧬 *ᴠᴇʀsɪᴏɴ* : v2.0.0
│
╰──────────────●●►

🔘 Select an option.
            `.trim();

            // SEND ALIVE MENU
            await sendListMenu(
                conn,
                from,
                {
                    title: aliveText,
                    buttonText: 'OPEN MENU',
                    hideListButton: false,
                    footer: '⚡ POWERED BY THENUVA X MD',
                    image: ALIVE_IMAGE,

                    sections: [
                        {
                            title: '🤖 THENUVA X MD',
                            rows: [
                                {
                                    id: `${prefix}ping`,
                                    title: '🏓 Ping',
                                    description: 'Check bot response speed'
                                },
                                {
                                    id: `${prefix}menu`,
                                    title: '📋 Main Menu',
                                    description: 'Open complete bot menu'
                                },
                                {
                                    id: `${prefix}about`,
                                    title: 'ℹ️ About',
                                    description: 'View bot information'
                                }
                            ]
                        }
                    ]
                },
                mek
            );

            // EVERY .alive CALL ATTEMPTS TO SEND A RANDOM REMIX
            await sendRandomRemix(conn, from, mek);

        } catch (error) {
            console.error('[ALIVE ERROR]', error);

            await conn.sendMessage(
                from,
                {
                    text:
                        `❌ *ALIVE ERROR*\n\n` +
                        `⚠️ ${error.message || 'Unknown error'}`
                },
                { quoted: mek }
            );
        }
    }
);
