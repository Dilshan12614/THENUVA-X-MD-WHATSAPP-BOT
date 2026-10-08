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

            /*
            |-----------------------------------------
            | Start timer
            |-----------------------------------------
            */

            const start = Date.now();

            /*
            |-----------------------------------------
            | Send testing message
            |-----------------------------------------
            */

            const sent = await conn.sendMessage(
                from,
                {
                    text:
                        `╭━━━〔 🏓 THENUVA X MD 〕━━━╮\n` +
                        `┃\n` +
                        `┃ ⏳ *Testing Speed...*\n` +
                        `┃\n` +
                        `╰━━━━━━━━━━━━━━━━━━━━╯`
                },
                {
                    quoted: quoted || mek || undefined
                }
            );

            /*
            |-----------------------------------------
            | Calculate speed
            |-----------------------------------------
            */

            const speed =
                Date.now() - start;

            /*
            |-----------------------------------------
            | Edit testing message
            |-----------------------------------------
            */

            const resultText =
                `╭━━━〔 🏓 THENUVA X MD 〕━━━╮\n` +
                `┃\n` +
                `┃ 🟢 *PONG!*\n` +
                `┃\n` +
                `┃ ⚡ Response : *${speed} ms*\n` +
                `┃ 🚀 Status   : *ONLINE*\n` +
                `┃ 🤖 Bot      : *THENUVA X MD*\n` +
                `┃\n` +
                `╰━━━━━━━━━━━━━━━━━━━━╯`;

            try {

                await conn.sendMessage(
                    from,
                    {
                        text: resultText,
                        edit: sent.key
                    }
                );

            } catch (editError) {

                console.log(
                    '[PING] Message edit failed, sending result normally.'
                );

                /*
                |-----------------------------------------
                | Fallback message
                |-----------------------------------------
                */

                await conn.sendMessage(
                    from,
                    {
                        text: resultText
                    },
                    {
                        quoted: quoted || mek || undefined
                    }
                );
            }

            /*
            |-----------------------------------------
            | Interactive buttons/list
            |-----------------------------------------
            */

            await sendListMenu(
                conn,
                from,
                {
                    title:
                        `╭━━━〔 🏓 THENUVA X MD 〕━━━╮\n` +
                        `┃\n` +
                        `┃ 🟢 *PONG!*\n` +
                        `┃\n` +
                        `┃ ⚡ Speed : *${speed} ms*\n` +
                        `┃ 🚀 Status : *ONLINE*\n` +
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

                quoted || mek
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
