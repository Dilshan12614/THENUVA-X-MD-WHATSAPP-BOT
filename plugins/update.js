const { cmd } = require('../command');
const config = require('../config');

const OWNER_NUMBER = String(
    process.env.OWNER_NUMBER ||
    config.OWNER_NUMBER ||
    config.OWNER_NUM ||
    '94772194789'
).replace(/\D/g, '');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO =
    process.env.GITHUB_REPO ||
    '';

// මෙය ඔයාගේ repository එකේ සැබෑ workflow filename එකට
// වෙනස් කරන්න. උදා: deploy.yml හෝ main.yml
const GITHUB_WORKFLOW =
    process.env.GITHUB_WORKFLOW || 'main.yml';

const GITHUB_BRANCH =
    process.env.GITHUB_BRANCH || 'add-menu-bottons';

function cleanNumber(value = '') {
    return String(value)
        .split('@')[0]
        .split(':')[0]
        .replace(/\D/g, '');
}

cmd(
    {
        pattern: 'update',
        alias: ['checkupdate'],
        react: '🔄',
        desc: 'Check and trigger GitHub workflow',
        category: 'owner',
        filename: __filename
    },
    async (conn, mek, m, { from, sender }) => {
        try {
            // Owner permission check
            const owner = cleanNumber(
                sender ||
                m?.key?.participant ||
                m?.participant ||
                ''
            );

            if (!owner || owner !== OWNER_NUMBER) {
                return await conn.sendMessage(
                    from,
                    { text: '⛔ This command is only for the bot owner.' },
                    { quoted: mek }
                );
            }

            if (!GITHUB_TOKEN) {
                return await conn.sendMessage(
                    from,
                    {
                        text:
                            '❌ GITHUB_TOKEN is missing.\n\n' +
                            'Add it to Railway Variables before using .update.'
                    },
                    { quoted: mek }
                );
            }

            const parts = GITHUB_REPO.split('/');
            if (
                parts.length !== 2 ||
                parts.some(part => !/^[A-Za-z0-9_.-]+$/.test(part))
            ) {
                throw new Error('Invalid GITHUB_REPO setting.');
            }

            await conn.sendMessage(
                from,
                {
                    text:
                        '🔄 *THENUVA X MD — UPDATE*\n\n' +
                        'Checking GitHub workflow...\n' +
                        `📦 Repository: ${GITHUB_REPO}\n` +
                        `🌿 Branch: ${GITHUB_BRANCH}`
                },
                { quoted: mek }
            );

            const url =
                `https://api.github.com/repos/${parts[0]}/${parts[1]}` +
                `/actions/workflows/${encodeURIComponent(GITHUB_WORKFLOW)}/dispatches`;

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
                    '[UPDATE] GitHub API error:',
                    response.status,
                    details
                );

                return await conn.sendMessage(
                    from,
                    {
                        text:
                            '❌ *Update workflow failed.*\n\n' +
                            `HTTP Status: ${response.status}\n` +
                            'Check workflow filename, branch, token permissions ' +
                            'and workflow_dispatch configuration.'
                    },
                    { quoted: mek }
                );
            }

            return await conn.sendMessage(
                from,
                {
                    text:
                        '✅ *GitHub workflow triggered successfully!*\n\n' +
                        `📦 Repo: ${GITHUB_REPO}\n` +
                        `🌿 Branch: ${GITHUB_BRANCH}\n` +
                        `⚙️ Workflow: ${GITHUB_WORKFLOW}\n\n` +
                        'ℹ️ This confirms that GitHub accepted the workflow ' +
                        'request. It does not confirm that the build or ' +
                        'Railway deployment has completed.'
                },
                { quoted: mek }
            );
        } catch (error) {
            console.error('[UPDATE ERROR]', error);

            return await conn.sendMessage(
                from,
                {
                    text:
                        '❌ Update request failed.\n' +
                        String(error.message || error).slice(0, 250)
                },
                { quoted: mek }
            );
        }
    }
);
