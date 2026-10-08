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
    async (conn, mek, m, { from, reply }) => {
        try {
            // ==============================
            // START SPEED TEST
            // ==============================
            const start = Date.now();

            // Don't use quoted/edit here.
            await conn.sendMessage(from, {
                text: `🏓 *THENUVA X MD*\n\n⏳ Testing Speed...`
            });

            const speed = Date.now() - start;

            // ==============================
            // RESULT
            // ==============================
            let speedStatus;

            if (speed <= 100) {
                speedStatus = '🚀 Excellent';
            } else if (speed <= 300) {
                speedStatus = '⚡ Very Fast';
            } else if (speed <= 700) {
                speedStatus = '🟢 Good';
            } else {
                speedStatus = '🟡 Normal';
            }

            const resultText = `
╭━━━〔 🏓 PING RESULT 〕━━━╮
┃
┃ 🤖 *Bot:* THENUVA X MD
┃ ⚡ *Response:* ${speed} ms
┃ 📊 *Status:* ${speedStatus}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

⚡ *Powered by THENUVA X MD*
`.trim();

            await conn.sendMessage(from, {
                text: resultText
            });

            // ==============================
            // BUTTON / LIST MENU
            // ==============================
            await sendListMenu(conn, from, {
                title: '🏓 THENUVA X MD',
                buttonText: 'BOT OPTIONS',
                footer: '⚡ Powered by THENUVA X MD',
                sections: [
                    {
                        title: '🤖 THENUVA X MD',
                        rows: [
                            {
                                id: `${config.PREFIX}alive`,
                                title: '🟢 Alive',
                                description: 'View complete bot status'
                            },
                            {
                                id: `${config.PREFIX}menu`,
                                title: '📋 Main Menu',
                                description: 'Open THENUVA X MD menu'
                            },
                            {
                                id: `${config.PREFIX}about`,
                                title: '🤖 About Bot',
                                description: 'View bot information'
                            }
                        ]
                    }
                ]
            });

        } catch (error) {
            console.error('[PING ERROR]', error);

            try {
                await conn.sendMessage(from, {
                    text: `❌ *PING ERROR*\n\n${error.message || 'Unknown error'}`
                });
            } catch (sendError) {
                console.error('[PING SEND ERROR]', sendError);
            }
        }
    }
);
