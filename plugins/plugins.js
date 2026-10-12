const fs = require('fs');
const path = require('path');
const { cmd, commands } = require('../command');
const { sendListMenu } = require('../lib/buttons');

const PLUGIN_DIR = __dirname;

const MENU_IMAGE =
    'https://i.ibb.co/LXTMV60v/0bade47afdf9.jpg';

const OWNER_NAME = 'Dilshan Ashinsa';

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
        console.error(
            '[PLUGINS] Directory error:',
            error.message
        );
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
            return reply(
                '❌ *ᴏᴡɴᴇʀ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ*'
            );
        }

        const files = getPluginFiles(PLUGIN_DIR);

        const loadedFiles = files.filter(file => {
            try {
                return Boolean(
                    require.cache[require.resolve(file)]
                );
            } catch {
                return false;
            }
        });

        const commandMap = new Map();

        for (const command of commands) {
            if (
                !command ||
                typeof command.function !== 'function'
            ) {
                continue;
            }

            const pluginName = command.filename
                ? path.basename(command.filename)
                : 'Unknown';

            if (!commandMap.has(pluginName)) {
                commandMap.set(pluginName, []);
            }

            const name = command.pattern || command.name;

            if (name) {
                commandMap.get(pluginName).push(
                    '.' + String(name)
                );
            }
        }

        let output =
            '╭─〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕─●●►\n' +
            '┃\n' +
            '┃ 🧩 *ᴘʟᴜɢɪɴ ᴍᴀɴᴀɢᴇʀ*\n' +
            '┃ ────────\n' +
            `┃ 📁 ᴛᴏᴛᴀʟ ᴘʟᴜɢɪɴ ꜰɪʟᴇꜱ : ${files.length}\n` +
            `┃ ✅ ʟᴏᴀᴅᴇᴅ ᴘʟᴜɢɪɴꜱ : ${loadedFiles.length}\n` +
            `┃ ⚙️ ʀᴇɢɪꜱᴛᴇʀᴇᴅ ᴄᴏᴍᴍᴀɴᴅꜱ : ${commands.length}\n` +
            '┃\n' +
            '╰━━━━━━━━━━━━●●►\n\n';

        if (loadedFiles.length === 0) {
            output +=
                '⚠️ *ɴᴏ ʟᴏᴀᴅᴇᴅ ᴘʟᴜɢɪɴꜱ ꜰᴏᴜɴᴅ.*\n\n';
        } else {
            output +=
                '╭─〔 *ʟᴏᴀᴅᴇᴅ ᴘʟᴜɢɪɴꜱ* 〕─●●►\n\n';

            loadedFiles.forEach((file, index) => {
                const name = path.basename(file);
                const pluginCommands =
                    commandMap.get(name) || [];

                output +=
                    `┃ ${index + 1}. *${name}*\n` +
                    `┃ ➜ ᴄᴏᴍᴍᴀɴᴅꜱ : ${
                        pluginCommands.length
                            ? pluginCommands.join(', ')
                            : 'ɴᴏ ʀᴇɢɪꜱᴛᴇʀᴇᴅ ᴄᴏᴍᴍᴀɴᴅꜱ'
                    }\n\n`;
            });

            output +=
                '╰━━━━━━━━━━━━●●►\n\n';
        }

        output +=
            '🔘 *choose an options below.';

        const sections = [
            {
                title: '🧩 PLUGIN MANAGER',
                rows: [
                    {
                        title: '📋 Main Menu',
                        id: 'thenuva:menu',
                        description: 'Open the main menu'
                    },
                    {
                        title: '🟢 Bot Status',
                        id: 'thenuva:alive',
                        description: 'Check bot status'
                    },
                    {
                        title: '🏓 Ping',
                        id: 'thenuva:ping',
                        description: 'Check response speed'
                    },
                    {
                        title: '👑 Owner Menu',
                        id: 'thenuva:owner',
                        description: 'Open owner commands'
                    },
                    {
                        title: '📥 Download Menu',
                        id: 'thenuva:downloads',
                        description: 'Open download commands'
                    },
                    {
                        title: '🛠️ Tools Menu',
                        id: 'thenuva:tools',
                        description: 'Open tools commands'
                    },
                    {
                        title: '📚 All Commands',
                        id: 'thenuva:all',
                        description: 'View all bot commands'
                    }
                ]
            }
        ];

        return await sendListMenu(
            conn,
            from,
            {
                title: output,
                buttonText: '',
                hideListButton: true,
                sections: sections,
                footer:
        'ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ\n' +
        '╰━━━●●►• ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa ',
                image: MENU_IMAGE
            },
            mek
        );

    } catch (error) {
        console.error('[PLUGINS ERROR]', error);

        return reply(
            '❌ *ᴘʟᴜɢɪɴ ᴍᴀɴᴀɢᴇʀ ᴇʀʀᴏʀ*\n\n' +
            '┃ ➜ GitHub Actions logs පරීක්ෂා කරන්න.\n' +
            '╰━━━━━━━━━━━━●●►'
        );
    }
});
