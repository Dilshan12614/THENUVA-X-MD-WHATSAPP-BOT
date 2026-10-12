const fs = require('fs');
const path = require('path');
const { cmd, commands } = require('../command');
const { sendListMenu } = require('../lib/buttons');

const PLUGIN_DIR = __dirname;

const MENU_IMAGE = 'https://i.ibb.co/LXTMV60v/0bade47afdf9.jpg';
const OWNER_NAME = 'Dilshan Ashinsa';
const OWNER_NUMBER = '94772194789';
const CHANNEL_URL = 'https://whatsapp.com/channel/0029VbDTWC7HFxOwuNxNHV1z';

function getPluginFiles(dir) {
    let files = [];

    try {
        const entries = fs.readdirSync(dir, {
            withFileTypes: true
        });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                files = files.concat(getPluginFiles(fullPath));
            } else if (
                entry.isFile() &&
                entry.name.endsWith('.js')
            ) {
                files.push(fullPath);
            }
        }
    } catch (error) {
        console.error('[PLUGINS] Directory error:', error.message);
    }

    return files;
}

cmd({
    pattern: 'plugins',
    alias: ['pluginlist', 'pluginlistall'],
    react: '🧩',
    desc: 'Show loaded plugins and commands',
    category: 'owner',
    filename: __filename
}, async (conn, mek, m, { from, reply, isOwner }) => {
    try {
        if (!isOwner) {
            return reply('❌ This command is only for the bot owner.');
        }

        const files = getPluginFiles(PLUGIN_DIR);

        const loadedFiles = files.filter(file => {
            try {
                return Boolean(require.cache[require.resolve(file)]);
            } catch {
                return false;
            }
        });

        const commandMap = new Map();

        for (const command of commands) {
            if (!command || typeof command.function !== 'function') {
                continue;
            }

            const filename = command.filename
                ? path.basename(command.filename)
                : 'Unknown';

            if (!commandMap.has(filename)) {
                commandMap.set(filename, []);
            }

            const name = command.pattern || command.name;

            if (name) {
                commandMap.get(filename).push('.' + String(name));
            }
        }

        let output =
            '╭━━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━━●●►\n' +
            '┃\n' +
            '┃ 🧩 *ᴘʟᴜɢɪɴ ᴍᴀɴᴀɢᴇʀ*\n' +
            '┃ ─────────────────\n' +
            `┃ 📁 ᴛᴏᴛᴀʟ ᴘʟᴜɢɪɴ ꜰɪʟᴇꜱ : ${files.length}\n` +
            `┃ ✅ ʟᴏᴀᴅᴇᴅ ᴘʟᴜɢɪɴꜱ : ${loadedFiles.length}\n` +
            `┃ ⚙️ ʀᴇɢɪꜱᴛᴇʀᴇᴅ ᴄᴏᴍᴍᴀɴᴅꜱ : ${commands.length}\n` +
            '┃\n' +
            '╰━━━━━━━━━━━━━━━━━━●●►\n\n';

        if (loadedFiles.length === 0) {
            output += '⚠️ *ɴᴏ ʟᴏᴀᴅᴇᴅ ᴘʟᴜɢɪɴꜱ ꜰᴏᴜɴᴅ.*\n\n';
        } else {
            output +=
                '╭━━〔 *ʟᴏᴀᴅᴇᴅ ᴘʟᴜɢɪɴꜱ* 〕━━●●►\n\n';

            loadedFiles.forEach((file, index) => {
                const name = path.basename(file);
                const pluginCommands = commandMap.get(name) || [];

                output +=
                    `┃ ${index + 1}. *${name}*\n` +
                    `┃ ➜ ᴄᴏᴍᴍᴀɴᴅꜱ : ${
                        pluginCommands.length
                            ? pluginCommands.join(', ')
                            : 'ɴᴏ ʀᴇɢɪꜱᴛᴇʀᴇᴅ ᴄᴏᴍᴍᴀɴᴅꜱ'
                    }\n\n`;
            });

            output += '╰━━━━━━━━━━━━━━━━━━●●►\n\n';
        }

        output +=
            '╭━━〔 *ᴏᴡɴᴇʀ ɪɴꜰᴏ* 〕━━●●►\n' +
            `┃ 👑 ᴏᴡɴᴇʀ : ${OWNER_NAME}\n` +
            '┃ 🤖 ʙᴏᴛ : ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ\n' +
            '╰━━━━━━━━━━━━━━━━━━●●►\n\n' +
            '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━●●►\n' +
            '┃ ⚡ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ\n' +
            '┃ ➜ ᴄʜᴏᴏꜱᴇ ᴀɴ ᴏᴘᴛɪᴏɴ ʙᴇʟᴏᴡ\n' +
            '╰━━━━━━━━━━━━━━━━━━●●►';

        return await sendListMenu(
            conn,
            from,
            {
                text: output,
                image: MENU_IMAGE,
                footer: 'ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ • ᴘʟᴜɢɪɴ ᴍᴀɴᴀɢᴇʀ',
                buttons: [
                    {
                        buttonId: 'thenuva:contact',
                        buttonText: { displayText: 'CONTACT ME' },
                        type: 1
                    },
                    {
                        buttonId: 'thenuva:channel',
                        buttonText: { displayText: 'VIEW CHANNEL' },
                        type: 1
                    }
                ],
                contextInfo: {
                    externalAdReply: {
                        title: 'ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ',
                        body: 'ᴘʟᴜɢɪɴ ᴍᴀɴᴀɢᴇʀ',
                        thumbnailUrl: MENU_IMAGE,
                        sourceUrl: CHANNEL_URL,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }
        );

    } catch (error) {
        console.error('[PLUGINS ERROR]', error);

        return reply(
            '❌ *ᴘʟᴜɢɪɴ ᴍᴀɴᴀɢᴇʀ ᴇʀʀᴏʀ*\n\n' +
            '┃ ➜ ᴇʀʀᴏʀ ʟᴏɢꜱ ᴄʜᴇᴄᴋ ᴋᴀʀᴀɴɴᴀ.'
        );
    }
});
