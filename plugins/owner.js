
const { cmd } = require('../command');
const { sendListMenu } = require('../lib/buttons');

const OWNER_NAME = 'ᴅɪʟsʜᴀɴ ᴀsʜɪɴsᴀ';
const OWNER_NUMBER = '94772194789';

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
            // Get the user's WhatsApp display name
            const displayName = String(
                pushName ||
                mek?.pushName ||
                m?.pushName ||
                'whatsapp user'
            ).trim();

            const ownerText = [
                '╭━━〔 ᴏᴡɴᴇʀ ɪɴғᴏ 〕━━●●►',
                '┃',
                `┃ 👤 ᴏᴡɴᴇʀ  : ${OWNER_NAME}`,
                `┃ 📱 ɴᴜᴍʙᴇʀ : +${OWNER_NUMBER}`,
                '┃ 🤖 ʙᴏᴛ    : ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ',
                '┃ ⚡ sᴛᴀᴛᴜs  : ᴏғғɪᴄɪᴀʟ',
                '┃',
                '╰━━━━━━━━━━━━━━●●►',
                '',
                `👋 ʜᴇʟʟᴏ, ${displayName}! ❤️`,
                '',
                '✨ ᴄᴏɴᴛᴀᴄᴛ ᴛʜᴇ ᴏᴡɴᴇʀ ᴏʀ',
                '📢 ᴠɪsɪᴛ ᴏᴜʀ ᴏғғɪᴄɪᴀʟ ᴄʜᴀɴɴᴇʟ.',
                ''
            ].join('\n');

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
                footer: 'ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa',
                image: OWNER_IMAGE_URL,
                hideListButton: true
            });

        } catch (error) {
            console.error('[OWNER COMMAND ERROR]', error);

            await conn.sendMessage(from, {
                text: '❌ Owner menu එක යැවීමේදී දෝෂයක් ඇතිවුණා.'
            });
        }
    }
);
