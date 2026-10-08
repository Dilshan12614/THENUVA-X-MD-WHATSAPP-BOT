const { cmd } = require('../command');
const config = require('../config');
const { sendListMenu } = require('../lib/buttons');

cmd(
    {
        pattern: 'ping',
        alias: ['speed', 'pong'],
        react: '🏓',
        desc: 'Check bot response speed',
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
            reply
        }
    ) => {
        try {

            const start = Date.now();

            // Initial message
            const sent = await conn.sendMessage(
                from,
                {
                    text:
                        `╭━━━〔 🏓 THENUVA X MD 〕━━━╮\n` +
                        `┃\n` +
                        `┃ ⏳ *Testing response speed...*\n` +
                        `┃\n` +
                        `╰━━━━━━━━━━━━━━━━━━━━╯`
                },
                {
                    quoted
                }
            );

            const end = Date.now();
            const speed = end - start;

            // Edit previous message
            try {
                await conn.sendMessage(
                    from,
                    {
                        text:
                            `╭━━━〔 🏓 THENUVA X MD 〕━━━╮\n` +
                            `┃\n` +
                            `┃ 🟢 *PONG!*\n` +
                            `┃\n` +
                            `┃ ⚡ Response : *${speed} ms*\n` +
                            `┃ 🚀 Status   : *ONLINE*\n` +
                            `┃ 🤖 Bot      : *THENUVA X MD*\n` +
                            `┃\n` +
                            `╰━━━━━━━━━━━━━━━━━━━━╯`,
                        edit: sent.key
                    }
                );
            } catch (editError) {

                // Fallback if message editing isn't supported
                await conn.sendMessage(
                    from,
                    {
                        text:
                            `╭━━━〔 🏓 THENUVA X MD 〕━━━╮\n` +
                            `┃\n` +
                            `┃ 🟢 *PONG!*\n` +
                            `┃\n` +
                            `┃ ⚡ Response : *${speed} ms*\n` +
                            `┃ 🚀 Status   : *ONLINE*\n` +
                            `┃\n` +
                            `╰━━━━━━━━━━━━━━━━━━━━╯`
                    },
                    {
                        quoted
                    }
                );
            }

            // Interactive menu
            await sendListMenu(
                conn,
                from,
                {
                    title:
                        `╭━━━〔 🏓 THENUVA X MD 〕━━━╮\n` +
                        `┃\n` +
                        `┃ 🟢 *PONG!*\n` +
                        `┃ ⚡ Speed: *${speed} ms*\n` +
                        `┃\n` +
                        `╰━━━━━━━━━━━━━━━━━━━━╯`,

                    buttonText:
                        'BOT OPTIONS',

                    footer:
                        '⚡ Powered by THENUVA X MD',

                    sections: [
                        {
                            title:
                                '🤖 THENUVA X MD',

                            rows: [
                                {
                                    id:
                                        `${config.PREFIX}alive`,

                                    title:
                                        '🟢 Alive',

                                    description:
                                        'View complete bot status'
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

        } catch (error) {

            console.error(
                '[PING ERROR]',
                error
            );

            return reply(
                `╭━━━〔 ❌ THENUVA X MD 〕━━━╮\n` +
                `┃\n` +
                `┃ Ping check failed.\n` +
                `┃\n` +
                `╰━━━━━━━━━━━━━━━━━━━━╯`
            );
        }
    }
);
