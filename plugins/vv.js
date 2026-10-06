const { cmd } = require('../command');

cmd({
    pattern: 'vv',
    alias: ['viewimage', 'reimage'],
    react: '🖼️',
    desc: 'Resend a replied image',
    category: 'main',
    filename: __filename
},
async (conn, mek, m, { from, quoted, reply }) => {

    try {

        if (!quoted) {
            return reply(
                '❌ *IMAGE REPLY REQUIRED*\n\n' +
                'සාමාන්‍ය photo එකකට reply කරලා:\n' +
                '`.vv`\n\n' +
                'භාවිතා කරන්න.'
            );
        }

        const message =
            quoted.message ||
            quoted.msg ||
            quoted;

        const imageMessage =
            message?.imageMessage;

        if (!imageMessage) {
            return reply(
                '❌ *IMAGE NOT FOUND*\n\n' +
                'සාමාන්‍ය image එකකට reply කරලා `.vv` යවන්න.'
            );
        }

        await reply('⏳ *Processing image...*');

        const buffer =
            await conn.downloadMediaMessage(
                quoted
            );

        if (!buffer || !buffer.length) {
            return reply(
                '❌ *IMAGE DOWNLOAD FAILED*'
            );
        }

        await conn.sendMessage(
            from,
            {
                image: buffer,
                mimetype: imageMessage.mimetype || 'image/jpeg',
                caption:
                    '🖼️ *CYBER XMD*\n\n' +
                    '✅ Image sent successfully.'
            },
            {
                quoted: mek
            }
        );

    } catch (error) {

        console.error('[VV ERROR]', error);

        return reply(
            '❌ *VV ERROR*\n\n' +
            `${error?.message || error}`
        );
    }
});
