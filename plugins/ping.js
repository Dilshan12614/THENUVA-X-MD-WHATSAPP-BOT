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

    async (conn, mek, m, { from }) => {
        try {
            // ==============================
            // SPEED TEST ANIMATION
            // ==============================
            const start = Date.now();

            const frames = [
                '▰▱▱▱▱▱▱▱▱▱ 10%',
                '▰▰▰▱▱▱▱▱▱▱ 30%',
                '▰▰▰▰▰▱▱▱▱▱ 50%',
                '▰▰▰▰▰▰▰▱▱▱ 70%',
                '▰▰▰▰▰▰▰▰▰▰ 100%'
            ];

            let loadingMsg = null;

            try {
                loadingMsg = await conn.sendMessage(
                    from,
                    {
                        text:
                            '╭━━━〔 🏓 *THENUVA X MD* 〕━━━╮\n' +
                            '┃\n' +
                            '┃ ⚡ *INITIALIZING SPEED TEST*\n' +
                            '┃\n' +
                            '┃ ▱▱▱▱▱▱▱▱▱▱ 0%\n' +
                            '┃\n' +
                            '╰━━━━━━━━━━━━━━━━━━╯'
                    },
                    { quoted: mek }
                );

                for (const frame of frames) {
                    await new Promise(resolve =>
                        setTimeout(resolve, 180)
                    );

                    if (loadingMsg?.key) {
                        await conn.sendMessage(
                            from,
                            {
                                text:
                                    '╭━━━〔 🏓 *THENUVA X MD* 〕━━━╮\n' +
                                    '┃\n' +
                                    '┃ 🚀 *CHECKING BOT SPEED*\n' +
                                    '┃\n' +
                                    `┃ ${frame}\n` +
                                    '┃\n' +
                                    '┃ ⚡ Please wait...\n' +
                                    '┃\n' +
                                    '╰━━━━━━━━━━━━━━━━━━╯',
                                edit: loadingMsg.key
                            }
                        );
                    }
                }
            } catch (animationError) {
                console.log(
                    '[PING ANIMATION]',
                    animationError.message
                );
            }

            // ==============================
            // MEASURE RESPONSE TIME
            // ==============================
            const speed = Date.now() - start;

            let status;

            if (speed <= 100) {
                status = '🚀 SUPER FAST';
            } else if (speed <= 250) {
                status = '⚡ VERY FAST';
            } else if (speed <= 500) {
                status = '🟢 FAST';
            } else {
                status = '🟡 NORMAL';
            }

            // ==============================
            // IMAGE URL
            // ==============================
            const imageUrl =
                'https://i.ibb.co/LXTMV60v/0bade47afdf9.jpg';

            // ==============================
            // PING RESULT MENU
            // ==============================
            await sendListMenu(conn, from, {
                title:
                    '🏓 THENUVA X MD',

                buttonText:
                    'PING RESULT',

                hideListButton:
                    true,

                description:
                    '╭━━━〔 🏓 PING 〕━━━╮\n' +
                    '┃\n' +
                    '┃ 🤖 *BOT* : THENUVA X MD\n' +
                    `┃ ⚡ *SPEED* : ${speed} ms\n` +
                    `┃ 📊 *STATUS* : ${status}\n` +
                    '┃\n' +
                    '┃ 🟢 *SYSTEM ONLINE*\n' +
                    '┃ 🔥 *BOT IS WORKING*\n' +
                    '┃\n' +
                    '╰━━━━━━━━━━━━━━━━━━╯',

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
                                    `${config.PREFIX}alive`,

                                title:
                                    '🟢 Alive',

                                description:
                                    'View bot system status'
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
                '[PING ERROR]',
                error
            );

            try {
                await conn.sendMessage(
                    from,
                    {
                        text:
                            '╭━━━〔 ❌ PING ERROR 〕━━━╮\n' +
                            `┃ ⚠️ ${error.message || 'Unknown error'}\n` +
                            '╰━━━━━━━━━━━━━━━━━━╯'
                    },
                    { quoted: mek }
                );
            } catch (sendError) {
                console.error(
                    '[PING SEND ERROR]',
                    sendError
                );
            }
        }
    }
);
