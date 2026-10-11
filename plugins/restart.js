const { cmd } = require('../command');
const { sleep } = require('../lib/functions');
const { exec } = require('child_process');

cmd(
    {
        pattern: 'restart',
        alias: ['reboot'],
        desc: 'Restart the bot',
        category: 'owner',
        filename: __filename
    },
    async (conn, mek, m, { from, isOwner, isMe, reply }) => {
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
                '╭─〔 *ʀᴇsᴛᴀʀᴛ ᴘᴀɴᴇʟ* 〕─●●►\n' +
                '│\n' +
                '│ ➤ ʙᴏᴛ ʀᴇsᴛᴀʀᴛɪɴɢ...\n' +
                '│ ➤ ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ\n' +
                '│\n' +
                '╰────────────────●●►\n\n' +
                
                '> ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa'
            );

            await sleep(1500);

            exec('pm2 restart all', (error, stdout, stderr) => {
                if (error) {
                    console.error('[RESTART ERROR]', error.message);
                    return;
                }

                console.log('[RESTART]', stdout || stderr || 'Restart command executed.');
            });

        } catch (error) {
            console.error('[RESTART ERROR]', error);
            await reply('❌ Restart failed: ' + error.message);
        }
    }
);
