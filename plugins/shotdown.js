const { cmd } = require('../command');
const { sleep } = require('../lib/functions');

cmd(
    {
        pattern: 'shutdown',
        alias: ['stopbot'],
        desc: 'Stop the bot',
        category: 'owner',
        filename: __filename
    },
    async (conn, mek, m, { isOwner, isMe, reply }) => {
        try {
            // Owner permission check
            if (!isOwner && !isMe) {
                return await reply(
                    '╭─〔 *ᴀᴄᴄᴇss ᴅᴇɴɪᴇᴅ* 〕─●●►\n' +
                    '│\n' +
                    '│ ➤ ᴏᴡɴᴇʀ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ\n' +
                    '│\n' +
                    '╰────────────────●●►'
                );
            }

            await reply(
                '╭─〔 *sʜᴜᴛᴅᴏᴡɴ ᴘᴀɴᴇʟ* 〕─●●►\n' +
                '│\n' +
                '│ ➤ ʙᴏᴛ sʜᴜᴛᴛɪɴɢ ᴅᴏᴡɴ...\n' +
                '│ ➤ ᴛʜᴇ sᴇʀᴠɪᴄᴇ ᴡɪʟʟ sᴛᴏᴘ\n' +
                '│\n' +
                '╰────────────────●●►\n\n' +
                
                '> ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa'
            );

            await sleep(1500);

            // Stop the current Node.js process
            process.exit(0);

        } catch (error) {
            console.error('[SHUTDOWN ERROR]', error);

            try {
                await reply('❌ Shutdown failed: ' + error.message);
            } catch (_) {}
        }
    }
);
