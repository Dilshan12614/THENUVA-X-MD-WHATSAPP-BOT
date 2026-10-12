const { cmd } = require('../command');

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
            // Owner-only permission
            if (!isOwner) {
                return await reply(
                    '╭─〔 *ᴀᴄᴄᴇss ᴅᴇɴɪᴇᴅ* 〕─●●►\n' +
                    '│\n' +
                    '│ ➤ ᴏᴡɴᴇʀ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ\n' +
                    '│\n' +
                    '╰────────────────●●►'
                );
            }

            // Get WhatsApp blocked contacts from Baileys connection
            let blockedUsers = [];

            if (
                Array.isArray(conn?.user?.blocked)
            ) {
                blockedUsers = conn.user.blocked;
            } else if (
                Array.isArray(conn?.blocked)
            ) {
                blockedUsers = conn.blocked;
            } else if (
                typeof conn?.fetchBlocklist === 'function'
            ) {
                blockedUsers = await conn.fetchBlocklist();
            }

            // Normalize JIDs
            blockedUsers = blockedUsers
                .map(user => {
                    if (typeof user === 'string') return user;
                    return user?.jid || user?.id || user?.participant || null;
                })
                .filter(jid =>
                    typeof jid === 'string' &&
                    jid.includes('@')
                );

            // Remove duplicates
            blockedUsers = [...new Set(blockedUsers)];

            if (blockedUsers.length === 0) {
                return await reply(
                    '╭─〔 *ʙʟᴏᴄᴋʟɪsᴛ* 〕─●●►\n' +
                    '│\n' +
                    '│ ➤ දැනට block කරපු contacts හමු වුණේ නැහැ.\n' +
                    '│\n' +
                    '╰────────────────●●►\n\n' +
                    '> ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ'
                );
            }

            const MAX_DISPLAY = 100;
            const displayedUsers = blockedUsers.slice(0, MAX_DISPLAY);

            const lines = displayedUsers.map((jid, index) => {
                const number = jid.split('@')[0];

                return `│ ${index + 1}. ${number}`;
            });

            const remaining = blockedUsers.length - displayedUsers.length;

            let message =
                '╭─〔 *ʙʟᴏᴄᴋʟɪsᴛ* 〕─●●►\n' +
                '│\n' +
                `│ ➤ ᴛᴏᴛᴀʟ : ${blockedUsers.length}\n` +
                '│\n' +
                lines.join('\n') +
                '\n│\n';

            if (remaining > 0) {
                message += `│ ➤ තවත් ${remaining} contacts තියෙනවා.\n│\n`;
            }

            message +=
                '╰────────────────●●►\n\n' +
                '> ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

            return await reply(message);

        } catch (error) {
            console.error('[BLOCKLIST ERROR]', error);

            return await reply(
                '❌ Blocklist එක ලබාගැනීමට නොහැකි වුණා.\n' +
                `Error: ${error.message}`
            );
        }
    }
);
