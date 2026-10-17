const { cmd } = require('../command');
const { runtime } = require('../lib/functions');
const config = require('../config');
const { sendListMenu } = require('../lib/buttons');

cmd({
    pattern: 'uptime',
    alias: ['runtime', 'up'],
    desc: 'Check bot uptime',
    category: 'main',
    react: '⏱️',
    filename: __filename
},
async (conn, mek, m, { from, reply, pushname }) => {
    try {
        const uptime = runtime(process.uptime());

        const startTime = new Date(
            Date.now() - process.uptime() * 1000
        );

        const botName = config.BOT_NAME || 'THENUVA X MD';
        const ownerName = config.OWNER_NAME || 'Dilshan Ashinsa';

        const caption = `
╭━━〔 *ᴜᴘᴛɪᴍᴇ ᴘᴀɴᴇʟ* 〕━━╮
┃
┃ 👋 ʜᴇʟʟᴏ, ${pushname || 'User'}
┃
┃ ⏱️ *ʀᴜɴᴛɪᴍᴇ*
┃ └─ ${uptime}
┃
┃ 🕒 *sᴛᴀʀᴛᴇᴅ ᴀᴛ*
┃ └─ ${startTime.toLocaleString()}
┃
┃ 🤖 *ʙᴏᴛ ɴᴀᴍᴇ*
┃ └─ ${botName}
┃
┃ 🟢 *sᴛᴀᴛᴜs*
┃ └─ ᴏɴʟɪɴᴇ
┃
╰━━━━━━━━━━━━━━━━━━╯

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ${ownerName}`;

        await sendListMenu(
            conn,
            from,
            {
                title: caption,
                buttonText: '⏱️ UPTIME OPTIONS',
                footer: 'ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ',
                sections: [
                    {
                        title: '⏱️ UPTIME OPTIONS',
                        rows: [
                            {
                                title: '🔄 Refresh Uptime',
                                id: '.uptime',
                                description: 'Check the latest uptime'
                            },
                            {
                                title: '🏓 Ping Bot',
                                id: '.ping',
                                description: 'Check bot response speed'
                            },
                            {
                                title: '🟢 Bot Status',
                                id: '.alive',
                                description: 'Check bot status'
                            },
                            {
                                title: '🏠 Main Menu',
                                id: '.menu',
                                description: 'Open main menu'
                            }
                        ]
                    }
                ]
            },
            mek
        );

    } catch (error) {
        console.error('[UPTIME ERROR]', error);

        await reply(
            `❌ Uptime Error: ${error.message}`
        );
    }
});
