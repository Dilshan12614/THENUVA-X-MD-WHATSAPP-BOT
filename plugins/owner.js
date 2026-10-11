const config = require('../config');
const { cmd } = require('../command');
const { sendListMenu } = require('../lib/buttons');

const OWNER_NAME = 'ᴅɪʟsʜᴀɴ ᴀsʜɪɴsᴀ';
const OWNER_NUMBER = '94742876482';

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
                '╰━━〔 ⚡ ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ 〕━━●●►';

            const sections = [
                {
                    title: '👑 ᴏᴡɴᴇʀ ᴏᴘᴛɪᴏɴs',
                    rows: [
                        {
                            title: '📱 ᴄᴏɴᴛᴀᴄᴛ ᴏᴡɴᴇʀ',
                            description: 'View owner contact details',
                            id: 'thenuva:ownercontact'
                        },
                        {
                            title: '📢 ᴏғғɪᴄɪᴀʟ ᴄʜᴀɴɴᴇʟ',
                            description: 'Visit our official channel',
                            id: 'thenuva:ownerchannel'
                        }
                    ]
                }
            ];

            await sendListMenu(conn, from, {
                title: ownerText,
                buttonText: '👑 ᴏᴡɴᴇʀ ᴍᴇɴᴜ',
                sections,
                footer: '⚡ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅɪʟsʜᴀɴ ᴀsʜɪɴsᴀ',
                image: OWNER_IMAGE_URL
            });

        } catch (error) {
            console.error('[OWNER COMMAND ERROR]', error);

            await conn.sendMessage(from, {
                text: '❌ Owner menu එක යැවීමට නොහැකි වුණා. Logs පරීක්ෂා කරන්න.'
            });
        }
    }
);
