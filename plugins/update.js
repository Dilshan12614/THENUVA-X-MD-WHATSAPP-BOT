const { cmd } = require('../command');

const OWNER_NUMBER = '94772194789';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'Dilshan12614/THENUVA-X-MD-WHATSAPP-BOT';

// Supports both environment variable names
const GITHUB_WORKFLOW =
process.env.GITHUB_WORKFLOW_FILE ||
process.env.GITHUB_WORKFLOW ||
'main.yml';

const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

const API_BASE = 'https://api.github.com';

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

function getHeaders() {
return {
Accept: 'application/vnd.github+json',
Authorization: `Bearer ${GITHUB_TOKEN}`,
'X-GitHub-Api-Version': '2022-11-28',
'Content-Type': 'application/json',
'User-Agent': 'THENUVA-X-MD'
};
}

async function githubRequest(url, options = {}) {
const response = await fetch(url, {
...options,
headers: {
...getHeaders(),
...(options.headers || {})
},
signal: AbortSignal.timeout(15000)
});


const text = await response.text();

let data = {};
try {
    data = text ? JSON.parse(text) : {};
} catch {
    data = { message: text || 'Unknown GitHub response' };
}

return { response, data };


}

cmd(
{
pattern: 'update',
alias: ['checkupdate'],
react: '🔄',
desc: 'Trigger GitHub Actions workflow',
category: 'owner',
filename: __filename
},


async (conn, mek, m, { from, sender }) => {
    try {
        // OWNER CHECK
        const possibleSenders = [
            sender,
            m?.key?.participant,
            m?.participant
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
                        '❌ *GITHUB TOKEN MISSING*\n\n' +
                        'Add the GITHUB_TOKEN environment variable ' +
                        'to the GitHub Actions workflow environment.'
                },
                { quoted: mek }
            );
        }

        // VALIDATE REPOSITORY
        const repoParts = GITHUB_REPO.trim().split('/');

        if (
            repoParts.length !== 2 ||
            !repoParts[0] ||
            !repoParts[1]
        ) {
            throw new Error(
                'Invalid GITHUB_REPO. Expected owner/repository.'
            );
        }

        const [githubOwner, githubRepo] = repoParts;

        // VALIDATE WORKFLOW FILE
        const workflowFile = GITHUB_WORKFLOW.trim();

        if (
            !workflowFile ||
            workflowFile.includes('..') ||
            workflowFile.startsWith('/')
        ) {
            throw new Error('Invalid workflow filename.');
        }

        const encodedWorkflow = workflowFile
            .split('/')
            .map(encodeURIComponent)
            .join('/');

        const workflowUrl =
            `${API_BASE}/repos/${githubOwner}/${githubRepo}` +
            `/actions/workflows/${encodedWorkflow}`;

        const dispatchUrl =
            `${workflowUrl}/dispatches`;

        await conn.sendMessage(
            from,
            {
                text:
                    '╭─〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕\n' +
                    '│ 🔄 *UPDATE REQUEST*\n' +
                    '├──────────────\n' +
                    `│ 📦 Repository: ${githubRepo}\n` +
                    `│ 📄 Workflow: ${workflowFile}\n` +
                    `│ 🌿 Branch: ${GITHUB_BRANCH}\n` +
                    '│ 🔍 Checking workflow...\n' +
                    '╰──────────────'
            },
            { quoted: mek }
        );

        // CHECK THAT THE WORKFLOW EXISTS AND IS ACCESSIBLE
        const check = await githubRequest(workflowUrl);

        if (!check.response.ok) {
            const message = check.data?.message || 'Unknown error';

            console.error(
                '[UPDATE WORKFLOW CHECK]',
                check.response.status,
                message
            );

            let hint = '';

            if (check.response.status === 404) {
                hint =
                    'Check the repository name, workflow filename, ' +
                    'token repository access, and Actions permissions.';
            } else if (
                check.response.status === 401 ||
                check.response.status === 403
            ) {
                hint =
                    'Check whether the token is valid and has ' +
                    'Actions read/write permission for this repository.';
            } else {
                hint = 'Check the GitHub API response and try again.';
            }

            return await conn.sendMessage(
                from,
                {
                    text:
                        '❌ *WORKFLOW CHECK FAILED*\n\n' +
                        `HTTP: ${check.response.status}\n` +
                        `Reason: ${message}\n\n` +
                        `${hint}\n\n` +
                        `Workflow: ${workflowFile}\n` +
                        `Repository: ${GITHUB_REPO}`
                },
                { quoted: mek }
            );
        }

        // CHECK BRANCH EXISTS
        const branchUrl =
            `${API_BASE}/repos/${githubOwner}/${githubRepo}` +
            `/branches/${encodeURIComponent(GITHUB_BRANCH)}`;

        const branchCheck = await githubRequest(branchUrl);

        if (!branchCheck.response.ok) {
            const message =
                branchCheck.data?.message || 'Unknown error';

            console.error(
                '[UPDATE BRANCH CHECK]',
                branchCheck.response.status,
                message
            );

            return await conn.sendMessage(
                from,
                {
                    text:
                        '❌ *BRANCH CHECK FAILED*\n\n' +
                        `Branch: ${GITHUB_BRANCH}\n` +
                        `HTTP: ${branchCheck.response.status}\n` +
                        `Reason: ${message}\n\n` +
                        'Check the branch name in your GitHub repository.'
                },
                { quoted: mek }
            );
        }

        // TRIGGER GITHUB ACTIONS
        const result = await githubRequest(dispatchUrl, {
            method: 'POST',
            body: JSON.stringify({
                ref: GITHUB_BRANCH
            })
        });

        // GitHub normally returns 204 No Content for dispatch
        if (
            result.response.status !== 204 &&
            result.response.status !== 200
        ) {
            const message =
                result.data?.message || 'Unknown error';

            console.error(
                '[UPDATE DISPATCH ERROR]',
                result.response.status,
                result.data
            );

            let hint = '';

            if (result.response.status === 404) {
                hint =
                    'GitHub could not find the workflow/repository ' +
                    'or the token cannot access it.';
            } else if (result.response.status === 422) {
                hint =
                    'Check that workflow_dispatch is enabled and ' +
                    'the selected branch is valid.';
            } else if (
                result.response.status === 401 ||
                result.response.status === 403
            ) {
                hint =
                    'Check token validity and Actions write permission.';
            } else {
                hint = 'Check GitHub Actions settings and API response.';
            }

            return await conn.sendMessage(
                from,
                {
                    text:
                        '❌ *GITHUB DISPATCH FAILED*\n\n' +
                        `HTTP: ${result.response.status}\n` +
                        `Reason: ${message}\n\n` +
                        `${hint}`
                },
                { quoted: mek }
            );
        }

        // SUCCESS
        return await conn.sendMessage(
            from,
            {
                text:
                    '╭─〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕\n' +
                    '│ ✅ *WORKFLOW TRIGGERED*\n' +
                    '├──────────────\n' +
                    `│ 📦 Repository: ${githubRepo}\n` +
                    `│ 📄 Workflow: ${workflowFile}\n` +
                    `│ 🌿 Branch: ${GITHUB_BRANCH}\n` +
                    '│ 🚀 GitHub Actions request accepted!\n' +
                    '╰──────────────\n\n' +
                    'ℹ️ GitHub Actions → Runs වෙත ගොස් ' +
                    'workflow එකේ ප්‍රතිඵලය පරීක්ෂා කරන්න.'
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
                    String(error.message || error).slice(0, 300)
            },
            { quoted: mek }
        );
    }
}


);
