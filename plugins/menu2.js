const { cmd } = require('../command');
const config = require('../config');
const { sendListMenu } = require('../lib/buttons');
const os = require('os');
const { runtime } = require('../lib/functions');

cmd(
    {
        pattern: 'alive',
        alias: ['online', 'status'],
        react: '🟢',
        desc: 'Check bot online status',
        category: 'main',
        filename: __filename
    },

    async (conn, mek, m, { from }) => {
        try {

            // ==============================
            // SYSTEM INFORMATION
            // ==============================
            const uptime = runtime(process.uptime());

            const usedMemory = (
                process.memoryUsage().rss /
                1024 /
                1024
            ).toFixed(2);

            const totalMemory = (
                os.totalmem() /
                1024 /
                1024 /
                1024
            ).toFixed(2);

            const hostname = os.hostname();

            const botName = 'THENUVA X MD';

            // ==============================
            // IMAGE URL
            // ==============================
            const imageUrl =
                'https://i.ibb.co/LXTMV60v/0bade47afdf9.jpg';

            // ==============================
            // ALIVE MENU
            // ==============================
            await sendListMenu(conn, from, {

                title:
                    '🟢 THENUVA X MD',

                buttonText:
                    'ALIVE STATUS',

                hideListButton:
                    true,

                description: `
╭━━━〔 🟢 ALIVE 〕━━━╮
┃
┃ 🤖 *BOT* : ${botName}
┃ ⚡ *STATUS* : ONLINE
┃ ⏱️ *UPTIME* : ${uptime}
┃
┃ 💾 *RAM USED* : ${usedMemory} MB
┃ 🖥️ *TOTAL RAM* : ${totalMemory} GB
┃ 🌐 *HOST* : ${hostname}
┃
┃ ✅ *SYSTEM ONLINE*
┃ 🔥 *BOT IS WORKING*
┃
╰━━━━━━━━━━━━━━━━━━╯
                `.trim(),

                footer:
                    '⚡ Powered by THENUVA X MD',

                image:
                    imageUrl,

                sections: [
                    {
                        title:
                            '🤖 THENUVA X MD',

                        rows: [
                            {
                                id:
                                    `${config.PREFIX}ping`,

                                title:
                                    '🏓 Ping',

                                description:
                                    'Check bot response speed'
                            },

                            {
                                id:
                                    `${config.PREFIX}menu`,

                                title:
                                    '📋 Main Menu',

                                description:
                                    'Open complete bot menu'
                            },

                            {
                                id:
                                    `${config.PREFIX}about`,

                                title:
                                    '🤖 About',

                                description:
                                    'View bot information'
                            }
                        ]
                    }
                ]

            });

        } catch (error) {

            console.error(
                '[ALIVE ERROR]',
                error
            );

            try {

                await conn.sendMessage(
                    from,
                    {
                        text:
                            `❌ *ALIVE ERROR*\n\n` +
                            `⚠️ ${error.message || 'Unknown error'}`
                    }
                );

            } catch (sendError) {

                console.error(
                    '[ALIVE SEND ERROR]',
                    sendError
                );
            }
        }
    }
);
