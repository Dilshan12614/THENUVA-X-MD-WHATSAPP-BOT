const { cmd } = require('../command');

cmd({
    pattern: 'getdp',
    alias: ['dp', 'profilepic', 'getprofile'],
    react: '🖼️',
    desc: 'Get the profile picture of the command sender',
    category: 'tools',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        // Identify the person who sent the command.
        const sender =
            m?.sender ||
            mek?.key?.participant ||
            (mek?.key?.fromMe ? null : mek?.key?.remoteJid);

        if (!sender || sender === 'status@broadcast') {
            return reply('❌ මේ chat එකේ sender හඳුනාගන්න බැරි වුණා.');
        }

        await reply('🖼️ *ඔයාගේ profile picture එක ලබාගනිමින්...*');

        let dpUrl;

        try {
            dpUrl = await conn.profilePictureUrl(sender, 'image');
        } catch (error) {
            console.error('[GETDP PROFILE ERROR]', error.message);

            return reply(
                '❌ *මේ userගේ DP එක ලබාගන්න බැරි වුණා.*\n\n' +
                'Profile picture එක නැති හෝ privacy settings නිසා සීමා කර තිබිය හැකියි.'
            );
        }

        if (!dpUrl) {
            return reply('❌ Profile picture එකක් හමු වුණේ නැහැ.');
        }

        const response = await fetch(dpUrl, {
            signal: AbortSignal.timeout(30000),
            headers: { 'User-Agent': 'Mozilla/5.0' }
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

        const image = Buffer.from(await response.arrayBuffer());

        if (!image.length) {
            throw new Error('Image file එක හිස්.');
        }

        await conn.sendMessage(from, {
            image,
            caption:
                '╭─〔 *🖼️ PROFILE PICTURE* 〕\n' +
                '│\n' +
                `│ 👤 *User:* ${sender.split('@')[0]}\n` +
                '│\n' +
                '╰────────────────\n\n' +
                
                '> *ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa*'
        }, { quoted: mek });

    } catch (error) {
        console.error('[GETDP ERROR]', error);

        return reply(
            '❌ *GETDP ERROR*\n\n' +
            `${error.message || 'Unknown error'}`
        );
    }
});
