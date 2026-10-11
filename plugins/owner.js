const config = require('../config');
const { cmd } = require('../command');
const { sendListMenu } = require('../lib/buttons');

const OWNER_NUMBER = String(
    config.OWNER_NUMBER ||
    process.env.OWNER_NUMBER ||
    '94772194789'
).replace(/\D/g, '');

const OWNER_NAME =
    config.OWNER_NAME ||
    'Dilshan Ashinsa';

const OWNER_IMAGE_URL =
    'https://i.ibb.co/LXTMV60v/0bade47afdf9.jpg';

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
            const ownerText =
                '╭━━〔 👑 ᴏᴡɴᴇʀ ɪɴғᴏ 〕━━●●►\n' +
                '┃\n' +
                `┃ 👤 ᴏᴡɴᴇʀ  : ${OWNER_NAME}\n` +
                `┃ 📱 ɴᴜᴍʙᴇʀ : +${OWNER_NUMBER}\n` +
                '┃ 🤖 ʙᴏᴛ    : ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ\n' +
                '┃ ⚡ sᴛᴀᴛᴜs  : ᴏғғɪᴄɪᴀʟ\n' +
                '┃\n' +
                '╰━━━━━━━━━━━━━━●●►\n\n' +
                `👋 ʜᴇʟʟᴏ, ${pushName || 'ᴜsᴇʀ'}!\n\n` +
                '✨ ᴄᴏɴᴛᴀᴄᴛ ᴛʜᴇ ᴏᴡɴᴇʀ ᴏʀ\n' +
                '📢 ᴠɪsɪᴛ ᴏᴜʀ ᴏғғɪᴄɪᴀʟ ᴄʜᴀɴɴᴇʟ.\n\n' +
                '╭━━〔 ⚡ ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ 〕━━●●►';

            const sections = [
                {
                    title: '👑 ᴏᴡɴᴇʀ ᴏᴘᴛɪᴏɴs',
                    rows: [
                        {
                            title: '📱 ᴄᴏɴᴛᴀᴄᴛ ᴏᴡɴᴇʀ',
                            description: 'Chat with the bot owner',
                            id: 'thenuva:ownercontact'
                        },
                        {
                            title: '📢 ᴏғғɪᴄɪᴀʟ ᴄʜᴀɴɴᴇʟ',
                            description: 'Visit THENUVA X MD updates',
                            id: 'thenuva:ownerchannel'
                        }
                    ]
                }
            ];

            await sendListMenu(conn, from, {
                title: ownerText,
                buttonText: 'ᴏᴡɴᴇʀ ᴍᴇɴᴜ',
                sections,
                footer: 'ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa',
                image: OWNER_IMAGE_URL
            });

        } catch (error) {
            console.error('[OWNER COMMAND ERROR]', error);

            await conn.sendMessage(from, {
                text: '❌ Owner menu එක යැවීමේදී දෝෂයක් ඇතිවුණා. Logs පරීක්ෂා කරන්න.'
            });
        }
    }
);
