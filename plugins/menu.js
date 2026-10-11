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
            const image = 'https://i.ibb.co/BV4dPxkT/ad40079469ef.jpg';

            const header = `
╭─〔 *${bot}* 〕──●●►
│
│ 👋 Hello, ${user}
│
│ 🤖 *BOT STATUS*
│ ├─ Bot : ${bot}
│ ├─ Owner : ${owner}
│ ├─ Version : v2.0.0
│ ├─ Prefix : ${prefix}
│ ├─ Platform : ${os.platform()}
│ └─ Uptime : ${runtime(process.uptime())}
│
╰──────────────●●►
`;

            // MAIN CATEGORY BUTTONS
            await sendButtons(
                conn,
                from,
                header + '\n╭─〔 *MAIN MENU* 〕──●●►',
                [
                    { buttonId: `${prefix}menuall`, buttonText: { displayText: '📜 MENU ALL' }, type: 1 },
                    { buttonId: `${prefix}alive`, buttonText: { displayText: '🟢 ALIVE' }, type: 1 },
                    { buttonId: `${prefix}ping`, buttonText: { displayText: '🏓 PING' }, type: 1 }
                ],
                `${bot} • POWERED BY ${owner}`,
                mek
            );

            // MAIN COMMANDS
            await sendButtons(
                conn,
                from,
                '╭─〔 *MAIN COMMANDS* 〕──●●►\n│\n│ ℹ️ About • 📅 Calendar • 👤 Owner\n╰──────────────●●►',
                [
                    { buttonId: `${prefix}about`, buttonText: { displayText: 'ℹ️ ABOUT' }, type: 1 },
                    { buttonId: `${prefix}calendar`, buttonText: { displayText: '📅 CALENDAR' }, type: 1 },
                    { buttonId: `${prefix}owner`, buttonText: { displayText: '👤 OWNER' }, type: 1 }
                ],
                `${bot} • MAIN`,
                mek
            );

            // DOWNLOAD MENU
            await sendButtons(
                conn,
                from,
                '╭─〔 *DOWNLOAD MENU* 〕──●●►\n│\n│ 🎵 Song • 🎬 Video • 📘 Facebook • 📱 APK\n╰──────────────●●►',
                [
                    { buttonId: `${prefix}song`, buttonText: { displayText: '🎵 SONG' }, type: 1 },
                    { buttonId: `${prefix}video`, buttonText: { displayText: '🎬 VIDEO' }, type: 1 },
                    { buttonId: `${prefix}fb`, buttonText: { displayText: '📘 FACEBOOK' }, type: 1 }
                ],
                `${bot} • DOWNLOADS`,
                mek
            );

            await sendButtons(
                conn,
                from,
                '╭─〔 *MORE DOWNLOADS* 〕──●●►',
                [
                    { buttonId: `${prefix}apk`, buttonText: { displayText: '📱 APK' }, type: 1 },
                    { buttonId: `${prefix}playvideo`, buttonText: { displayText: '▶️ PLAY VIDEO' }, type: 1 },
                    { buttonId: `${prefix}song`, buttonText: { displayText: '🎧 MUSIC' }, type: 1 }
                ],
                `${bot} • DOWNLOADS`,
                mek
            );

            // GROUP MENU
            await sendButtons(
                conn,
                from,
                '╭─〔 *GROUP MENU* 〕──●●►\n│\n│ 👥 Group tools and management\n╰──────────────●●►',
                [
                    { buttonId: `${prefix}groupmenu`, buttonText: { displayText: '👥 GROUP MENU' }, type: 1 },
                    { buttonId: `${prefix}tagall`, buttonText: { displayText: '📢 TAG ALL' }, type: 1 },
                    { buttonId: `${prefix}admins`, buttonText: { displayText: '🛡️ ADMINS' }, type: 1 }
                ],
                `${bot} • GROUP`,
                mek
            );

            await sendButtons(
                conn,
                from,
                '╭─〔 *GROUP TOOLS* 〕──●●►',
                [
                    { buttonId: `${prefix}groupinfo`, buttonText: { displayText: 'ℹ️ GROUP INFO' }, type: 1 },
                    { buttonId: `${prefix}admins`, buttonText: { displayText: '👮 ADMINS' }, type: 1 },
                    { buttonId: `${prefix}tagall`, buttonText: { displayText: '📣 TAG MEMBERS' }, type: 1 }
                ],
                `${bot} • GROUP`,
                mek
            );

            // TOOLS MENU
            await sendButtons(
                conn,
                from,
                '╭─〔 *TOOLS MENU* 〕──●●►\n│\n│ 🧮 Calculator • 🆔 JID • 🎨 Sticker\n╰──────────────●●►',
                [
                    { buttonId: `${prefix}calc`, buttonText: { displayText: '🧮 CALCULATOR' }, type: 1 },
                    { buttonId: `${prefix}jid`, buttonText: { displayText: '🆔 JID' }, type: 1 },
                    { buttonId: `${prefix}sticker`, buttonText: { displayText: '🎨 STICKER' }, type: 1 }
                ],
                `${bot} • TOOLS`,
                mek
            );

            await sendButtons(
                conn,
                from,
                '╭─〔 *MORE TOOLS* 〕──●●►',
                [
                    { buttonId: `${prefix}tts`, buttonText: { displayText: '🗣️ TTS' }, type: 1 },
                    { buttonId: `${prefix}translate`, buttonText: { displayText: '🌐 TRANSLATE' }, type: 1 },
                    { buttonId: `${prefix}jid`, buttonText: { displayText: '🆔 GET JID' }, type: 1 }
                ],
                `${bot} • TOOLS`,
                mek
            );

            // SEARCH MENU
            await sendButtons(
                conn,
                from,
                '╭─〔 *SEARCH MENU* 〕──●●►\n│\n│ 🔎 Search tools\n╰──────────────●●►',
                [
                    { buttonId: `${prefix}searchmenu`, buttonText: { displayText: '🔎 SEARCH MENU' }, type: 1 },
                    { buttonId: `${prefix}ytsearch`, buttonText: { displayText: '▶️ YOUTUBE' }, type: 1 },
                    { buttonId: `${prefix}google`, buttonText: { displayText: '🌐 GOOGLE' }, type: 1 }
                ],
                `${bot} • SEARCH`,
                mek
            );

            // OWNER MENU
            await sendButtons(
                conn,
                from,
                '╭─〔 *OWNER MENU* 〕──●●►\n│\n│ 👑 Owner controls\n╰──────────────●●►',
                [
                    { buttonId: `${prefix}ownermenu`, buttonText: { displayText: '👑 OWNER MENU' }, type: 1 },
                    { buttonId: `${prefix}setting`, buttonText: { displayText: '⚙️ SETTINGS' }, type: 1 },
                    { buttonId: `${prefix}restart`, buttonText: { displayText: '🔄 RESTART' }, type: 1 }
                ],
                `${bot} • OWNER`,
                mek
            );

        } catch (error) {
            console.error('[MENU ERROR]', error);

            await conn.sendMessage(
                from,
                {
                    text: '❌ Menu එක යැවීමේදී දෝෂයක් ඇති වුණා.\n\n' +
                          'Error: ' + (error.message || error)
                },
                { quoted: mek }
            );
        }
    }
);
