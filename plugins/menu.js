const { cmd } = require('../command');
const config = require('../config');
const os = require('os');
const { runtime } = require('../lib/functions');
const { sendButtons } = require('../lib/buttons');

cmd(
    {
        pattern: 'menu',
        alias: ['help'],
        react: '📜',
        desc: 'Show THENUVA X MD button menu',
        category: 'main',
        filename: __filename
    },

    async (conn, mek, m, { from, pushName }) => {
        try {
            const prefix = config.PREFIX || '.';
            const user = pushName || 'User';
            const bot = 'THENUVA X MD';
            const owner = 'Dilshan Ashinsa';

            const sendCategory = async (text, buttons) => {
                return sendButtons(
                    conn,
                    from,
                    {
                        text,
                        buttons: buttons.map(([action, label]) => ({
                            id: `thenuva:${action}`,
                            text: label
                        })),
                        footer: `${bot} • POWERED BY ${owner}`,
                        prefix
                    },
                    mek
                );
            };

            const header = `
╭─〔 *${bot}* 〕──●●►
│
│ 👋 Hello, ${user}
│
│ 🤖 *BOT STATUS*
│ ├─ Owner : ${owner}
│ ├─ Version : v2.0.0
│ ├─ Prefix : ${prefix}
│ ├─ Platform : ${os.platform()}
│ └─ Uptime : ${runtime(process.uptime())}
│
╰──────────────●●►
`;

            // MAIN MENU
            await sendCategory(
                `${header}
╭─〔 *MAIN MENU* 〕──●●►`,
                [
                    ['menu', '📜 MENU'],
                    ['alive', '🟢 ALIVE'],
                    ['ping', '🏓 PING']
                ]
            );

            await sendCategory(
                '╭─〔 *MAIN COMMANDS* 〕──●●►',
                [
                    ['about', 'ℹ️ ABOUT'],
                    ['calendar', '📅 CALENDAR'],
                    ['jid', '🆔 JID']
                ]
            );

            // DOWNLOAD MENU
            await sendCategory(
                '╭─〔 *DOWNLOAD MENU* 〕──●●►',
                [
                    ['video', '🎬 VIDEO'],
                    ['playvideo', '▶️ PLAY VIDEO'],
                    ['fb', '📘 FACEBOOK']
                ]
            );

            await sendCategory(
                '╭─〔 *MORE DOWNLOADS* 〕──●●►',
                [
                    ['apk', '📱 APK'],
                    ['song', '🎵 SONG'],
                    ['playvideo', '🎥 PLAY VIDEO']
                ]
            );

            // GROUP MENU
            await sendCategory(
                '╭─〔 *GROUP MENU* 〕──●●►',
                [
                    ['group', '👥 GROUP MENU'],
                    ['tagall', '📢 TAG ALL'],
                    ['admins', '🛡️ ADMINS']
                ]
            );

            await sendCategory(
                '╭─〔 *GROUP TOOLS* 〕──●●►',
                [
                    ['groupinfo', 'ℹ️ GROUP INFO'],
                    ['tagall', '📣 TAG MEMBERS'],
                    ['admins', '👮 ADMINS']
                ]
            );

            // TOOLS MENU
            await sendCategory(
                '╭─〔 *TOOLS MENU* 〕──●●►',
                [
                    ['calc', '🧮 CALCULATOR'],
                    ['jid', '🆔 GET JID'],
                    ['sticker', '🎨 STICKER']
                ]
            );

            await sendCategory(
                '╭─〔 *MORE TOOLS* 〕──●●►',
                [
                    ['tts', '🗣️ TTS'],
                    ['translate', '🌐 TRANSLATE'],
                    ['about', 'ℹ️ ABOUT']
                ]
            );

            // SEARCH MENU
            await sendCategory(
                '╭─〔 *SEARCH MENU* 〕──●●►',
                [
                    ['search', '🔎 SEARCH MENU'],
                    ['ytsearch', '▶️ YOUTUBE'],
                    ['google', '🌐 GOOGLE']
                ]
            );

            // OWNER MENU
            await sendCategory(
                '╭─〔 *OWNER MENU* 〕──●●►',
                [
                    ['owner', '👑 OWNER'],
                    ['setting', '⚙️ SETTINGS'],
                    ['restart', '🔄 RESTART']
                ]
            );

        } catch (error) {
            console.error('[MENU ERROR]', error);

            await conn.sendMessage(
                from,
                {
                    text:
                        '❌ Menu එක යැවීමේදී දෝෂයක් ඇති වුණා.\n\n' +
                        `Error: ${error.message || error}`
                },
                { quoted: mek }
            );
        }
    }
);
