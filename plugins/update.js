const { cmd } = require('../command');

const OWNER_NUMBER = '94772194789';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'Dilshan12614/THENUVA-X-MD-WHATSAPP-BOT';
const GITHUB_WORKFLOW = process.env.GITHUB_WORKFLOW || 'main.yml';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'add-menu-bottons';

function cleanNumber(value = '') {
    let number = String(value)
        .split('@')[0]
        .split(':')[0]
        .replace(/\D/g, '');

    if (number.startsWith('00')) {
        number = number.slice(2);
    }

    if (number.startsWith('0') && number.length === 10) {
        number = '94' + number.slice(1);
    }

    return number;
}

function isOwner(sender) {
    return cleanNumber(sender) === cleanNumber(OWNER_NUMBER);
}

cmd(
    {
        pattern: 'update',
        alias: ['checkupdate'],
        react: '🔄',
        desc: 'Trigger GitHub update workflow',
        category: 'owner',
        filename: __filename
    },

    async (conn, mek, m, { from, sender }) => {
        try {
            // OWNER CHECK
            const possibleSenders = [
                sender,
                m?.key?.participant,
                m?.participant,
                m?.key?.remoteJid
            ].filter(Boolean);

            if (!possibleSenders.some(isOwner)) {
                return await conn.sendMessage(
                    from,
                    {
                        text: '⛔ This command is only available to the bot owner.'
                    },
                    { quoted: mek }
                );
            }

            // TOKEN CHECK
            if (!GITHUB_TOKEN) {
                return await conn.sendMessage(
                    from,
                    {
                        text:
                            '❌ GITHUB_TOKEN is missing!\n\n' +
                            'Add GITHUB_TOKEN in Railway Variables.'
                    },
                    { quoted: mek }
                );
            }

            // FIXED REPOSITORY PARSING
            const repoParts = GITHUB_REPO.trim().split('/');

            if (
                repoParts.length !== 2 ||
                !repoParts[0] ||
                !repoParts[1]
            ) {
                throw new Error(
                    'Invalid repository format. Expected owner/repository.'
                );
            }

            const [githubOwner, githubRepo] = repoParts;

            // WORKFLOW PATH
            const workflowPath = GITHUB_WORKFLOW
                .split('/')
                .map(encodeURIComponent)
                .join('/');

            const url =
                `https://api.github.com/repos/${githubOwner}/${githubRepo}` +
                `/actions/workflows/${workflowPath}/dispatches`;

            await conn.sendMessage(
                from,
                {
                    text:
                        '╭─〔 *THENUVA X MD* 〕\n' +
                        '│ 🔄 *UPDATE REQUEST*\n' +
                        '├──────────────\n' +
                        `│ 📦 Repository: ${githubRepo}\n` +
                        `│ 🌿 Branch: ${GITHUB_BRANCH}\n` +
                        '│ ⏳ Triggering GitHub workflow...\n' +
                        '╰──────────────'
                },
                { quoted: mek }
            );

            // TRIGGER GITHUB ACTIONS
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/vnd.github+json',
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    'X-GitHub-Api-Version': '2022-11-28',
                    'Content-Type': 'application/json',
                    'User-Agent': 'THENUVA-X-MD'
                },
                body: JSON.stringify({
                    ref: GITHUB_BRANCH
                }),
                signal: AbortSignal.timeout(15000)
            });

            if (response.status !== 204) {
                const details = await response.text();

                console.error(
                    '[UPDATE ERROR]',
                    response.status,
                    details
                );

                return await conn.sendMessage(
                    from,
                    {
                        text:
                            '❌ *GITHUB WORKFLOW FAILED*\n\n' +
                            `HTTP Status: ${response.status}\n\n` +
                            'Check these settings:\n' +
                            '• GITHUB_TOKEN permissions\n' +
                            '• Workflow filename\n' +
                            '• Repository access\n' +
                            '• Branch name\n' +
                            '• workflow_dispatch enabled'
                    },
                    { quoted: mek }
                );
            }

            return await conn.sendMessage(
                from,
                {
                    text:
                        '╭─〔 *THENUVA X MD* 〕\n' +
                        '│ ✅ *UPDATE REQUEST ACCEPTED*\n' +
                        '├──────────────\n' +
                        `│ 📦 Repository: ${githubRepo}\n` +
                        `│ 🌿 Branch: ${GITHUB_BRANCH}\n` +
                        `│ ⚙️ Workflow: ${GITHUB_WORKFLOW}\n` +
                        '│ 🚀 GitHub Actions triggered!\n' +
                        '╰──────────────\n\n' +
                        'ℹ️ Build සහ Railway deployment එක සාර්ථකදැයි ' +
                        'GitHub Actions logs වලින් පරීක්ෂා කරන්න.'
                },
                { quoted: mek }
            );

        } catch (error) {
            console.error('[UPDATE COMMAND ERROR]', error);

            return await conn.sendMessage(
                from,
                {
                    text:
                        '❌ *UPDATE ERROR*\n\n' +
                        String(error.message || error).slice(0, 250)
                },
                { quoted: mek }
            );
        }
    }
);
