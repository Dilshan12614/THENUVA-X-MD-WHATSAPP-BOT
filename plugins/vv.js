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
                '❌ *IMAGE NOT FOUND*\n\n' +
                'සාමාන්‍ය photo එකකට reply කරලා `.vv` යවන්න.'
            );
        }

        /*
         * quoted message එකෙන් actual message එක ගන්න
         */
        let msg = quoted;

        if (quoted.message) {
            msg = quoted.message;
        }

        /*
         * wrapped messages unwrap කරන්න
         */
        if (msg.ephemeralMessage?.message) {
            msg = msg.ephemeralMessage.message;
        }

        if (msg.viewOnceMessage?.message) {
            msg = msg.viewOnceMessage.message;
        }

        if (msg.viewOnceMessageV2?.message) {
            msg = msg.viewOnceMessageV2.message;
        }

        const imageMessage = msg.imageMessage;

        if (!imageMessage) {
            return reply(
                '❌ *IMAGE NOT FOUND*\n\n' +
                'Image එකකට reply කරලා `.vv` යවන්න.'
            );
        }

        await reply('⏳ *Processing image...*');

        /*
         * Baileys message key හදාගන්න
         */
        const key = {
            remoteJid:
                quoted.key?.remoteJid ||
                quoted.remoteJid ||
                from,

            id:
                quoted.key?.id ||
                quoted.id,

            participant:
                quoted.key?.participant ||
                quoted.participant,

            fromMe:
                quoted.key?.fromMe || false
        };

        /*
         * download message
         */
        const { downloadContentFromMessage } =
            await import('@whiskeysockets/baileys');

        let stream;

        try {

            stream = await downloadContentFromMessage(
                imageMessage,
                'image'
            );

        } catch (downloadError) {

            console.error(
                '[VV DOWNLOAD ERROR]',
                downloadError
            );

            return reply(
                '❌ *IMAGE DOWNLOAD FAILED*\n\n' +
                `${downloadError?.message || downloadError}`
            );
        }

        /*
         * Stream → Buffer
         */
        const chunks = [];

        for await (const chunk of stream) {
            chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks);

        if (!buffer.length) {
            return reply(
                '❌ *EMPTY IMAGE*\n\n' +
                'Image data එක ලබාගන්න බැරි වුණා.'
            );
        }

        console.log(
            `[VV] Image downloaded: ` +
            `${(buffer.length / 1024).toFixed(2)} KB`
        );

        /*
         * Send image again
         */
        await conn.sendMessage(
            from,
            {
                image: buffer,

                mimetype:
                    imageMessage.mimetype ||
                    'image/jpeg',

                caption:
                    '╭───────────────●●►\n' +
                    '│ 🖼️ *CYBER XMD*\n' +
                    '├───────────────●●►\n' +
                    '│ ✅ Image received\n' +
                    '│ 👤 Dilshan Ashinsa\n' +
                    '╰───────────────●●►'
            },
            {
                quoted: mek
            }
        );

    } catch (error) {

        console.error(
            '[VV ERROR]',
            error
        );

        return reply(
            '❌ *VV ERROR*\n\n' +
            `${error?.message || error}`
        );
    }
});
