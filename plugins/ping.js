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
            // SPEED TEST
            // ==============================
            const start = Date.now();

            await new Promise(resolve => setTimeout(resolve, 10));

            const speed = Date.now() - start;

            let status;

            if (speed <= 50) {
                status = '🚀 SUPER FAST';
            } else if (speed <= 150) {
                status = '⚡ VERY FAST';
            } else if (speed <= 300) {
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
            // ONE INTERACTIVE MESSAGE
            // ==============================
            await sendListMenu(conn, from, {
                title: '🏓 THENUVA X MD',

                buttonText: 'PING RESULT',

                description: `
╭━━━〔 🏓 PING 〕━━━╮
┃
┃ 🤖 *BOT* : THENUVA X MD
┃ ⚡ *SPEED* : ${speed} ms
┃ 📊 *STATUS* : ${status}
┃
┃ 🟢 *SYSTEM ONLINE*
┃ 🔥 *BOT IS WORKING*
┃
╰━━━━━━━━━━━━━━━━━━╯
                `.trim(),

                footer: '⚡ Powered by THENUVA X MD',

                image: imageUrl,

                sections: [
                    {
                        title: '🤖 THENUVA X MD',
                        rows: [
                            {
                                id: `${config.PREFIX}alive`,
                                title: '🟢 Alive',
                                description: 'View bot system status'
                            },
                            {
                                id: `${config.PREFIX}menu`,
                                title: '📋 Main Menu',
                                description: 'Open complete bot menu'
                            },
                            {
                                id: `${config.PREFIX}about`,
                                title: '🤖 About',
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
                    text:
                        `❌ *PING ERROR*\n\n` +
                        `⚠️ ${error.message || 'Unknown error'}`
                });
            } catch (sendError) {
                console.error('[PING SEND ERROR]', sendError);
            }
        }
    }
);
