const { cmd } = require('../command');
const config = require('../config');
const https = require('https');

cmd(
    {
        pattern: 'restart',
        alias: ['reboot'],
        desc: 'Restart bot using GitHub Actions',
        category: 'owner',
        filename: __filename
    },
    async (conn, mek, m, { isOwner, isMe, reply }) => {
        try {
            if (!isOwner && !isMe) {
                return await reply(
                    '╭─〔 *ᴀᴄᴄᴇss ᴅᴇɴɪᴇᴅ* 〕─●●►\n' +
                    '│\n' +
                    '│ ➤ ᴏᴡɴᴇʀ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ\n' +
                    '│\n' +
                    '╰────────────────●●►'
                );
            }

            const token = process.env.GITHUB_TOKEN;
            const owner = process.env.GITHUB_OWNER;
            const repo = process.env.GITHUB_REPO;
            const workflow = process.env.GITHUB_WORKFLOW_FILE || 'main.yml';
            const branch = process.env.GITHUB_BRANCH || 'add-menu-bottons';

            if (!token || !owner || !repo) {
                return await reply(
                    '╭─〔 *ᴄᴏɴꜰɪɢ ᴇʀʀᴏʀ* 〕─●●►\n' +
                    '│\n' +
                    '│ ➤ GitHub settings missing\n' +
                    '│ ➤ Check repository secrets\n' +
                    '│\n' +
                    '╰────────────────●●►'
                );
            }

            await reply(
                '╭─〔 *ʀᴇsᴛᴀʀᴛ ᴘᴀɴᴇʟ* 〕─●●►\n' +
                '│\n' +
                '│ ➤ ɢɪᴛʜᴜʙ ᴀᴄᴛɪᴏɴs\n' +
                '│ ➤ ʀᴇǫᴜᴇsᴛɪɴɢ ʀᴇsᴛᴀʀᴛ...\n' +
                '│\n' +
                '╰────────────────●●►\n\n' +
                
                '> ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa'
            );

            const data = JSON.stringify({ ref: branch });

            const options = {
                hostname: 'api.github.com',
                path: `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`,
                method: 'POST',
                headers: {
                    'User-Agent': 'THENUVA-X-MD',
                    'Accept': 'application/vnd.github+json',
                    'Authorization': `Bearer ${token}`,
                    'X-GitHub-Api-Version': '2022-11-28',
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            };

            const request = https.request(options, (response) => {
                let result = '';

                response.on('data', (chunk) => {
                    result += chunk;
                });

                response.on('end', async () => {
                    if (response.statusCode === 204) {
                        console.log('[RESTART] Workflow dispatch successful.');
                        return;
                    }

                    console.error(
                        '[RESTART ERROR]',
                        response.statusCode,
                        result
                    );
                });
            });

            request.on('error', (error) => {
                console.error('[RESTART ERROR]', error.message);
            });

            request.write(data);
            request.end();

        } catch (error) {
            console.error('[RESTART ERROR]', error);

            await reply(
                '╭─〔 *ʀᴇsᴛᴀʀᴛ ᴇʀʀᴏʀ* 〕─●●►\n' +
                '│\n' +
                `│ ➤ ${error.message}\n` +
                '│\n' +
                '╰────────────────●●►'
            );
        }
    }
);
