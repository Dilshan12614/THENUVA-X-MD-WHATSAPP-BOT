const { cmd } = require('../command');

const OWNER_NUMBER = '94772194789';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO =
    process.env.GITHUB_REPO ||
    'https://github.com/Dilshan12614/THENUVA-X-MD-WHATSAPP-BOT.git';

const GITHUB_WORKFLOW =
    process.env.GITHUB_WORKFLOW || 'main.yml';

const GITHUB_BRANCH =
    process.env.GITHUB_BRANCH || 'add-menu-bottons';

// Normalize Sri Lankan mobile numbers and Baileys JIDs
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
            // Owner permission check
            const possibleSenders = [
                sender,
                m?.key?.participant,
                m?.participant
            ].filter(Boolean);

            const allowed = possibleSenders.some(isOwner);

            if (!allowed) {
                return await conn.sendMessage(
                    from,
                    {
                        text: '⛔ This command is only available to the bot owner.'
                    },
                    { quoted: mek }
                );
            }

            if (!GITHUB_TOKEN) {
                return await conn.sendMessage(
                    from,
                    {
                        text:
                            '❌ GITHUB_TOKEN is missing.\n\n' +
                            'Add GITHUB_TOKEN in Railway Variables.'
                    },
                    { quoted: mek }
                );
            }

            const repoParts = GITHUB_REPO.split('/');

            if (
                repoParts.length !== 2 ||
                repoParts.some(part =>
                    !/^[A-Za-z0-9_.-]+$/.test(part)
                )
            ) {
                throw new Error('Invalid GITHUB_REPO setting.');
            }

            const [owner, repo] = repoParts;

            await conn.sendMessage(
                from,
                {
                    text:
                        '╭─〔 *THENUVA X MD* 〕\n' +
                        '│ 🔄 *UPDATE REQUEST*\n' +
                        '├──────────────\n' +
                        `│ 📦 Repository: ${repo}\n` +
                        `│ 🌿 Branch: ${GITHUB_BRANCH}\n` +
                        '│ ⏳ Triggering workflow...\n' +
                        '╰──────────────'
                },
                { quoted: mek }
            );

            const workflowPath = GITHUB_WORKFLOW
                .split('/')
                .map(encodeURIComponent)
                .join('/');

            const url =
                `https://api.github.com/repos/${owner}/${repo}` +
                `/actions/workflows/${workflowPath}/dispatches`;

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
                            '❌ *GitHub workflow failed!*\n\n' +
                            `HTTP Status: ${response.status}\n` +
                            'Check the workflow filename, branch, ' +
                            'token permissions and workflow_dispatch.'
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
                        `│ 📦 Repository: ${repo}\n` +
                        `│ 🌿 Branch: ${GITHUB_BRANCH}\n` +
                        '│ ⚙️ GitHub workflow triggered.\n' +
                        '│ ℹ️ Build/deployment is not yet confirmed.\n' +
                        '╰──────────────'
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
