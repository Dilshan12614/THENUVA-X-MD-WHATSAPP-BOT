const config = require('../config');
const { cmd } = require('../command');
const { sendListMenu } = require('../lib/buttons');

const OWNER_NUMBER = String(
    config.OWNER_NUMBER ||
    process.env.OWNER_NUMBER ||
    '94772194789'
).replace(/\D/g, '');

const CHANNEL_URL =
    'https://whatsapp.com/channel/0029VbDTWC7HFxOwuNxNHV1z';

cmd(
    {
        pattern: 'owner',
        alias: ['ownerinfo', 'ownerbutton'],
        react: '👑',
        desc: 'Show bot owner information',
        category: 'main',
        filename: __filename
    },

    async (conn, mek, m, { from, pushName }) => {
        try {
            const ownerName =
                config.OWNER_NAME ||
                'Dilshan Ashinsa';

            const ownerText =
                '╭━━〔 👑 ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ 〕━━╮\n' +
                '┃\n' +
                `┃ 👤 ᴏᴡɴᴇʀ : ${ownerName}\n` +
                `┃ 📱 ɴᴜᴍʙᴇʀ : +${OWNER_NUMBER}\n` +
                '┃ 🤖 ʙᴏᴛ : ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ\n' +
                '┃ ⚡ sᴛᴀᴛᴜs : ᴏғғɪᴄɪᴀʟ\n' +
                '┃\n' +
                '╰━━━━━━━━━━━━━━╯\n\n' +
                `👋 ʜᴇʟʟᴏ ${pushName || 'ᴜsᴇʀ'}!\n\n` +
                '✨ ᴄᴏɴᴛᴀᴄᴛ ᴛʜᴇ ᴏᴡɴᴇʀ ᴏʀ ᴠɪsɪᴛ ᴏᴜʀ ᴏғғɪᴄɪᴀʟ ᴄʜᴀɴɴᴇʟ.';

            const sections = [
                {
                    title: '👑 ᴏᴡɴᴇʀ ᴏᴘᴛɪᴏɴs',
                    rows: [
                        {
                            title: '📱 ᴄᴏɴᴛᴀᴄᴛ ᴏᴡɴᴇʀ',
                            description: 'ᴄᴏɴᴛᴀᴄᴛ ᴛʜᴇ ʙᴏᴛ ᴏᴡɴᴇʀ',
                            id: 'thenuva:ownercontact'
                        },
                        {
                            title: '📢 ᴏғғɪᴄɪᴀʟ ᴄʜᴀɴɴᴇʟ',
                            description: 'ᴠɪsɪᴛ ᴛʜᴇ ᴏғғɪᴄɪᴀʟ ᴄʜᴀɴɴᴇʟ',
                            id: 'thenuva:ownerchannel'
                        }
                    ]
                }
            ];

            // Send owner menu using the existing button helper.
            await sendListMenu(
                conn,
                from,
                {
                    title: ownerText,
                    buttonText: '👑 ᴏᴡɴᴇʀ ᴍᴇɴᴜ',
                    sections,
                    footer: 'ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅɪʟsʜᴀɴ ᴀsʜɪɴsᴀ'
                }
            );

        } catch (error) {
            console.error('[OWNER COMMAND ERROR]', error);

            await conn.sendMessage(from, {
                text: '❌ ᴏᴡɴᴇʀ ᴍᴇɴᴜ ᴇʀʀᴏʀ\n\n' +
                    'ᴘʟᴇᴀsᴇ ᴄʜᴇᴄᴋ ᴛʜᴇ ʙᴏᴛ ʟᴏɢs.'
            });
        }
    }
);
