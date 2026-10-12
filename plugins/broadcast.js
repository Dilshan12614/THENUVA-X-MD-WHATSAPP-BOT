const { cmd } = require('../command');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function sendBroadcast(conn, message, type, reply) {
    const chats = conn.store?.chats;

    if (!chats || typeof chats.all !== 'function') {
        return reply(
            '❌ Chat store එක සකස් කරලා නැහැ.\n' +
            'Bot එකේ chat store implementation එකට ගැළපෙන විදිහට වෙනස් කරන්න ඕන.'
        );
    }

    const allChats = chats.all();

    const targets = allChats
        .map(chat => chat.id)
        .filter(jid => {
            if (typeof jid !== 'string') return false;
            if (jid.endsWith('@broadcast')) return false;
            if (jid.endsWith('@newsletter')) return false;
            if (jid === conn.user?.id) return false;

            if (type === 'private') {
                return jid.endsWith('@s.whatsapp.net');
            }

            if (type === 'group') {
                return jid.endsWith('@g.us');
            }

            return false;
        });

    if (targets.length === 0) {
        return reply('❌ Broadcast කරන්න chats හමු වුණේ නැහැ.');
    }

    let sent = 0;
    let failed = 0;

    await reply(
        `📢 *THENUVA X MD BROADCAST*\n\n` +
        `Targets: ${targets.length}\n` +
        `Broadcast එක ආරම්භ කරනවා...`
    );

    for (const jid of targets) {
        try {
            await conn.sendMessage(jid, { text: message });
            sent++;
        } catch (error) {
            failed++;
            console.error('[BROADCAST ERROR]', jid, error.message);
        }

        // Avoid sending messages too quickly
        await sleep(1200);
    }

    return reply(
        '╭─〔 *ʙʀᴏᴀᴅᴄᴀsᴛ ʀᴇsᴜʟᴛ* 〕─●●►\n' +
        '│\n' +
        `│ ➤ ᴛᴀʀɢᴇᴛs : ${targets.length}\n` +
        `│ ➤ sᴇɴᴛ : ${sent}\n` +
        `│ ➤ ғᴀɪʟᴇᴅ : ${failed}\n` +
        '│\n' +
        '╰────────────────●●►\n\n' +
        
        '> ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa'
    );
}

cmd(
    {
        pattern: 'broadcast',
        alias: ['bc'],
        desc: 'Broadcast a message to private chats',
        category: 'owner',
        filename: __filename
    },
    async (conn, mek, m, { isOwner, body, reply }) => {
        if (!isOwner) {
            return reply('❌ This command is only available to the bot owner.');
        }

        const message = String(body || '').trim().replace(/^\.?broadcast\s*/i, '');

        if (!message) {
            return reply('Usage: .broadcast Your message here');
        }

        return sendBroadcast(conn, message, 'private', reply);
    }
);

cmd(
    {
        pattern: 'bcgroup',
        alias: ['groupbc'],
        desc: 'Broadcast a message to groups',
        category: 'owner',
        filename: __filename
    },
    async (conn, mek, m, { isOwner, body, reply }) => {
        if (!isOwner) {
            return reply('❌ This command is only available to the bot owner.');
        }

        const message = String(body || '').trim().replace(/^\.?bcgroup\s*/i, '');

        if (!message) {
            return reply('Usage: .bcgroup Your message here');
        }

        return sendBroadcast(conn, message, 'group', reply);
    }
);
