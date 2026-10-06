const config = require('../config');
const { cmd, commands } = require('../command');
const os = require('os');
const { runtime } = require('../lib/functions');
const { sendListMenu } = require('../lib/buttons');

/*
|--------------------------------------------------------------------------
| MENU SETTINGS
|--------------------------------------------------------------------------
*/

const BOT_NAME = 'THENUWA X MD';
const CREATOR = 'Dilshan Ashinsa';
const VERSION = 'v2.0.0';

const MENU_IMAGE =
    'https://i.ibb.co/N68698yW/5df1e9c651fd.jpg';

const NEWSLETTER_JID =
    '120363403804248705@newsletter';

const NEWSLETTER_NAME =
    'THENUWA XMD';


/*
|--------------------------------------------------------------------------
| CATEGORY HELPERS
|--------------------------------------------------------------------------
*/

function normalizeCategory(category) {
    if (!category) return 'main';

    const value = String(category).toLowerCase().trim();

    const aliases = {
        main: 'main',
        download: 'download',
        downloader: 'download',
        group: 'group',
        owner: 'owner',
        convert: 'convert',
        search: 'search',
        game: 'games',
        games: 'games',
        utility: 'utility',
        tools: 'utility',
        ai: 'ai'
    };

    return aliases[value] || value;
}


/*
|--------------------------------------------------------------------------
| BUILD COMMAND LIST
|--------------------------------------------------------------------------
*/

