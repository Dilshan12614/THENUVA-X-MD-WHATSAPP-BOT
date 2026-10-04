const { sendButtons } = require('../lib/buttons');
const config = require('../config');
const { cmd, commands } = require('../command');
const os = require('os');
const { runtime } = require('../lib/functions');

cmd({
    pattern: "menu2",
    react: "👾",
    desc: "Get command list",
    category: "main",
    filename: __filename
},
async (
    conn,
    mek,
    m,
    {
        from,
        quoted,
        body,
        isCmd,
        command,
        args,
        q,
        isGroup,
        sender,
        senderNumber,
        botNumber2,
        botNumber,
        pushname,
        isMe,
        isOwner,
        groupMetadata,
        groupName,
        participants,
        groupAdmins,
        isBotAdmins,
        isAdmins,
        reply
    }
) => {

    try {

        /*
        ───────────────────────────────
        COMMANDS TO HIDE FROM MENU
        ───────────────────────────────
        */

        const hiddenCommands = [
            "url",
            "vv"
        ];

        /*
        ───────────────────────────────
        CREATE MENU CATEGORIES
        ───────────────────────────────
        */

        let menu = {
            main: '',
            download: '',
            group: '',
            owner: '',
            convert: '',
            search: ''
        };

        /*
        ───────────────────────────────
        ADD ALL PLUGINS
        ───────────────────────────────
        */

        for (let i = 0; i < commands.length; i++) {

            const plugin = commands[i];

            if (!plugin.pattern) continue;

            if (plugin.dontAddCommandList) continue;

            const commandName = String(plugin.pattern).toLowerCase();

            // Hide selected commands
            if (hiddenCommands.includes(commandName)) continue;

            // Only known categories
            if (!menu[plugin.category]) continue;

            menu[plugin.category] +=
                `*┋* ${config.PREFIX}${plugin.pattern}\n`;
        }

        /*
        ───────────────────────────────
        FULL MENU
        ───────────────────────────────
        */

        const madeMenu =
`👋 HELLOW... *${pushname || 'User'}* ❤️
Welcome to *THENUWA X MD*

✅ *THENUWA X MD* ✅

╭┈───────────────•
│ ◦ 🕒 *Runtime* : ${runtime(process.uptime())}
│ ◦ ⚡ *Mode* : *[${config.MODE}]*
│ ◦ ⚙️ *Prefix* : *[${config.PREFIX}]*
│ ◦ 💾 *RAM Use* : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
│ ◦ 🤖 *Bot Name* : *THENUVA X MD*
│ ◦ 👤 *Creator* : *Thenula/Dilshan*
│ ◦ 📌 *Version* : *ᴠ.2.0.0*
│ ◦ 📜 *Menu* : *${config.PREFIX}menu2*
╰┈───────────────•

*╭───────────────❒*
*│* 🧑‍💻 *THENUVA TEAM* 🧑‍💻
*┕───────────────❒*

📥 *DOWNLOAD COMMANDS* 📥

╭──────────●●►
${menu.download || '*┋* No Commands Available\n'}
╰──────────●●►

⚙️ *MAIN COMMANDS* ⚙️

╭──────────●●►
${menu.main || '*┋* No Commands Available\n'}
╰──────────●●►

👥 *GROUP COMMANDS* 👥

╭──────────●●►
${menu.group || '*┋* No Commands Available\n'}
╰──────────●●►

👨‍💻 *OWNER COMMANDS* 👨‍💻

╭──────────●●►
${menu.owner || '*┋* No Commands Available\n'}
╰──────────●●►

🎡 *CONVERT COMMANDS* 🎡

╭──────────●●►
${menu.convert || '*┋* No Commands Available\n'}
╰──────────●●►

🔎 *SEARCH COMMANDS* 🔎

╭──────────●●►
${menu.search || '*┋* No Commands Available\n'}
╰──────────●●►

*❒▭▬▭▬▭▬▭▬▭▬▭▬▭▬▭❒*

> 💥 *POWERED BY THENUVA X MD* 💥`;

        /*
        ───────────────────────────────
        SEND MENU
        ───────────────────────────────
        */

        await conn.sendMessage(
            from,
            {
                image: {
                    url: 'https://i.ibb.co/N68698yW/5df1e9c651fd.jpg'
                },
                caption: madeMenu,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363403804248705@newsletter',
                        newsletterName: 'THENUWA X MD',
                        serverMessageId: 143
                    }
                }
            },
            { quoted: mek }
        );

        /*
        ───────────────────────────────
        MENU BUTTONS
        ───────────────────────────────
        */

        await sendButtons(
            conn,
            from,
            {
                text: '🎛️ *THENUVA X MD MENU OPTIONS*',
                prefix: config.PREFIX,

                buttons: [
                    {
                        id: 'thenuva:all',
                        text: '📚 Choose All Options'
                    }
                ]
            },
            mek
        );

    } catch (e) {

        console.error('[MENU ERROR]', e);

        return reply(
            `❌ *MENU ERROR*\n\n${e.message || e}`
        );
    }
});
