const { cmd } = require('../command');
const config = require('../config');
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
            const uptime = runtime(process.uptime());

            const usedMemory = (
                process.memoryUsage().rss / 1024 / 1024
            ).toFixed(2);

            const totalMemory = (
                os.totalmem() / 1024 / 1024 / 1024
            ).toFixed(2);

            const ownerNumber = '94772194789';

            const channelUrl =
                'https://whatsapp.com/channel/0029VbDTWC7HFxOwuNxNHV1z';

            const imageUrl =
                'https://i.ibb.co/LXTMV60v/0bade47afdf9.jpg';

            const caption = `
╭━━━〔 🟢 ALIVE 〕━━━╮
┃
┃ 🤖 *BOT* : THENUVA X MD
┃ ⚡ *STATUS* : ONLINE
┃ ⏱️ *UPTIME* : ${uptime}
┃ 💾 *RAM USED* : ${usedMemory} MB
┃ 🖥️ *TOTAL RAM* : ${totalMemory} GB
┃
┃ ✅ *SYSTEM ONLINE*
┃ 🔥 *BOT IS WORKING*
┃
╰━━━━━━━━━━━━━━━━━━╯

🌐 *THENUVA X MD*

Choose Contact Me or View Channel below.
            `.trim();

            await conn.sendMessage(from, {
                image: { url: imageUrl },
                caption,
                footer: '⚡ Powered by THENUVA X MD',
                templateButtons: [
                    {
                        index: 1,
                        urlButton: {
                            displayText: '👤 Contact Me',
                            url: `https://wa.me/${ownerNumber}`
                        }
                    },
                    {
                        index: 2,
                        urlButton: {
                            displayText: '📢 View Channel',
                            url: channelUrl
                        }
                    }
                ],
                headerType: 4
            });

        } catch (error) {
            console.error('[ALIVE ERROR]', error);

            await conn.sendMessage(from, {
                text:
                    `❌ *ALIVE ERROR*\n\n` +
                    `${error.message || 'Unknown error'}`
            });
        }
    }
);
