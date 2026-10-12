const { cmd } = require('../command');

cmd({
    pattern: 'sendpm',
    alias: ['privatemsg', 'pmnumber'],
    desc: 'Send a private message to a phone number',
    category: 'owner',
    filename: __filename
}, async (conn, mek, m, {
    isOwner,
    body,
    reply
}) => {
    try {
        if (!isOwner) {
            return reply(
                '❌ මේ command එක භාවිතා කළ හැක්කේ bot owner ට පමණයි.'
            );
        }

        const input = String(body || '')
            .trim()
            .replace(/^\.?sendpm(?:\s+|$)/i, '')
            .trim();

        const match = input.match(/^(\+?\d{8,15})\s+([\s\S]+)$/);

        if (!match) {
            return reply(
                '📌 *භාවිතය:*\n' +
                '.sendpm 94771234567 ඔබගේ message එක\n\n' +
                'Number එක රටේ code එකත් සමඟ දෙන්න.\n' +
                'Message එකත් අනිවාර්යයි.'
            );
        }

        const number = match[1].replace(/\D/g, '');
        const message = match[2].trim();

        if (!message) {
            return reply('❌ යවන්න message එකක් ඇතුළත් කරන්න.');
        }

        // WhatsApp private recipient JID
        const jid = `${number}@s.whatsapp.net`;

        await reply(
            '╭─〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕─●●►\n' +
            '│\n' +
            '│ 📤 Private message යවමින්...\n' +
            `│ 📱 Number: ${number}\n` +
            '│\n' +
            '╰────────────────●●►'
        );

        // Send only to the explicitly entered number
        await conn.sendMessage(jid, {
            text: message
        });

        console.log('[SENDPM] Message sent to:', jid);

        return reply(
            '╭─〔 *sᴇɴᴅᴘᴍ ʀᴇsᴜʟᴛ* 〕─●●►\n' +
            '│\n' +
            '│ ✅ Message යැවීමේ request එක සාර්ථකයි.\n' +
            `│ 📱 Number: ${number}\n` +
            '│\n' +
            '╰────────────────●●►'
        );

    } catch (err) {
        console.error('[SENDPM ERROR]', err);

        return reply(
            '❌ Message යැවීමට නොහැකි වුණා.\n' +
            'Number එක නිවැරදිද, WhatsApp account එකක්ද කියලා පරීක්ෂා කරන්න.'
        );
    }
});
