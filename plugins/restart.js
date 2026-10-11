const config = require('../config');
const { cmd } = require('../command');
const { sleep } = require('../lib/functions');
const { exec } = require('child_process');

cmd({
    pattern: 'restart',
    desc: 'Restart the bot',
    category: 'owner',
    filename: __filename
},
async (conn, mek, m, {
    from,
    isOwner,
    isMe,
    reply
}) => {
    try {
        if (!isOwner && !isMe) {
            return reply('╭─〔 *ᴀᴄᴄᴇss ᴅᴇɴɪᴇᴅ* 〕─●●►\n' +
                '│\n' +
                '│ ➤ ᴏᴡɴᴇʀ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ\n' +
                '│\n' +
                '╰────────────────●●►');
        }

        await reply(
            '╭─〔 *ʀᴇsᴛᴀʀᴛ ᴘᴀɴᴇʟ* 〕─●●►\n' +
            '│\n' +
            '│ ➤ ʙᴏᴛ ʀᴇsᴛᴀʀᴛɪɴɢ...\n' +
            '│ ➤ ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ\n' +
            '│\n' +
            '╰────────────────●●►\n\n' +
            'ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa'
        );

        await sleep(1500);

        exec('pm2 restart all', (error) => {
            if (error) {
                console.error('[RESTART ERROR]', error);
            }
        });

    } catch (e) {
        console.error('[RESTART ERROR]', e);
        reply(`Restart Error: ${e.message || e}`);
    }
});
```
