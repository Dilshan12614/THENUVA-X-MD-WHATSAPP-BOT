const settings = require('../settings');
const { sendListMenu } = require('../lib/buttons');

const OWNER_NUMBER = String(
    settings.ownerNumber || '94772194789'
).replace(/\D/g, '');

async function ownerCommand(sock, from, msg) {
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
            '✨ ᴄᴏɴᴛᴀᴄᴛ ᴛʜᴇ ᴏᴡɴᴇʀ ᴏʀ ᴠɪsɪᴛ ᴏᴜʀ ᴏғғɪᴄɪᴀʟ ᴄʜᴀɴɴᴇʟ.';

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
                        description: 'ᴠɪsɪᴛ ᴏᴜʀ ᴡʜᴀᴛsᴀᴘᴘ ᴄʜᴀɴɴᴇʟ',
                        id: 'thenuva:ownerchannel'
                    }
                ]
            }
        ];

        await sendListMenu(
            sock,
            from,
            {
                title: ownerText,
                buttonText: '👑 ᴏᴡɴᴇʀ ᴍᴇɴᴜ',
                sections,
                footer: 'ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅɪʟsʜᴀɴ ᴀsʜɪɴsᴀ'
            },
            msg
        );

    } catch (error) {
        console.error('[OWNER COMMAND ERROR]', error);

        await sock.sendMessage(
            from,
            {
                text: '❌ ᴏᴡɴᴇʀ ᴍᴇɴᴜ ᴇʀʀᴏʀ'
            },
            { quoted: msg }
        );
    }
}

module.exports = ownerCommand;
