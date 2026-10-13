const { cmd } = require('../command');

cmd({
    pattern: 'getdp',
    alias: ['dp', 'profilepic', 'getprofile'],
    react: '🖼️',
    desc: 'Get a WhatsApp profile picture',
    category: 'tools',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        let targetJid;

        // Get mentioned user
        const mentioned =
            m?.mentionedJid ||
            mek?.message?.extendedTextMessage?.contextInfo?.mentionedJid ||
            [];

        if (mentioned.length > 0) {
            targetJid = mentioned[0];
        } else if (q && q.trim()) {
            const number = q.replace(/\D/g, '');

            if (number.length < 7 || number.length > 15) {
                return reply(
                    '❌ *Invalid number!*\n\n' +
                    'උදාහරණය: `.getdp 947XXXXXXXX`'
                );
            }

            targetJid = `${number}@s.whatsapp.net`;
        } else {
            // Default to the sender
            targetJid =
                m?.sender ||
                mek?.key?.participant ||
                from;
        }

        if (!targetJid) {
            return reply('❌ User කෙනාව හඳුනාගන්න බැරි වුණා.');
        }

        await reply('🖼️ *Profile picture එක ලබාගනිමින්...*');

        let imageUrl;

        try {
            imageUrl = await conn.profilePictureUrl(
                targetJid,
                'image'
            );
        } catch (err) {
            console.error('[GETDP PROFILE ERROR]', err.message);

            return reply(
                '❌ *Profile picture එක ලබාගන්න බැරි වුණා.*\n\n' +
                'හේතු විය හැක්කේ:\n' +
                '• Profile picture එක නොමැති වීම\n' +
                '• Privacy settings නිසා නොපෙනීම\n' +
                '• User JID එක වැරදි වීම'
            );
        }

        if (!imageUrl) {
            return reply('❌ Profile picture URL එකක් ලැබුණේ නැහැ.');
        }

        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            },
            signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
            throw new Error(`Image download failed: HTTP ${response.status}`);
        }

        const contentType = (
            response.headers.get('content-type') || ''
        ).toLowerCase();

        if (!contentType.startsWith('image/')) {
            throw new Error('Server එක image එකක් එවා නැහැ.');
        }

        const imageBuffer = Buffer.from(
            await response.arrayBuffer()
        );

        if (!imageBuffer.length) {
            throw new Error('Image file එක හිස්.');
        }

        if (imageBuffer.length > 10 * 1024 * 1024) {
            return reply('❌ Image එක 10 MB සීමාව ඉක්මවා තිබෙනවා.');
        }

        await conn.sendMessage(from, {
            image: imageBuffer,
            caption:
                '╭─〔 *🖼️ PROFILE PICTURE* 〕\n' +
                '│\n' +
                `│ 👤 *User:* ${targetJid.split('@')[0]}\n` +
                '│\n' +
                '╰────────────────\n\n' +
                
                '> *ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa*'
        }, { quoted: mek });

    } catch (error) {
        console.error('[GETDP ERROR]', error);

        await reply(
            '❌ *GETDP ERROR*\n\n' +
            `${error.message || 'Unknown error'}`
        );
    }
});
