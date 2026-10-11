const { cmd } = require('../command');
const { sendListMenu } = require('../lib/buttons');
const { runtime } = require('../lib/functions');
const os = require('os');
const yts = require('yt-search');
const { ytmp3 } = require('@vreden/youtube_scraper');

const MENU_IMAGE = 'https://i.ibb.co/PzTVhgr3/551a590b92a1.jpg';

const SEARCH_TERMS = [
    'Sinhala hit songs',
    'Sinhala remix songs',
    'Sinhala love songs',
    'English hit songs',
    'popular music',
    'Sinhala trending songs',
    'Sinhala new songs'
];

const CATEGORIES = [
    {
        title: '👑 Owner Menu',
        id: 'thenuva:owner',
        description: 'Owner commands and bot settings'
    },
    {
        title: '👥 Group Menu',
        id: 'thenuva:group',
        description: 'Group management commands'
    },
    {
        title: '📥 Download Menu',
        id: 'thenuva:downloads',
        description: 'Download videos, songs and files'
    },
    {
        title: '🛠️ Tools Menu',
        id: 'thenuva:tools',
        description: 'Useful tools and utilities'
    },
    {
        title: '🔎 Search Menu',
        id: 'thenuva:search',
        description: 'Search YouTube and Google'
    },
    {
        title: '🎵 Music Menu',
        id: 'thenuva:music',
        description: 'Music and MP3 audio'
    },
    {
        title: '🏠 Main Menu',
        id: 'thenuva:menu',
        description: 'Return to the main menu'
    }
];

function durationToSeconds(timestamp) {
    if (!timestamp || typeof timestamp !== 'string') {
        return Infinity;
    }

    const parts = timestamp.split(':').map(Number);

    if (
        parts.some(part => !Number.isFinite(part)) ||
        parts.length < 2 ||
        parts.length > 3
    ) {
        return Infinity;
    }

    return parts.reduce((total, part) => total * 60 + part, 0);
}

// Send a random song every time .menu is used
async function sendRandomSong(conn, from, mek) {
    try {
        const query =
            SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];

        console.log(`[MENU MUSIC] Searching: ${query}`);

        const search = await yts(query);

        if (!search?.videos?.length) {
            console.log('[MENU MUSIC] No songs found.');
            return;
        }

        const candidates = search.videos
            .slice(0, 10)
            .filter(video => {
                const seconds = durationToSeconds(video.timestamp);
                return seconds > 0 && seconds <= 1800 && video.url;
            });

        if (!candidates.length) {
            console.log('[MENU MUSIC] No suitable songs found.');
            return;
        }

        const video =
            candidates[Math.floor(Math.random() * candidates.length)];

        console.log(`[MENU MUSIC] Selected: ${video.title}`);

        const songData = await ytmp3(video.url, '192');

        const audioUrl = songData?.download?.url;

        if (!audioUrl) {
            console.log('[MENU MUSIC] Download URL not available.');
            return;
        }

        // Send only the audio file: no thumbnail, caption or document
        await conn.sendMessage(
            from,
            {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                fileName: 'THENUVA-X-MD-RANDOM-SONG.mp3',
                ptt: false
            },
            { quoted: mek }
        );

        console.log(`[MENU MUSIC] Sent: ${video.title}`);
    } catch (error) {
        console.error('[MENU MUSIC ERROR]', error.message || error);
    }
}

// MAIN MENU
cmd(
    {
        pattern: 'menu',
        alias: ['help'],
        react: '📂',
        desc: 'Show menu and send a random song',
        category: 'main',
        filename: __filename
    },
    async (conn, mek, m, { from, pushName, sender }) => {
        try {
            const contact =
                (sender && conn.store?.contacts?.[sender]) || {};

            const userName =
                pushName ||
                m?.pushName ||
                mek?.pushName ||
                contact?.name ||
                contact?.notify ||
                'WhatsApp User';

            const uptime = runtime(process.uptime());

            const usedMemory = (
                process.memoryUsage().heapUsed /
                1024 /
                1024
            ).toFixed(2);

            const menuText = `
👋 *ʜᴇʟʟᴏ... ${userName}*
*ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 🎉

╭─〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕─●●►
│
│ ⏳ *ᴜᴘᴛɪᴍᴇ*  : ${uptime}
│ 👤 *ᴜsᴇʀ*    : ${userName}
│ 📁 *ʀᴀᴍ*     : ${usedMemory}MB
│ ⚙️ *ʜᴏsᴛ*    : ${os.hostname()}
│ 👨‍💻 *ᴏᴡɴᴇʀ*   : Dilshan Ashinsa
│ 🧬 *ᴠᴇʀsɪᴏɴ* : v2.0.0
│
╰────────────────●●►

🔘 Select an option.`;

            // Send menu first
            await sendListMenu(
                conn,
                from,
                {
                    title: menuText,
                    buttonText: 'Select Category',
                    footer:
                        'ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa',
                    sections: [
                        {
                            title: '📂 MENU CATEGORIES',
                            rows: CATEGORIES
                        }
                    ],
                    image: MENU_IMAGE
                },
                mek
            );

            // Every .menu call attempts to send a random song
            await sendRandomSong(conn, from, mek);

        } catch (error) {
            console.error('[MENU ERROR]', error);
        }
    }
);

