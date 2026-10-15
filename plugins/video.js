const { cmd } = require('../command');
const { sendListMenu } = require('../lib/buttons');
const yts = require('yt-search');

const fs = require('fs');
const os = require('os');
const path = require('path');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

const SASA_API_KEY = process.env.SASA_API_KEY;
const API_URL = 'https://sasa-dev-api.xyz/api/yt/mp4-dl';

const TIMEOUT = 300000;
const MAX_MEDIA_SIZE = 512 * 1024 * 1024;

const FOOTER =
    '> ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

const pendingVideos = new Map();
const pendingVideoNames = new Map();
const registeredVideoListeners = new WeakSet();

const QUALITIES = ['360', '480', '720', '1080'];

function isYouTubeUrl(value) {
    try {
        const url = new URL(value);

        return [
            'youtube.com',
            'www.youtube.com',
            'm.youtube.com',
            'youtu.be',
            'www.youtu.be'
        ].includes(url.hostname.toLowerCase()) &&
        ['http:', 'https:'].includes(url.protocol);
    } catch {
        return false;
    }
}

function safeFileName(value) {
    return String(value || 'THENUVA-X-MD')
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 100) || 'THENUVA-X-MD';
}

async function sendQualityMenu(conn, from, mek, video) {
    pendingVideos.set(from, {
        url: video.url,
        title: video.title || 'YouTube Video'
    });

    return sendListMenu(
        conn,
        from,
        {
            title:
                '╭━━〔 *ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ* 〕━━╮\n' +
                '┃ 🎬 *SELECT VIDEO QUALITY*\n' +
                '┣━━━━━━━━━━━━━━━━━━╯\n' +
                '┃\n' +
                `┃ 📌 ${video.title || 'YouTube Video'}\n` +
                '┃\n' +
                '┃ 📥 අවශ්‍ය Quality එක තෝරන්න\n' +
                '┃\n' +
                '┃ 📺 360p  •  අඩු Data භාවිතය\n' +
                '┃ 📺 480p  •  සාමාන්‍ය Quality\n' +
                '┃ 📺 720p  •  HD Quality\n' +
                '┃ 📺 1080p •  Full HD Quality\n' +
                '┣━━━━━━━━━━━━━━━━━━╯',

            buttonText: 'Select Quality',
            footer: FOOTER,

            sections: [
                {
                    title: '🎬 MP4 Video Quality',
                    rows: [
                        {
                            id: 'ytquality_360',
                            title: '📺 360p',
                            description: 'Small size • Save data'
                        },
                        {
                            id: 'ytquality_480',
                            title: '📺 480p',
                            description: 'Standard video quality'
                        },
                        {
                            id: 'ytquality_720',
                            title: '📺 720p HD',
                            description: 'High definition video'
                        },
                        {
                            id: 'ytquality_1080',
                            title: '📺 1080p Full HD',
                            description: 'Full HD, if supported'
                        }
                    ]
                }
            ]
        },
        mek
    );
}

