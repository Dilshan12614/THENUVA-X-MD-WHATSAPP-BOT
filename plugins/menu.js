const { cmd } = require('../command');
const config = require('../config');
const os = require('os');
const { runtime } = require('../lib/functions');
const { sendListMenu } = require('../lib/buttons');

cmd({
    pattern: 'menu',
    alias: ['help', 'commands'],
    react: '📋',
    desc: 'Show interactive list menu',
    category: 'main',
    filename: __filename
},
async (conn, mek, m, { from, pushName }) => {
    try {
        const prefix = config.PREFIX || '.';
        const userName = pushName || m?.pushName || 'User';
        const uptime = runtime(process.uptime());

        const usedMemory = (
            process.memoryUsage().rss / 1024 / 1024
        ).toFixed(2);

        const sections = [
            {
                title: '🤖 ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ',
                rows: [
                    {
                        id: `${prefix}menuall`,
                        title: '📚 ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅs',
                        description: 'ᴠɪᴇᴡ ᴀʟʟ ʙᴏᴛ ᴄᴏᴍᴍᴀɴᴅs'
                    },
                    {
                        id: `${prefix}alive`,
                        title: '🟢 ʙᴏᴛ sᴛᴀᴛᴜs',
                        description: 'ᴄʜᴇᴄᴋ ʙᴏᴛ ᴏɴʟɪɴᴇ sᴛᴀᴛᴜs'
                    },
                    {
                        id: `${prefix}ping`,
                        title: '🏓 ᴘɪɴɢ',
                        description: 'ᴄʜᴇᴄᴋ ʀᴇsᴘᴏɴsᴇ sᴘᴇᴇᴅ'
                    },
                    {
                        id: `${prefix}owner`,
                        title: '👑 ᴏᴡɴᴇʀ',
                        description: 'ʙᴏᴛ ᴏᴡɴᴇʀ ᴅᴇᴛᴀɪʟs'
                    }
                ]
            },
            {
                title: '🎮 ғᴜɴ & ᴛᴏᴏʟs',
                rows: [
                    {
                        id: `${prefix}chess`,
                        title: '♟️ ᴄʜᴇss',
                        description: 'ᴘʟᴀʏ ᴀ ᴄʜᴇss ɢᴀᴍᴇ'
                    },
                    {
                        id: `${prefix}calc`,
                        title: '🧮 ᴄᴀʟᴄᴜʟᴀᴛᴏʀ',
                        description: 'ᴏᴘᴇɴ ᴄᴀʟᴄᴜʟᴀᴛᴏʀ'
                    },
                    {
                        id: `${prefix}jid`,
                        title: '🆔 ᴊɪᴅ',
                        description: 'ɢᴇᴛ ᴄʜᴀᴛ ɪᴅ'
                    }
                ]
            },
            {
                title: '📥 ᴅᴏᴡɴʟᴏᴀᴅs',
                rows: [
                    {
                        id: `${prefix}fb`,
                        title: '📘 ғᴀᴄᴇʙᴏᴏᴋ',
                        description: 'ᴅᴏᴡɴʟᴏᴀᴅ ғᴀᴄᴇʙᴏᴏᴋ ᴍᴇᴅɪᴀ'
                    },
                    {
                        id: `${prefix}video`,
                        title: '🎬 ᴠɪᴅᴇᴏ',
                        description: 'ᴅᴏᴡɴʟᴏᴀᴅ ᴠɪᴅᴇᴏ'
                    },
                    {
                        id: `${prefix}apk`,
                        title: '📱 ᴀᴘᴋ',
                        description: 'ᴀᴘᴋ ᴅᴏᴡɴʟᴏᴀᴅ ᴄᴏᴍᴍᴀɴᴅ'
                    }
                ]
            }
        ];

        const menuText = `👋 *ʜᴇʟʟᴏ... ${userName}* 
*ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ* 🎉

╭─〔 *sᴛᴀᴛᴜs ᴘᴀɴᴇʟ* 〕──●●►
│
│ ⏳ *ᴜᴘᴛɪᴍᴇ*  : ${uptime}
│ 👤 *ᴜsᴇʀ*    : ${userName}
│ 📁 *ʀᴀᴍ*     : ${usedMemory}MB
│ ⚙️ *ʜᴏsᴛ*    : ${os.hostname()}
│ 👨‍💻 *ᴏᴡɴᴇʀ*   : Dilshan Ashinsa
│ 🧬 *ᴠᴇʀsɪᴏɴ* : v2.0.0
│
╰────────────────●●►

🔘 Select an option.`;

        await sendListMenu(conn, from, {
            title: menuText,
            buttonText: '📋 ᴏᴘᴇɴ ᴍᴇɴᴜ',
            sections,
            footer: 'ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa',
            image: 'https://i.ibb.co/LXTMV60v/0bade47afdf9.jpg',
            hideListButton: false
        }, mek);

    } catch (error) {
        console.error('[MENU ERROR]', error);

        await conn.sendMessage(from, {
            text: `❌ *ᴍᴇɴᴜ ᴇʀʀᴏʀ*\n\n${error.message || error}`
        }, { quoted: mek });
    }
});
