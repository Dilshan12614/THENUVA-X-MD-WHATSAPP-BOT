const os = require('os');

const { cmd } = require('../command');
const config = require('../config');
const { runtime } = require('../lib/functions');
const { sendListMenu } = require('../lib/buttons');

cmd(
    {
        pattern: 'alive',
        alias: ['online', 'status'],
        react: '🟢',
        desc: 'Check bot online status',
        category: 'main',
        filename: __filename
    },

    async (
        conn,
        mek,
        m,
        {
            from,
            quoted,
            pushname,
            reply
        }
    ) => {
        try {

            /*
            |-----------------------------------------
            | System information
            |-----------------------------------------
            */

            const uptime =
                runtime(
                    process.uptime()
                );

            const ram =
                (
                    process.memoryUsage()
                        .rss /
                    1024 /
                    1024
                ).toFixed(2);

            const totalRam =
                (
                    os.totalmem() /
                    1024 /
                    1024 /
                    1024
                ).toFixed(2);

            const hostname =
                os.hostname();

            const owner =
                config.OWNER_NAME ||
                'Dilshan Ashinsa';

            const user =
                pushname ||
                'User';

            /*
            |-----------------------------------------
            | Alive message
            |-----------------------------------------
            */

            const text =
                `╭━━━〔 🟢 THENUVA X MD 〕━━━╮
┃
┃  👋 Hello *${user}*
┃
┃  🤖 *BOT STATUS*
┃  ├─ 🟢 Status : *ONLINE*
┃  ├─ ⚡ Speed  : *ACTIVE*
┃  └─ ⏱️ Uptime : *${uptime}*
┃
┃  💻 *SYSTEM*
┃  ├─ 💾 RAM : *${ram} MB*
┃  ├─ 🧠 Total : *${totalRam} GB*
┃  └─ 🖥️ Host : *${hostname}*
┃
┃  👑 *OWNER*
┃  └─ ${owner}
┃
┃  ✨ *THENUVA X MD*
┃  ⚡ Powered by *Dilshan Ashinsa*
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;

            /*
            |-----------------------------------------
            | Interactive Alive Menu
            |-----------------------------------------
            */

            await sendListMenu(
                conn,
                from,
                {
                    title:
                        `╭━━━〔 🟢 THENUVA X MD 〕━━━╮
┃
┃ 🤖 *BOT IS ONLINE*
┃
┃ ⚡ Fast • Stable • Active
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`,

                    buttonText:
                        'BOT STATUS',

                    footer:
                        '⚡ Powered by THENUVA X MD',

                    sections: [
                        {
                            title:
                                '🟢 SYSTEM STATUS',

                            rows: [
                                {
                                    id:
                                        `${config.PREFIX}ping`,

                                    title:
                                        '⚡ Ping',

                                    description:
                                        'Check bot response speed'
                                },

                                {
                                    id:
                                        `${config.PREFIX}menu`,

                                    title:
                                        '📋 Main Menu',

                                    description:
                                        'Open THENUVA X MD menu'
                                },

                                {
                                    id:
                                        `${config.PREFIX}about`,

                                    title:
                                        '🤖 About Bot',

                                    description:
                                        'View bot information'
                                }
                            ]
                        }
                    ]
                },

                quoted
            );

            /*
            |-----------------------------------------
            | Send detailed alive information
            |-----------------------------------------
            */

            await conn.sendMessage(
                from,
                {
                    text
                },
                {
                    quoted
                }
            );

        } catch (error) {

            console.error(
                '[ALIVE ERROR]',
                error
            );

            return reply(
                `╭━━━〔 ❌ THENUVA X MD 〕━━━╮
┃
┃ Unable to get bot status.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
            );
        }
    }
);