// OWNER MENU
cmd(
    {
        pattern: 'ownermenu',
        react: '👑',
        desc: 'Show owner menu',
        category: 'main',
        filename: __filename
    },
    async (conn, mek, m, { from }) => {
        await conn.sendMessage(from, {
            text:
                '👑 *OWNER MENU*\n\n' +
                '⚙️ .setting\n' +
                '🔄 .restart\n' +
                '🏠 .menu'
        }, { quoted: mek });
    }
);

// GROUP MENU
cmd(
    {
        pattern: 'groupmenu',
        react: '👥',
        desc: 'Show group menu',
        category: 'main',
        filename: __filename
    },
    async (conn, mek, m, { from }) => {
        await conn.sendMessage(from, {
            text:
                '👥 *GROUP MENU*\n\n' +
                '📢 .tagall\n' +
                '👮 .admins\n' +
                'ℹ️ .groupinfo\n' +
                '🏠 .menu'
        }, { quoted: mek });
    }
);

// DOWNLOAD MENU
cmd(
    {
        pattern: 'downloadmenu',
        react: '📥',
        desc: 'Show download menu',
        category: 'main',
        filename: __filename
    },
    async (conn, mek, m, { from }) => {
        await conn.sendMessage(from, {
            text:
                '📥 *DOWNLOAD MENU*\n\n' +
                '🎬 .video\n' +
                '▶️ .playvideo\n' +
                '📘 .fb\n' +
                '📦 .apk\n' +
                '🎵 .song\n' +
                '🏠 .menu'
        }, { quoted: mek });
    }
);

// TOOLS MENU
cmd(
    {
        pattern: 'toolsmenu',
        react: '🛠️',
        desc: 'Show tools menu',
        category: 'main',
        filename: __filename
    },
    async (conn, mek, m, { from }) => {
        await conn.sendMessage(from, {
            text:
                '🛠️ *TOOLS MENU*\n\n' +
                '🧮 .calc\n' +
                '🆔 .jid\n' +
                '🎨 .sticker\n' +
                '🗣️ .tts\n' +
                '🌐 .translate\n' +
                '🏠 .menu'
        }, { quoted: mek });
    }
);

// SEARCH MENU
cmd(
    {
        pattern: 'searchmenu',
        react: '🔎',
        desc: 'Show search menu',
        category: 'main',
        filename: __filename
    },
    async (conn, mek, m, { from }) => {
        await conn.sendMessage(from, {
            text:
                '🔎 *SEARCH MENU*\n\n' +
                '▶️ .ytsearch\n' +
                '🌐 .google\n' +
                '🏠 .menu'
        }, { quoted: mek });
    }
);

// MUSIC MENU
cmd(
    {
        pattern: 'musicmenu',
        alias: ['mp3menu', 'audiomenu'],
        react: '🎵',
        desc: 'Show music and audio menu',
        category: 'main',
        filename: __filename
    },
    async (conn, mek, m, { from }) => {
        await conn.sendMessage(from, {
            text:
                '╭━━〔 🎵 MUSIC MENU 〕━━●●►\n' +
                '┃\n' +
                '┃ 🎶 .song <song name>\n' +
                '┃ 🔗 .song <YouTube URL>\n' +
                '┃\n' +
                '╰━━━━━━━━━━━━━━●●►\n\n' +
                '🏠 Type .menu to return.'
        }, { quoted: mek });
    }
);
