const { cmd } = require('../command');

function getPhoneNumber(jid) {
    if (typeof jid !== 'string') return null;

    // Standard WhatsApp user JID
    const match = jid.match(/^(\d{7,15})@s\.whatsapp\.net$/);

    if (!match) return null;

    return match[1];
}

cmd(
    {
        pattern: 'blocklist',
        alias: ['blockedlist', 'blocked'],
        desc: 'Show blocked WhatsApp contacts',
        category: 'owner',
        filename: __filename
    },
    async (conn, mek, m, { isOwner, reply }) => {
        try {
            if (!isOwner) {
                return await reply(
                    '❌ This command is only available to the bot owner.'
                );
            }

            if (typeof conn.fetchBlocklist !== 'function') {
                return await reply(
                    '❌ This Baileys connection does not support fetchBlocklist().'
                );
            }

            const result = await conn.fetchBlocklist();

            const entries = Array.isArray(result)
                ? result
                : Array.isArray(result?.blocklist)
                    ? result.blocklist
                    : [];

            if (entries.length === 0) {
                return await reply(
                    '╭─〔 *ʙʟᴏᴄᴋʟɪsᴛ* 〕─●●►\n' +
                    '│\n' +
                    '│ ➤ ᴛᴏᴛᴀʟ : 0\n' +
                    '│\n' +
                    '│ No blocked contacts were returned by WhatsApp.\n' +
                    '│\n' +
                    '╰────────────────●●►\n\n' +
                    '> ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa'
                );
            }

            const contacts = entries
                .map(item => {
                    const jid = typeof item === 'string'
                        ? item
                        : item?.jid || item?.id || item?.participant;

                    return {
                        jid,
                        number: getPhoneNumber(jid)
                    };
                })
                .filter(item => item.jid);

            const lines = contacts.map((item, index) => {
                const display = item.number
                    ? `+${item.number}`
                    : '[Phone number unavailable]';

                return `│ ${index + 1}. ${display}`;
            });

            const message =
                '╭─〔 *ʙʟᴏᴄᴋʟɪsᴛ* 〕─●●►\n' +
                '│\n' +
                `│ ➤ ᴛᴏᴛᴀʟ : ${contacts.length}\n` +
                '│\n' +
                lines.join('\n') +
                '\n│\n' +
                '╰────────────────●●►\n\n' +
                '> ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

            return await reply(message);
        } catch (error) {
            console.error('[BLOCKLIST ERROR]', error);

            return await reply(
                '❌ Failed to fetch WhatsApp blocklist.\n' +
                `Error: ${error.message}`
            );
        }
    }
);
