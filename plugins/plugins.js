const fs = require('fs');
const path = require('path');
const { cmd, commands } = require('../command');

const PLUGIN_DIR = path.join(__dirname);

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
}, async (conn, mek, m, {
    from,
    reply,
    isOwner
}) => {
    try {
        if (!isOwner) {
            return reply(
                '❌ This command is only for the bot owner.'
            );
        }

        const files = getPluginFiles(PLUGIN_DIR);

        const loadedFiles = files.filter(file => {
            if (file === __filename) return false;

            try {
                return require.cache[require.resolve(file)];
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
                ? path.resolve(command.filename)
                : '';

            const pluginName = filename
                ? path.basename(filename)
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
            '╭━━〔 *THENUVA X MD* 〕━━╮\n' +
            '┃ 🧩 *PLUGIN MANAGER*\n' +
            '╰━━━━━━━━━━━━━━━━━━╯\n\n' +
            `📁 Total plugin files: ${files.length}\n` +
            `✅ Loaded plugin files: ${loadedFiles.length}\n` +
            `⚙️ Registered commands: ${commands.length}\n\n`;

        if (loadedFiles.length === 0) {
            output += '⚠️ No loaded plugins found.';
        } else {
            output += '*📦 LOADED PLUGINS*\n\n';

            loadedFiles.forEach((file, index) => {
                const name = path.basename(file);
                const pluginCommands = commandMap.get(name) || [];

                output +=
                    `${index + 1}. *${name}*\n` +
                    `   Commands: ${
                        pluginCommands.length
                            ? pluginCommands.join(', ')
                            : 'No registered commands'
                    }\n\n`;
            });
        }

        output +=
            '━━━━━━━━━━━━━━━━━━\n' +
            '👑 *OWNER:* Dilshan Ashinsa\n' +
            '🤖 *BOT:* THENUVA X MD';

        return reply(output);

    } catch (error) {
        console.error('[PLUGINS ERROR]', error);

        return reply(
            '❌ Failed to read plugin list.\n' +
            'Check the GitHub Actions logs.'
        );
    }
});
