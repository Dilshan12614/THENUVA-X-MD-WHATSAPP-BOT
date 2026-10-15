const { cmd } = require('../command');
const { sendListMenu } = require('../lib/buttons');
const yts = require('yt-search');

const fs = require('fs');
const os = require('os');
const path = require('path');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = 'ZSKNl5eniyeAPcPkf';

const API_URL =
    `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`;

const TIMEOUT = 300000;
const MAX_MEDIA_SIZE = 512 * 1024 * 1024;

const FOOTER =
    '> ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

const pendingVideos = new Map();
const pendingVideoNames = new Map();
const registeredVideoListeners = new WeakSet();

function isYouTubeUrl(value) {
    try {
        const url = new URL(value);

        return [
            'youtube.com',
            'www.youtube.com',
            'm.youtube.com',
            'youtu.be',
            'www.youtu.be'
        ].includes(url.hostname) &&
        ['http:', 'https:'].includes(url.protocol);
    } catch {
        return false;
    }
}

function findMediaUrl(data, mode) {
    const seen = new Set();
    const queue = Array.isArray(data) ? [...data] : [data];

    const keys = mode === 'mp3'
        ? [
            'audioUrl',
            'audio_url',
            'downloadUrl',
            'download_url',
            'url',
            'link'
        ]
        : [
            'downloadUrl',
            'download_url',
            'videoUrl',
            'video_url',
            'url',
            'link'
        ];

    while (queue.length) {
        const item = queue.shift();

        if (
            !item ||
            typeof item !== 'object' ||
            seen.has(item)
        ) {
            continue;
        }

        seen.add(item);

        const type = String(
            item.contentType ||
            item.mimeType ||
            item.mediaType ||
            ''
        ).toLowerCase();

        for (const key of keys) {
            const value = item[key];

            if (
                typeof value !== 'string' ||
                !/^https?:\/\//i.test(value)
            ) {
                continue;
            }

            const isAudio =
                /\.(mp3|m4a|aac|ogg|wav)(?:[?#]|$)/i.test(value) ||
                type.startsWith('audio/');

            const isVideo =
                /\.(mp4|m4v|webm|mov)(?:[?#]|$)/i.test(value) ||
                type.startsWith('video/');

            if (mode === 'mp3' && isAudio) {
                return value;
            }

            if (mode !== 'mp3' && isVideo) {
                return value;
            }
        }

        for (const value of Object.values(item)) {
            if (value && typeof value === 'object') {
                queue.push(value);
            }
        }
    }

    return null;
}

function findTitle(data) {
    const queue = Array.isArray(data) ? [...data] : [data];
    const seen = new Set();

    while (queue.length) {
        const item = queue.shift();

        if (
            !item ||
            typeof item !== 'object' ||
            seen.has(item)
        ) {
            continue;
        }

        seen.add(item);

        const title =
            item.title ||
            item.videoTitle ||
            item.name ||
            item.data?.title;

        if (
            typeof title === 'string' &&
            title.trim()
        ) {
            return title;
        }

        for (const value of Object.values(item)) {
            if (value && typeof value === 'object') {
                queue.push(value);
            }
        }
    }

    return 'YouTube Video';
}

function safeFileName(value) {
    return String(value)
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 100) || 'THENUVA-X-MD';
}

async function sendFormatMenu(conn, from, mek, url) {
    pendingVideos.set(from, url);

    return sendListMenu(
        conn,
        from,
        {
            title:
                '╭━━〔 *ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ* 〕━━╮\n' +
                '┃ 🎬 *SELECT FORMAT*\n' +
                '┣━━━━━━━━━━━━━━━━━━╯\n' +
                '┃\n' +
                '┃ 📥 *Download Options*\n' +
                '┃\n' +
                '┃ 🎵 Audio (MP3)\n' +
                '┃ ➜ Download audio only\n' +
                '┃\n' +
                '┃ 🎬 Video (Playable)\n' +
                '┃ ➜ MP4 playable video\n' +
                '┃\n' +
                '┃ 📁 Video Document\n' +
                '┃ ➜ MP4 as document\n' +
                '┣━━━━━━━━━━━━━━━━━━╯',

            buttonText: 'Select',
            footer: FOOTER,

            sections: [
                {
                    title: '📥 Download Options',
                    rows: [
                        {
                            id: 'ytformat_mp3',
                            title: '🎵 Audio (MP3)',
                            description: 'Download audio only'
                        },
                        {
                            id: 'ytformat_mp4',
                            title: '🎬 Video (Playable)',
                            description: 'MP4 playable video'
                        },
                        {
                            id: 'ytformat_doc',
                            title: '📁 Video Document',
                            description: 'MP4 as document'
                        }
                    ]
                }
            ]
        },
        mek
    );
}

async function downloadSelected(
    conn,
    mek,
    from,
    reply,
    mode
) {
    let tempDir;

    try {
        const input = pendingVideos.get(from);

        if (!input) {
            return reply(
                '╭━━〔 *ɴᴏ ᴠɪᴅᴇᴏ sᴇʟᴇᴄᴛᴇᴅ* 〕━━╮\n' +
                '┃ ❌ මුලින් `.video` යවලා වීඩියෝවක් තෝරන්න.\n' +
                '┣━━━━━━━━━━━━━━━━━━╯\n' +
                FOOTER
            );
        }

        if (!APIFY_TOKEN) {
            return reply(
                '╭━━〔 *ᴀᴘɪ ᴄᴏɴғɪɢ* 〕━━╮\n' +
                '┃ ❌ GitHub Secrets වල APIFY_TOKEN සකස් කරන්න.\n' +
                '┣━━━━━━━━━━━━━━━━━━╯\n' +
                FOOTER
            );
        }

        await conn.sendMessage(from, {
            react: {
                text: '⏳',
                key: mek.key
            }
        });

        const formatName = mode === 'mp3'
            ? 'Audio (MP3)'
            : mode === 'doc'
                ? 'Video Document'
                : 'Video (Playable)';

        await reply(
            '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━╮\n' +
            '┃ ⏳ *ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...*\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            `┃ 📌 Format: ${formatName}\n` +
            '┃ 📥 Large file support enabled\n' +
            '┃ ➜ Please wait...\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );

        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${APIFY_TOKEN}`,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                urls: [{ url: input }],
                quality: '720',
                format: mode === 'mp3' ? 'mp3' : 'default',
                residentialProxyMode: 'fallback',
                proxyCountry: ''
            }),
            signal: AbortSignal.timeout(TIMEOUT)
        });

        const responseText = await apiResponse.text();

        if (!apiResponse.ok) {
            console.error(
                '[APIFY VIDEO] HTTP:',
                apiResponse.status
            );

            console.error(
                '[APIFY VIDEO] Error:',
                responseText.slice(0, 1000)
            );

            throw new Error(
                `Apify API HTTP ${apiResponse.status}`
            );
        }

        let result;

        try {
            result = JSON.parse(responseText);
        } catch {
            throw new Error('Apify returned invalid JSON');
        }

        const failedItem = Array.isArray(result)
            ? result.find(item =>
                item?.status === 'failed' || item?.error
            )
            : null;

        if (failedItem) {
            console.error(
                '[APIFY ACTOR FAILED]',
                JSON.stringify({
                    errorCode: failedItem.errorCode,
                    error: failedItem.error,
                    quality: failedItem.quality
                })
            );

            throw new Error(
                failedItem.errorCode ||
                failedItem.error ||
                'Apify download failed'
            );
        }

        const mediaUrl = findMediaUrl(result, mode);

        if (!mediaUrl) {
            console.error(
                '[APIFY VIDEO] Output:',
                JSON.stringify(result).slice(0, 2000)
            );

            throw new Error(
                `Actor output එකේ ${
                    mode === 'mp3' ? 'MP3' : 'MP4'
                } download URL එක හමු වුණේ නැහැ`
            );
        }

        const mediaResponse = await fetch(mediaUrl, {
            headers: {
                Accept:
                    'video/*, audio/*, application/octet-stream'
            },
            signal: AbortSignal.timeout(TIMEOUT)
        });

        if (!mediaResponse.ok) {
            throw new Error(
                `Media download HTTP ${mediaResponse.status}`
            );
        }

        const contentType = (
            mediaResponse.headers.get('content-type') || ''
        ).toLowerCase();

        if (
            mode === 'mp3'
                ? !contentType.includes('audio/') &&
                  !contentType.includes('application/octet-stream')
                : !contentType.includes('video/') &&
                  !contentType.includes('application/octet-stream')
        ) {
            throw new Error(
                `Invalid media content type: ${
                    contentType || 'unknown'
                }`
            );
        }

        const declaredSize = Number(
            mediaResponse.headers.get('content-length') || 0
        );

        if (declaredSize > MAX_MEDIA_SIZE) {
            throw new Error('FILE_TOO_LARGE');
        }

        if (!mediaResponse.body) {
            throw new Error('Media response has no data stream');
        }

        tempDir = await fs.promises.mkdtemp(
            path.join(os.tmpdir(), 'thenuva-video-')
        );

        const extension = mode === 'mp3' ? 'mp3' : 'mp4';
        const tempFile = path.join(
            tempDir,
            `download.${extension}`
        );

        let downloadedSize = 0;

        const source = Readable.fromWeb(mediaResponse.body);

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
            throw new Error('Downloaded file is empty');
        }

        if (fileInfo.size > MAX_MEDIA_SIZE) {
            throw new Error('FILE_TOO_LARGE');
        }

        const title = safeFileName(findTitle(result));

        const caption =
            '╭━━〔 *ᴅᴏᴡɴʟᴏᴀᴅ sᴜᴄᴄᴇss* 〕━━╮\n' +
            `┃ 📌 *${title}*\n` +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            `┃ 🎞️ Format: ${formatName}\n` +
            `┃ 📦 Size: ${(fileInfo.size / (1024 * 1024)).toFixed(1)} MB\n` +
            '┃ ✅ Status: Success\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER;

        if (mode === 'mp3') {
            await conn.sendMessage(
                from,
                {
                    audio: { url: tempFile },
                    mimetype: 'audio/mpeg',
                    fileName: `${title}.mp3`,
                    ptt: false
                },
                { quoted: mek }
            );
        } else if (mode === 'doc') {
            await conn.sendMessage(
                from,
                {
                    document: { url: tempFile },
                    mimetype: 'video/mp4',
                    fileName: `${title}.mp4`,
                    caption
                },
                { quoted: mek }
            );
        } else {
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
        }

        pendingVideos.delete(from);

        await conn.sendMessage(from, {
            react: {
                text: '✅',
                key: mek.key
            }
        });

    } catch (error) {
        console.error(
            '[APIFY DOWNLOAD ERROR]',
            error.stack || error.message
        );

        await conn.sendMessage(from, {
            react: {
                text: '❌',
                key: mek.key
            }
        }).catch(() => {});

        let errorMessage = error.message;

        if (error.message === 'FILE_TOO_LARGE') {
            errorMessage =
                'වීඩියෝව 512 MB සීමාව ඉක්මවයි. කුඩා quality එකක් උත්සාහ කරන්න.';
        } else if (
            error.message === 'LOGIN_REQUIRED' ||
            error.message === 'HTTP_403'
        ) {
            errorMessage =
                'YouTube download එක ප්‍රතික්ෂේප කළා. Apify account එකේ Residential Proxy access සක්‍රීයද බලන්න.';
        } else if (
            /proxy|residential/i.test(error.message)
        ) {
            errorMessage =
                'Apify Proxy access එක පරීක්ෂා කරන්න. Residential Proxy සඳහා අමතර access හෝ credits අවශ්‍ය විය හැකියි.';
        }

        return reply(
            '╭━━〔 *ᴅᴏᴡɴʟᴏᴀᴅ ғᴀɪʟᴇᴅ* 〕━━╮\n' +
            `┃ ❌ ${errorMessage}\n` +
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
                    react: {
                        text: '🔎',
                        key: incoming.key
                    }
                });

                const search = await yts(text);
                const video = search?.videos?.[0];

                if (!video?.url) {
                    await conn.sendMessage(
                        from,
                        {
                            text:
                                '╭━━〔 *ᴠɪᴅᴇᴏ ɴᴏᴛ ғᴏᴜɴᴅ* 〕━━╮\n' +
                                '┃ ❌ ඒ නමට ගැළපෙන YouTube වීඩියෝවක් හමු වුණේ නැහැ.\n' +
                                '┃ ➜ නැවත `.video` යවලා උත්සාහ කරන්න.\n' +
                                '┣━━━━━━━━━━━━━━━━━━╯\n' +
                                FOOTER
                        },
                        { quoted: incoming }
                    );

                    continue;
                }

                await sendFormatMenu(
                    conn,
                    from,
                    incoming,
                    video.url
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
            react: {
                text: '🔎',
                key: mek.key
            }
        });

        const video = isYouTubeUrl(input)
            ? { url: input }
            : (await yts(input))?.videos?.[0];

        if (!video?.url) {
            return reply(
                '╭━━〔 *ᴠɪᴅᴇᴏ ɴᴏᴛ ғᴏᴜɴᴅ* 〕━━╮\n' +
                '┃ ❌ ඒ නමට ගැළපෙන YouTube වීඩියෝවක් හමු වුණේ නැහැ.\n' +
                '┣━━━━━━━━━━━━━━━━━━╯\n' +
                FOOTER
            );
        }

        return sendFormatMenu(
            conn,
            from,
            mek,
            video.url
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

cmd({
    pattern: 'ytformat_mp3',
    desc: 'Download selected MP3 format',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    return downloadSelected(
        conn, mek, from, reply, 'mp3'
    );
});

cmd({
    pattern: 'ytformat_mp4',
    desc: 'Download selected playable MP4',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    return downloadSelected(
        conn, mek, from, reply, 'mp4'
    );
});

cmd({
    pattern: 'ytformat_doc',
    desc: 'Download selected MP4 document',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    return downloadSelected(
        conn, mek, from, reply, 'doc'
    );
});
