const settings = require('../settings');
const { cmd } = require('../command');
const { sendListMenu } = require('../lib/buttons');

const OWNER_NUMBER = String(
    settings.ownerNumber || '94772194789'
).replace(/\D/g, '');

cmd(
    {
        pattern: 'owner',
        alias: ['ownerinfo', 'ownerbutton'],
        react: '👑',
        desc: 'Show bot owner information',
        category: 'main',
        filename: __filename
    },

    async (conn, mek, m, { from, quoted }) => {
        try {
            const ownerName = settings.ownerName || 'Dilshan Ashinsa';

            const ownerText =
                '╭━━〔 👑 ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ 〕━━╮\n' +
                '┃\n' +
                `┃ 👤 ᴏᴡɴᴇʀ : ${ownerName}\n` +
                `┃ 📱 ɴᴜᴍʙᴇʀ : +${OWNER_NUMBER}\n` +
                '┃ 🤖 ʙᴏᴛ : ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ\n' +
                '┃ ⚡ sᴛᴀᴛᴜs : ᴏғғɪᴄɪᴀʟ\n' +
                '┃\n' +
                '╰━━━━━━━━━━━━━━╯\n\n' +
                
                '✨> ᴄᴏɴᴛᴀᴄᴛ ᴛʜᴇ ᴏᴡɴᴇʀ ᴏʀ ᴠɪsɪᴛ ᴏᴜʀ ᴏғғɪᴄɪᴀʟ ᴄʜᴀɴɴᴇʟ.';

            const sections = [
                {
                    title: '👑 ᴏᴡɴᴇʀ ᴏᴘᴛɪᴏɴs',
                    rows: [
                        {
                            title: '📱 ᴄᴏɴᴛᴀᴄᴛ ᴏᴡɴᴇʀ',
                            description: 'ᴏᴘᴇɴ ᴏᴡɴᴇʀ ᴄᴏɴᴛᴀᴄᴛ',
                            id: 'thenuva:ownercontact'
                        },
                        {
                            title: '📢 ᴏғғɪᴄɪᴀʟ ᴄʜᴀɴɴᴇʟ',
                            description: 'ᴠɪsɪᴛ ᴛʜᴇ ᴡʜᴀᴛsᴀᴘᴘ ᴄʜᴀɴɴᴇʟ',
                            id: 'thenuva:ownerchannel'
                        }
                    ]
                }
            ];

            await sendListMenu(
                conn,
                from,
                {
                    title: ownerText,
                    buttonText: '👑 ᴏᴡɴᴇʀ ᴍᴇɴᴜ',
                    sections,
                    footer: 'ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa'
                },
                quoted || mek
            );

        } catch (error) {
            console.error('[OWNER COMMAND ERROR]', error);

            await conn.sendMessage(
                from,
                {
                    text: '❌ ᴏᴡɴᴇʀ ᴍᴇɴᴜ ᴇʀʀᴏʀ'
                },
                { quoted: mek }
            );
        }
    }
);
