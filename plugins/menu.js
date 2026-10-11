const { cmd } = require('../command');
const config = require('../config');
const { sendButtons } = require('../lib/buttons');

const BOT_NAME = 'THENUVA X MD';
const OWNER_NAME = 'Dilshan Ashinsa';
const PREFIX = config.PREFIX || '.';

const footer = `${BOT_NAME} • POWERED BY ${OWNER_NAME}`;

async function sendCategory(conn, from, mek, title, description, buttons) {
    const text = [
        `╭─〔 *${title}* 〕──●●►`,
        '',
        description,
        '',
        '╰────────────────●●►'
    ].join('\n');

    // sendButtons supports a maximum of 3 buttons per message.
    for (let i = 0; i < buttons.length; i += 3) {
        const chunk = buttons.slice(i, i + 3);

        await sendButtons(
            conn,
            from,
            {
                text,
                buttons: chunk.map(([id, label]) => ({
                    id: `thenuva:${id}`,
                    text: label
                })),
                footer,
                prefix: PREFIX
            },
            mek
        );
    }
}

cmd({
    pattern: 'menu',
    alias: ['help'],
    react: '📂',
    desc: 'Show the main menu',
    category: 'main',
    filename: __filename
}, async (conn, mek, m, { from }) => {
    await sendCategory(
        conn, from, mek,
        'THENUVA X MD • MAIN MENU',
        '👋 Welcome to THENUVA X MD!\n\nSelect a category to view its commands.',
        [
            ['owner', '👑 OWNER MENU'],
            ['group', '👥 GROUP MENU'],
            ['downloads', '📥 DOWNLOAD MENU'],
            ['tools', '🛠️ TOOLS MENU'],
            ['search', '🔎 SEARCH MENU'],
            ['alive', '🟢 ALIVE'],
            ['ping', '🏓 PING'],
            ['about', 'ℹ️ ABOUT'],
            ['calendar', '📅 CALENDAR'],
            ['jid', '🆔 JID']
        ]
    );
});

cmd({
    pattern: 'ownermenu',
    desc: 'Show owner commands',
    category: 'owner',
    filename: __filename
}, async (conn, mek, m, { from }) => {
    await sendCategory(
        conn, from, mek,
        '👑 OWNER MENU',
        'Owner-related commands:',
        [
            ['setting', '⚙️ SETTING'],
            ['restart', '🔄 RESTART'],
            ['menu', '🏠 MAIN MENU']
        ]
    );
});

cmd({
    pattern: 'groupmenu',
    desc: 'Show group commands',
    category: 'group',
    filename: __filename
}, async (conn, mek, m, { from }) => {
    await sendCategory(
        conn, from, mek,
        '👥 GROUP MENU',
        'Group management commands:',
        [
            ['tagall', '📢 TAG ALL'],
            ['admins', '🛡️ ADMINS'],
            ['groupinfo', 'ℹ️ GROUP INFO'],
            ['menu', '🏠 MAIN MENU']
        ]
    );
});

cmd({
    pattern: 'downloadmenu',
    desc: 'Show download commands',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from }) => {
    await sendCategory(
        conn, from, mek,
        '📥 DOWNLOAD MENU',
        'Choose a download command:',
        [
            ['video', '🎬 VIDEO'],
            ['playvideo', '▶️ PLAY VIDEO'],
            ['fb', '📘 FACEBOOK'],
            ['apk', '📱 APK'],
            ['song', '🎵 SONG'],
            ['menu', '🏠 MAIN MENU']
        ]
    );
});

cmd({
    pattern: 'toolsmenu',
    desc: 'Show tools commands',
    category: 'tools',
    filename: __filename
}, async (conn, mek, m, { from }) => {
    await sendCategory(
        conn, from, mek,
        '🛠️ TOOLS MENU',
        'Available utility commands:',
        [
            ['calc', '🧮 CALCULATOR'],
            ['jid', '🆔 JID'],
            ['sticker', '🖼️ STICKER'],
            ['tts', '🔊 TEXT TO SPEECH'],
            ['translate', '🌐 TRANSLATE'],
            ['menu', '🏠 MAIN MENU']
        ]
    );
});

cmd({
    pattern: 'searchmenu',
    desc: 'Show search commands',
    category: 'search',
    filename: __filename
}, async (conn, mek, m, { from }) => {
    await sendCategory(
        conn, from, mek,
        '🔎 SEARCH MENU',
        'Search the web and YouTube:',
        [
            ['ytsearch', '▶️ YOUTUBE SEARCH'],
            ['google', '🌐 GOOGLE SEARCH'],
            ['menu', '🏠 MAIN MENU']
        ]
    );
});