function buildCommandLists() {

    const menu = {
        main: [],
        download: [],
        group: [],
        owner: [],
        convert: [],
        search: [],
        games: [],
        utility: [],
        ai: []
    };

    /*
    |--------------------------------------------------------------------------
    | DYNAMIC CATEGORIES
    |--------------------------------------------------------------------------
    */

    const extraCategories = {};


    for (const command of commands) {

        if (
            !command ||
            !command.pattern ||
            command.dontAddCommandList
        ) {
            continue;
        }

        /*
        |--------------------------------------------------------------------------
        | PATTERN
        |--------------------------------------------------------------------------
        */

        const pattern =
            String(command.pattern)
                .trim();

        if (!pattern) continue;


        /*
        |--------------------------------------------------------------------------
        | CATEGORY
        |--------------------------------------------------------------------------
        */

        const category =
            normalizeCategory(command.category);


        /*
        |--------------------------------------------------------------------------
        | COMMAND LINE
        |--------------------------------------------------------------------------
        */

        const commandLine =
            `┋ .${pattern}`;


        /*
        |--------------------------------------------------------------------------
        | KNOWN CATEGORY
        |--------------------------------------------------------------------------
        */

        if (
            Object.prototype.hasOwnProperty.call(
                menu,
                category
            )
        ) {

            /*
            |--------------------------------------------------------------------------
            | AVOID DUPLICATES
            |--------------------------------------------------------------------------
            */

            if (
                !menu[category].includes(commandLine)
            ) {
                menu[category].push(commandLine);
            }

            continue;
        }


        /*
        |--------------------------------------------------------------------------
        | UNKNOWN CATEGORY
        |--------------------------------------------------------------------------
        |
        | This makes sure commands such as .url / .vv
        | don't disappear just because their category
        | is not one of the old fixed categories.
        |--------------------------------------------------------------------------
        */

        if (!extraCategories[category]) {
            extraCategories[category] = [];
        }

        if (
            !extraCategories[category]
                .includes(commandLine)
        ) {
            extraCategories[category]
                .push(commandLine);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | SORT COMMANDS
    |--------------------------------------------------------------------------
    */

    for (const category of Object.keys(menu)) {
        menu[category].sort(
            (a, b) => a.localeCompare(b)
        );
    }


    for (const category of Object.keys(extraCategories)) {
        extraCategories[category].sort(
            (a, b) => a.localeCompare(b)
        );
    }


    return {
        menu,
        extraCategories
    };
}


/*
|--------------------------------------------------------------------------
| FORMAT COMMANDS
|--------------------------------------------------------------------------
*/

function formatCommands(commandsList) {

    if (
        !Array.isArray(commandsList) ||
        commandsList.length === 0
    ) {
        return '┋ No Commands Available';
    }

    return commandsList.join('\n');
}


/*
|--------------------------------------------------------------------------
| MAKE TEXT MENU
|--------------------------------------------------------------------------
|
| This is used as the body/caption of the menu.
|--------------------------------------------------------------------------
*/

function buildMenuText(pushname) {

    const {
        menu,
        extraCategories
    } = buildCommandLists();


    const totalCommands =
        Object.values(menu)
            .reduce(
                (total, list) =>
                    total + list.length,
                0
            ) +
        Object.values(extraCategories)
            .reduce(
                (total, list) =>
                    total + list.length,
                0
            );


    let text = `👋 HELLO *${pushname || 'User'}* ❤️

╭━━━〔 🤖 ${BOT_NAME} 〕━━━╮
┃
┃ 🕒 Runtime : ${runtime(process.uptime())}
┃ ⚡ Mode    : ${config.MODE}
┃ ⚙️ Prefix  : ${config.PREFIX}
┃ 💾 RAM     : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
┃ 🤖 Bot     : ${BOT_NAME}
┃ 👤 Creator : ${CREATOR}
┃ 📌 Version : ${VERSION}
┃ 📜 Commands: ${totalCommands}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━〔 👾 CYBER TEAM 〕━━╮
┃
┃  ✨ Welcome to ${BOT_NAME}
┃  ⚡ Fast • Powerful • Easy
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯
`;


    /*
    |--------------------------------------------------------------------------
    | DOWNLOAD
    |--------------------------------------------------------------------------
    */

    text += `
📥 *DOWNLOAD COMMANDS*

╭───────────────●●►
${formatCommands(menu.download)}
╰───────────────●●►
`;


    /*
    |--------------------------------------------------------------------------
    | MAIN
    |--------------------------------------------------------------------------
    */

    text += `
⚙️ *MAIN COMMANDS*

╭───────────────●●►
${formatCommands(menu.main)}
╰───────────────●●►
`;


    /*
    |--------------------------------------------------------------------------
    | GROUP
    |--------------------------------------------------------------------------
    */

    text += `
👥 *GROUP COMMANDS*

╭───────────────●●►
${formatCommands(menu.group)}
╰───────────────●●►
`;


    /*
    |--------------------------------------------------------------------------
    | OWNER
    |--------------------------------------------------------------------------
    */

    text += `
👨‍💻 *OWNER COMMANDS*

╭───────────────●●►
${formatCommands(menu.owner)}
╰───────────────●●►
`;


    /*
    |--------------------------------------------------------------------------
    | CONVERT
    |--------------------------------------------------------------------------
    */

    text += `
🎡 *CONVERT COMMANDS*

╭───────────────●●►
${formatCommands(menu.convert)}
╰───────────────●●►
`;


    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    text += `
🔎 *SEARCH COMMANDS*

╭───────────────●●►
${formatCommands(menu.search)}
╰───────────────●●►
`;


    /*
    |--------------------------------------------------------------------------
    | GAMES
    |--------------------------------------------------------------------------
    */

    if (menu.games.length > 0) {

        text += `
🎮 *GAME COMMANDS*

╭───────────────●●►
${formatCommands(menu.games)}
╰───────────────●●►
`;
    }


    /*
    |--------------------------------------------------------------------------
    | UTILITY
    |--------------------------------------------------------------------------
    */

    if (menu.utility.length > 0) {

        text += `
🛠️ *UTILITY COMMANDS*

╭───────────────●●►
${formatCommands(menu.utility)}
╰───────────────●●►
`;
    }


    /*
    |--------------------------------------------------------------------------
    | AI
    |--------------------------------------------------------------------------
    */

    if (menu.ai.length > 0) {

        text += `
🤖 *AI COMMANDS*

╭───────────────●●►
${formatCommands(menu.ai)}
╰───────────────●●►
`;
    }


    /*
    |--------------------------------------------------------------------------
    | UNKNOWN / CUSTOM CATEGORIES
    |--------------------------------------------------------------------------
    */

    for (
        const [category, list]
        of Object.entries(extraCategories)
    ) {

        if (!list.length) continue;

        const displayCategory =
            category
                .replace(/[-_]/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());


        text += `
✨ *${displayCategory.toUpperCase()} COMMANDS*

╭───────────────●●►
${formatCommands(list)}
╰───────────────●●►
`;
    }


    /*
    |--------------------------------------------------------------------------
    | FOOTER
    |--------------------------------------------------------------------------
    */

    text += `
╭━━━━━━━━━━━━━━━━━━━━━━╮
┃ 💥 POWERED BY
┃ ⚡ ${BOT_NAME}
┃ 👤 ${CREATOR}
╰━━━━━━━━━━━━━━━━━━━━━━╯
`;

    return text;
}


/*
|--------------------------------------------------------------------------
| BUILD INTERACTIVE LIST
|--------------------------------------------------------------------------
*/

function buildSections() {

    const {
        menu,
        extraCategories
    } = buildCommandLists();


    const sections = [];


    /*
    |--------------------------------------------------------------------------
    | MAIN
    |--------------------------------------------------------------------------
    */

    if (menu.main.length) {

        sections.push({
            title: '⚙️ MAIN COMMANDS',

            rows: menu.main.map(command => {

                const cmdName =
                    command
                        .replace('┋ .', '')
                        .trim();

                return {
                    id: `thenuva:${cmdName}`,
                    title: `.${cmdName}`,
                    description: 'Main command'
                };
            })
        });
    }


    /*
    |--------------------------------------------------------------------------
    | DOWNLOAD
    |--------------------------------------------------------------------------
    */

    if (menu.download.length) {

        sections.push({
            title: '📥 DOWNLOAD COMMANDS',

            rows: menu.download.map(command => {

                const cmdName =
                    command
                        .replace('┋ .', '')
                        .trim();

                return {
                    id: `thenuva:${cmdName}`,
                    title: `.${cmdName}`,
                    description: 'Downloader command'
                };
            })
        });
    }


    /*
    |--------------------------------------------------------------------------
    | GROUP
    |--------------------------------------------------------------------------
    */

    if (menu.group.length) {

        sections.push({
            title: '👥 GROUP COMMANDS',

            rows: menu.group.map(command => {

                const cmdName =
                    command
                        .replace('┋ .', '')
                        .trim();

                return {
                    id: `thenuva:${cmdName}`,
                    title: `.${cmdName}`,
                    description: 'Group command'
                };
            })
        });
    }


    /*
    |--------------------------------------------------------------------------
    | OWNER
    |--------------------------------------------------------------------------
    */

    if (menu.owner.length) {

        sections.push({
            title: '👨‍💻 OWNER COMMANDS',

            rows: menu.owner.map(command => {

                const cmdName =
                    command
                        .replace('┋ .', '')
                        .trim();

                return {
                    id: `thenuva:${cmdName}`,
                    title: `.${cmdName}`,
                    description: 'Owner command'
                };
            })
        });
    }


    /*
    |--------------------------------------------------------------------------
    | CONVERT
    |--------------------------------------------------------------------------
    */

    if (menu.convert.length) {

        sections.push({
            title: '🎡 CONVERT COMMANDS',

            rows: menu.convert.map(command => {

                const cmdName =
                    command
                        .replace('┋ .', '')
                        .trim();

                return {
                    id: `thenuva:${cmdName}`,
                    title: `.${cmdName}`,
                    description: 'Convert command'
                };
            })
        });
    }


    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    if (menu.search.length) {

        sections.push({
            title: '🔎 SEARCH COMMANDS',

            rows: menu.search.map(command => {

                const cmdName =
                    command
                        .replace('┋ .', '')
                        .trim();

                return {
                    id: `thenuva:${cmdName}`,
                    title: `.${cmdName}`,
                    description: 'Search command'
                };
            })
        });
    }


    /*
    |--------------------------------------------------------------------------
    | GAMES
    |--------------------------------------------------------------------------
    */

    if (menu.games.length) {

        sections.push({
            title: '🎮 GAME COMMANDS',

            rows: menu.games.map(command => {

                const cmdName =
                    command
                        .replace('┋ .', '')
                        .trim();

                return {
                    id: `thenuva:${cmdName}`,
                    title: `.${cmdName}`,
                    description: 'Game command'
                };
            })
        });
    }


    /*
    |--------------------------------------------------------------------------
    | UTILITY
    |--------------------------------------------------------------------------
    */

    if (menu.utility.length) {

        sections.push({
            title: '🛠️ UTILITY COMMANDS',

            rows: menu.utility.map(command => {

                const cmdName =
                    command
                        .replace('┋ .', '')
                        .trim();

                return {
                    id: `thenuva:${cmdName}`,
                    title: `.${cmdName}`,
                    description: 'Utility command'
                };
            })
        });
    }


    /*
    |--------------------------------------------------------------------------
    | AI
    |--------------------------------------------------------------------------
    */

    if (menu.ai.length) {

        sections.push({
            title: '🤖 AI COMMANDS',

            rows: menu.ai.map(command => {

                const cmdName =
                    command
                        .replace('┋ .', '')
                        .trim();

                return {
                    id: `thenuva:${cmdName}`,
                    title: `.${cmdName}`,
                    description: 'AI command'
                };
            })
        });
    }


    /*
    |--------------------------------------------------------------------------
    | CUSTOM CATEGORIES
    |--------------------------------------------------------------------------
    */

    for (
        const [category, list]
        of Object.entries(extraCategories)
    ) {

        if (!list.length) continue;


        sections.push({

            title:
                `✨ ${category
                    .replace(/[-_]/g, ' ')
                    .toUpperCase()}`,

            rows: list.map(command => {

                const cmdName =
                    command
                        .replace('┋ .', '')
                        .trim();

                return {
                    id: `thenuva:${cmdName}`,
                    title: `.${cmdName}`,
                    description: `${category} command`
                };
            })
        });
    }


    return sections;
}


/*
|--------------------------------------------------------------------------
| MENU COMMAND
|--------------------------------------------------------------------------
*/

cmd({

    pattern: 'menu2',

    react: '👾',

    desc: 'Get interactive command menu',

    category: 'main',

    filename: __filename

}, async (
    conn,
    mek,
    m,
    {
        from,
        pushname,
        reply
    }
) => {

    try {

        /*
        |--------------------------------------------------------------------------
        | CREATE MENU TEXT
        |--------------------------------------------------------------------------
        */

        const menuText =
            buildMenuText(pushname);


        /*
        |--------------------------------------------------------------------------
        | CREATE SECTIONS
        |--------------------------------------------------------------------------
        */

        const sections =
            buildSections();


        /*
        |--------------------------------------------------------------------------
        | SEND IMAGE + INTERACTIVE MENU
        |--------------------------------------------------------------------------
        |
        | sendListMenu handles the image.
        |
        */

        await sendListMenu(

            conn,

            from,

            {
                title: menuText,

                buttonText: '📜 OPEN COMMAND MENU',

                sections,

                footer:
                    `${BOT_NAME} • POWERED BY ${CREATOR}`,

                image: MENU_IMAGE
            },

            mek
        );


    } catch (error) {

        console.error(
            '[MENU2 ERROR]',
            error
        );

        /*
        |--------------------------------------------------------------------------
        | FALLBACK
        |--------------------------------------------------------------------------
        */

        try {

            await conn.sendMessage(

                from,

                {
                    image: {
                        url: MENU_IMAGE
                    },

                    caption: buildMenuText(pushname),

                    contextInfo: {

                        mentionedJid: [
                            m.sender
                        ],

                        forwardingScore: 999,

                        isForwarded: true,

                        forwardedNewsletterMessageInfo: {

                            newsletterJid:
                                NEWSLETTER_JID,

                            newsletterName:
                                NEWSLETTER_NAME,

                            serverMessageId: 143
                        }
                    }
                },

                {
                    quoted: mek
                }
            );

        } catch (fallbackError) {

            console.error(
                '[MENU2 FALLBACK ERROR]',
                fallbackError
            );

            return reply(
                `Menu Error: ${
                    error?.message || error
                }`
            );
        }
    }
});
