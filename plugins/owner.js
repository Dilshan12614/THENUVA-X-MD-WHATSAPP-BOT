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
                '╭━━〔 ᴏᴡɴᴇʀ ɪɴғᴏ 〕━━●●►\n' +
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

            // List button එක නැතිව, අදාළ URL buttons දෙක පමණයි
            const sections = [
                {
                    title: 'ᴏᴡɴᴇʀ ɪɴғᴏ',
                    rows: [
                        {
                            title: '📱 ᴄᴏɴᴛᴀᴄᴛ ᴏᴡɴᴇʀ',
                            description: 'Owner contact details',
                            id: 'thenuva:ownercontact'
                        }
                    ]
                }
            ];

            await sendListMenu(conn, from, {
                title: ownerText,
                buttonText: 'OWNER MENU',
                sections,
                footer:
                    'ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa',
                image: OWNER_IMAGE_URL,
                hideListButton: true
            });

        } catch (error) {
            console.error('[OWNER COMMAND ERROR]', error);

            await conn.sendMessage(from, {
                text:
                    '❌ Owner menu එක යැවීමේදී දෝෂයක් ඇතිවුණා.'
            });
        }
    }
);
