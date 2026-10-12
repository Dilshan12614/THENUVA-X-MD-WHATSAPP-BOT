const { cmd } = require('../command');

const sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

cmd({
    pattern: 'sendmsg',
    alias: ['privatemsg', 'pmnumber'],
    desc: 'Send one message to multiple numbers',
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
                '❌ මේ command එක භාවිතා කළ හැක්කේ owner ට පමණයි.'
            );
        }

        const input = String(body || '')
            .trim()
            .replace(/^\.?sendmsg(?:\s+|$)/i, '')
            .trim();

        const split = input.split('|');

        if (split.length < 2) {
            return reply(
                '📌 *භාවිතය:*\n\n' +
                '.sendmsg 94771234567,94770000000 | Hello everyone!\n\n' +
                'Numbers comma (,) මඟින් වෙන් කරන්න.\n' +
                'Numbers සහ message එක අතර | ලකුණ යොදන්න.'
            );
        }

        const numberText = split.shift().trim();
        const message = split.join('|').trim();

        if (!message) {
            return reply('❌ යවන්න message එකක් ඇතුළත් කරන්න.');
        }

        const numbers = [...new Set(
            numberText
                .split(',')
                .map(n => n.trim().replace(/^\+/, ''))
        )];

        if (
            !numbers.length ||
            numbers.some(n => !/^\d{8,15}$/.test(n))
        ) {
            return reply(
                '❌ Number format එක වැරදියි.\n' +
                'රටේ code එක සමඟ numbers ඇතුළත් කරන්න.'
            );
        }

        if (numbers.length > 20) {
            return reply(
                '❌ එක command එකකට උපරිම numbers 20ක් පමණක් ඇතුළත් කරන්න.'
            );
        }

        await reply(
            '╭─〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕─●●►\n' +
            '│ 📤 Private messages requesting...\n' +
            `│ 👥 Recipients: ${numbers.length}\n` +
            '╰────────────────●●►\n\n' +
            '> ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa'
        );

        let sent = 0;
        let failed = 0;

        for (const number of numbers) {
            const jid = `${number}@s.whatsapp.net`;

            try {
                await conn.sendMessage(jid, {
                    text: message
                });

                sent++;
                console.log('[SENDPM SENT]', number);
            } catch (err) {
                failed++;
                console.error(
                    '[SENDPM ERROR]',
                    number,
                    err?.message || err
                );
            }

            await sleep(1500);
        }

        return reply(
            '╭─〔 *sᴇɴᴅᴘᴍ ʀᴇsᴜʟᴛ* 〕─●●►\n' +
            `│ 👥 Recipients: ${numbers.length}\n` +
            `│ ✅ Sent: ${sent}\n` +
            `│ ❌ Failed: ${failed}\n` +
            '╰────────────────●●►\n\n' +
            '> ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa'
        );

    } catch (err) {
        console.error('[SENDPM FATAL ERROR]', err);

        return reply(
            '❌ Command එක ක්‍රියාත්මක කිරීමේදී දෝෂයක් ඇති වුණා.'
        );
    }
});