async function downloadVideo(conn, mek, from, reply, quality) {
    let tempDir;

    try {
        const selected = pendingVideos.get(from);

        if (!selected?.url) {
            return reply(
                '╭━━〔 *ɴᴏ ᴠɪᴅᴇᴏ sᴇʟᴇᴄᴛᴇᴅ* 〕━━╮\n' +
                '┃ ❌ මුලින් `.video` යවලා වීඩියෝවක් තෝරන්න.\n' +
                '┣━━━━━━━━━━━━━━━━━━╯\n' +
                FOOTER
            );
        }

        if (!SASA_API_KEY) {
            return reply(
                '╭━━〔 *ᴀᴘɪ ᴄᴏɴғɪɢ* 〕━━╮\n' +
                '┃ ❌ SASA_API_KEY එක සකස් කර නැහැ.\n' +
                '┃ ➜ Railway Variables වලට API key එක එක් කරන්න.\n' +
                '┣━━━━━━━━━━━━━━━━━━╯\n' +
                FOOTER
            );
        }

        if (!QUALITIES.includes(String(quality))) {
            return reply('❌ Invalid video quality.');
        }

        await conn.sendMessage(from, {
            react: { text: '⏳', key: mek.key }
        });

        await reply(
            '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━╮\n' +
            '┃ ⏳ *ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ ᴠɪᴅᴇᴏ...*\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            `┃ 📺 Quality: ${quality}p\n` +
            '┃ 📥 Format: MP4\n' +
            '┃ ➜ Please wait...\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );

        const requestUrl = new URL(API_URL);
        requestUrl.searchParams.set('apikey', SASA_API_KEY);
        requestUrl.searchParams.set('url', selected.url);
        requestUrl.searchParams.set('quality', String(quality));
        requestUrl.searchParams.set('raw', '1');

        const response = await fetch(requestUrl, {
            method: 'GET',
            redirect: 'follow',
            signal: AbortSignal.timeout(TIMEOUT),
            headers: {
                Accept: 'video/mp4, application/octet-stream, application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            console.error(
                '[SASA VIDEO API]',
                response.status,
                errorText.slice(0, 500)
            );

            throw new Error(`API_HTTP_${response.status}`);
        }

        const contentType = (
            response.headers.get('content-type') || ''
        ).toLowerCase();

        if (
            contentType.includes('text/html') ||
            contentType.includes('application/json') ||
            contentType.includes('text/plain')
        ) {
            const body = await response.text().catch(() => '');

            console.error(
                '[SASA API NON-VIDEO RESPONSE]',
                body.slice(0, 1000)
            );

            throw new Error(
                'API returned a message instead of an MP4 file. Check API response and key.'
            );
        }

        if (
            !contentType.includes('video/') &&
            !contentType.includes('application/octet-stream') &&
            !contentType.includes('binary/octet-stream')
        ) {
            throw new Error(
                `Unsupported content type: ${contentType || 'unknown'}`
            );
        }

        const declaredSize = Number(
            response.headers.get('content-length') || 0
        );

        if (declaredSize > MAX_MEDIA_SIZE) {
            throw new Error('FILE_TOO_LARGE');
        }

        if (!response.body) {
            throw new Error('API returned an empty response.');
        }

        tempDir = await fs.promises.mkdtemp(
            path.join(os.tmpdir(), 'thenuva-video-')
        );

        const tempFile = path.join(tempDir, 'video.mp4');
        let downloadedSize = 0;

        const source = Readable.fromWeb(response.body);

        source.on('data', chunk => {
            downloadedSize += chunk.length;

            if (downloadedSize > MAX_MEDIA_SIZE) {
                source.destroy(new Error('FILE_TOO_LARGE'));
            }
        });

        try {
            await pipeline(
                source,
                fs.createWriteStream(tempFile)
            );
        } catch (error) {
            if (
                error.message === 'FILE_TOO_LARGE' ||
                downloadedSize > MAX_MEDIA_SIZE
            ) {
                throw new Error('FILE_TOO_LARGE');
            }

            throw error;
        }

        const fileInfo = await fs.promises.stat(tempFile);

        if (!fileInfo.size) {
            throw new Error('Downloaded MP4 is empty.');
        }

        if (fileInfo.size > MAX_MEDIA_SIZE) {
            throw new Error('FILE_TOO_LARGE');
        }

        // Basic MP4 signature validation (ftyp box).
        const fileHandle = await fs.promises.open(tempFile, 'r');

        try {
            const header = Buffer.alloc(12);
            const { bytesRead } = await fileHandle.read(
                header, 0, 12, 0
            );

            if (
                bytesRead < 8 ||
                header.toString('ascii', 4, 8) !== 'ftyp'
            ) {
                throw new Error(
                    'The API response is not a valid MP4 file.'
                );
            }
        } finally {
            await fileHandle.close();
        }

        const title = safeFileName(selected.title);

        const caption =
            '╭━━〔 *ᴅᴏᴡɴʟᴏᴀᴅ sᴜᴄᴄᴇss* 〕━━╮\n' +
            `┃ 🎬 *${title}*\n` +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            `┃ 📺 Quality: ${quality}p\n` +
            '┃ 📁 Format: MP4\n' +
            `┃ 📦 Size: ${(fileInfo.size / (1024 * 1024)).toFixed(1)} MB\n` +
            '┃ ✅ Status: Success\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER;

        await conn.sendMessage(
            from,
            {
                video: { url: tempFile },
                mimetype: 'video/mp4',
                fileName: `${title}.mp4`,
                caption
            },
            { quoted: mek }
        );

        pendingVideos.delete(from);

        await conn.sendMessage(from, {
            react: { text: '✅', key: mek.key }
        });

    } catch (error) {
        console.error(
            '[SASA VIDEO DOWNLOAD ERROR]',
            error.stack || error.message
        );

        await conn.sendMessage(from, {
            react: { text: '❌', key: mek.key }
        }).catch(() => {});

        let message = error.message || 'Unknown error';

        if (message === 'FILE_TOO_LARGE') {
            message =
                'වීඩියෝව 512 MB සීමාව ඉක්මවයි. අඩු Quality එකක් තෝරන්න.';
        } else if (/API_HTTP_401|API_HTTP_403/.test(message)) {
            message =
                'API key එක වැරදි විය හැකියි, නැත්නම් API access ප්‍රතික්ෂේප වී ඇත.';
        } else if (/API_HTTP_429/.test(message)) {
            message =
                'API requests වැඩියි. ටික වේලාවකින් නැවත උත්සාහ කරන්න.';
        } else if (/API_HTTP_5\d\d/.test(message)) {
            message =
                'Sasa API server එකේ ගැටලුවක්. පසුව නැවත උත්සාහ කරන්න.';
        } else if (/AbortError|TimeoutError/i.test(message)) {
            message =
                'Download එකට වැඩි වේලාවක් ගියා. නැවත උත්සාහ කරන්න.';
        }

        return reply(
            '╭━━〔 *ᴅᴏᴡɴʟᴏᴀᴅ ғᴀɪʟᴇᴅ* 〕━━╮\n' +
            `┃ ❌ ${message}\n` +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );

    } finally {
        if (tempDir) {
            await fs.promises.rm(tempDir, {
                recursive: true,
                force: true
            }).catch(error => {
                console.error(
                    '[TEMP FILE CLEANUP ERROR]',
                    error.message
                );
            });
        }
    }
}

function getMessageText(message) {
    const msg = message?.message || {};

    return (
        msg.conversation ||
        msg.extendedTextMessage?.text ||
        msg.imageMessage?.caption ||
        msg.videoMessage?.caption ||
        msg.documentMessage?.caption ||
        msg.ephemeralMessage?.message?.conversation ||
        msg.ephemeralMessage?.message?.extendedTextMessage?.text ||
        ''
    ).trim();
}

function registerVideoNameListener(conn) {
    if (!conn?.ev || registeredVideoListeners.has(conn)) {
        return;
    }

    registeredVideoListeners.add(conn);

    conn.ev.on('messages.upsert', async ({ messages }) => {
        for (const incoming of messages || []) {
            try {
                if (!incoming?.message || incoming.key?.fromMe) {
                    continue;
                }

                const from = incoming.key?.remoteJid;

                if (!from || !pendingVideoNames.has(from)) {
                    continue;
                }

                const text = getMessageText(incoming);

                if (!text || text.startsWith('.')) {
                    continue;
                }

                pendingVideoNames.delete(from);

                await conn.sendMessage(from, {
                    react: { text: '🔎', key: incoming.key }
                });

                const search = await yts(text);
                const video = search?.videos?.[0];

                if (!video?.url) {
                    await conn.sendMessage(
                        from,
                        {
                            text:
                                '╭━━〔 *ᴠɪᴅᴇᴏ ɴᴏᴛ ғᴏᴜɴᴅ* 〕━━╮\n' +
                                '┃ ❌ YouTube වීඩියෝවක් හමු වුණේ නැහැ.\n' +
                                '┃ ➜ නැවත `.video` යවලා උත්සාහ කරන්න.\n' +
                                '┣━━━━━━━━━━━━━━━━━━╯\n' +
                                FOOTER
                        },
                        { quoted: incoming }
                    );

                    continue;
                }

                await sendQualityMenu(
                    conn,
                    from,
                    incoming,
                    {
                        url: video.url,
                        title: video.title
                    }
                );

            } catch (error) {
                console.error(
                    '[VIDEO NAME SEARCH ERROR]',
                    error.stack || error.message
                );
            }
        }
    });
}

cmd({
    pattern: 'video',
    alias: ['ytmp4', 'ytvideo'],
    react: '🎬',
    desc: 'Search and download YouTube video by name',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    registerVideoNameListener(conn);

    const input = args.join(' ').trim();

    if (!input) {
        pendingVideoNames.set(from, true);

        return reply(
            '🎬 *THENUVA X MD VIDEO DOWNLOADER*\n\n' +
            '📥 භාවිතය: `.video video name`\n\n' +
            '🎵 උදාහරණය: `.video Sanda Mithuri`\n\n' +
            FOOTER
        );
    }

    try {
        await conn.sendMessage(from, {
            react: { text: '🔎', key: mek.key }
        });

        const video = isYouTubeUrl(input)
            ? { url: input, title: 'YouTube Video' }
            : (await yts(input))?.videos?.[0];

        if (!video?.url) {
            return reply(
                '╭━━〔 *ᴠɪᴅᴇᴏ ɴᴏᴛ ғᴏᴜɴᴅ* 〕━━╮\n' +
                '┃ ❌ ඒ නමට ගැළපෙන වීඩියෝවක් හමු වුණේ නැහැ.\n' +
                '┣━━━━━━━━━━━━━━━━━━╯\n' +
                FOOTER
            );
        }

        return sendQualityMenu(
            conn,
            from,
            mek,
            {
                url: video.url,
                title: video.title || 'YouTube Video'
            }
        );

    } catch (error) {
        console.error(
            '[VIDEO SEARCH ERROR]',
            error.stack || error.message
        );

        return reply(
            '╭━━〔 *sᴇᴀʀᴄʜ ғᴀɪʟᴇᴅ* 〕━━╮\n' +
            `┃ ❌ ${error.message}\n` +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );
    }
});

for (const quality of QUALITIES) {
    cmd({
        pattern: `ytquality_${quality}`,
        desc: `Download YouTube MP4 in ${quality}p`,
        category: 'download',
        filename: __filename
    }, async (conn, mek, m, { from, reply }) => {
        return downloadVideo(
            conn,
            mek,
            from,
            reply,
            quality
        );
    });
}
