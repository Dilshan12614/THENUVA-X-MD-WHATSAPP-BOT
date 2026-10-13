const { cmd } = require('../command');
const { sendListMenu } = require('../lib/buttons');

const https = require('https');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const ACTOR_ID = 'ZSKNl5eniyeAPcPkf';
const APIFY_TOKEN = process.env.APIFY_TOKEN;

const API_URL =
    `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`;

const MAX_FILE_SIZE = 64 * 1024 * 1024;
const TIMEOUT = 300000;

const FOOTER =
    'ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

const pendingVideos = new Map();
const activeDownloads = new Set();

function safeFileName(name) {
    return String(name || 'THENUVA_X_MD')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100) || 'THENUVA_X_MD';
}

function isValidHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
}

function requestJson(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const transport = parsed.protocol === 'http:' ? http : https;

        const request = transport.request(parsed, {
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: TIMEOUT
        }, (response) => {
            let data = '';

            response.setEncoding('utf8');

            response.on('data', chunk => {
                data += chunk;

                if (data.length > 5 * 1024 * 1024) {
                    request.destroy(
                        new Error('API response is too large')
                    );
                }
            });

            response.on('end', () => {
                if (
                    response.statusCode < 200 ||
                    response.statusCode >= 300
                ) {
                    return reject(
                        new Error(
                            `API returned HTTP ${response.statusCode}: ` +
                            data.slice(0, 300)
                        )
                    );
                }

                try {
                    resolve(JSON.parse(data));
                } catch {
                    reject(
                        new Error('API returned invalid JSON')
                    );
                }
            });
        });

        request.on('timeout', () => {
            request.destroy(new Error('API request timed out'));
        });

        request.on('error', reject);
        request.end();
    });
}

function downloadFile(url, destination, maxBytes = MAX_FILE_SIZE) {
    return new Promise((resolve, reject) => {
        if (!isValidHttpUrl(url)) {
            return reject(new Error('Invalid download URL'));
        }

        const parsed = new URL(url);
        const transport = parsed.protocol === 'http:' ? http : https;

        const request = transport.get(parsed, {
            headers: {
                'User-Agent': 'Mozilla/5.0 THENUVA-X-MD'
            },
            timeout: TIMEOUT
        }, (response) => {
            if (
                response.statusCode >= 300 &&
                response.statusCode < 400 &&
                response.headers.location
            ) {
                response.resume();

                const redirected = new URL(
                    response.headers.location,
                    parsed
                ).toString();

                return downloadFile(
                    redirected,
                    destination,
                    maxBytes
                ).then(resolve).catch(reject);
            }

            if (response.statusCode !== 200) {
                response.resume();
                return reject(
                    new Error(
                        `Download failed: HTTP ${response.statusCode}`
                    )
                );
            }

            const contentType = String(
                response.headers['content-type'] || ''
            ).toLowerCase();

            if (
                contentType.includes('text/html') ||
                contentType.includes('application/json')
            ) {
                response.resume();
                return reject(
                    new Error(
                        `Server returned ${contentType}, not a media file`
                    )
                );
            }

            const declaredSize = Number(
                response.headers['content-length'] || 0
            );

            if (declaredSize > maxBytes) {
                response.destroy();
                return reject(
                    new Error('File exceeds the 64 MB limit')
                );
            }

            let total = 0;
            const output = fs.createWriteStream(destination);

            response.on('data', chunk => {
                total += chunk.length;

                if (total > maxBytes) {
                    response.destroy(
                        new Error('File exceeds the 64 MB limit')
                    );
                    output.destroy(
                        new Error('File exceeds the 64 MB limit')
                    );
                }
            });

            response.on('error', error => {
                output.destroy();
                reject(error);
            });

            output.on('error', reject);

            output.on('finish', () => {
                const buffer = Buffer.alloc(16);
                const fd = fs.openSync(destination, 'r');

                try {
                    fs.readSync(fd, buffer, 0, 16, 0);
                } finally {
                    fs.closeSync(fd);
                }

                const signature = buffer.toString('hex');

                if (
                    contentType.includes('text/') ||
                    signature.startsWith('3c68746d6c') ||
                    signature.startsWith('7b226572726f72')
                ) {
                    fs.unlink(destination, () => {});
                    return reject(
                        new Error('Downloaded content is not a media file')
                    );
                }

                resolve({
                    path: destination,
                    size: total,
                    contentType
                });
            });

            response.pipe(output);
        });

        request.setTimeout(TIMEOUT, () => {
            request.destroy(new Error('Download timed out'));
        });

        request.on('error', reject);
    });
}

function findMediaUrl(item, format) {
    if (!item || typeof item !== 'object') return '';

    const candidates = [
        item.downloadUrl,
        item.download_url,
        item.url,
        item.videoUrl,
        item.video_url,
        item.audioUrl,
        item.audio_url,
        item.mp4,
        item.mp3,
        item.fileUrl,
        item.file_url,
        item.download,
        item.result?.url,
        item.result?.downloadUrl,
        item.data?.url,
        item.data?.downloadUrl
    ];

    for (const candidate of candidates) {
        if (typeof candidate === 'string' && isValidHttpUrl(candidate)) {
            return candidate;
        }
    }

    const links = item.links;

    if (links && typeof links === 'object') {
        const keys = format === 'mp3'
            ? ['mp3', 'audio', 'm4a', 'download']
            : ['mp4', 'video', 'download'];

        for (const key of keys) {
            const candidate = links[key];

            if (
                typeof candidate === 'string' &&
                isValidHttpUrl(candidate)
            ) {
                return candidate;
            }

            if (
                candidate &&
                typeof candidate.url === 'string' &&
                isValidHttpUrl(candidate.url)
            ) {
                return candidate.url;
            }
        }
    }

    return '';
}

function findTitle(item) {
    return (
        item?.title ||
        item?.videoTitle ||
        item?.video_title ||
        item?.name ||
        item?.data?.title ||
        'THENUVA X MD Download'
    );
}

async function getApifyResult(videoUrl, format) {
    if (!APIFY_TOKEN) {
        throw new Error(
            'APIFY_TOKEN is missing. Add it to Railway Variables.'
        );
    }

    const endpoint = new URL(API_URL);
    endpoint.searchParams.set('token', APIFY_TOKEN);
    endpoint.searchParams.set('timeout', '300');
    endpoint.searchParams.set('memory', '1024');

    const payload = {
        url: videoUrl,
        videoUrl,
        format,
        quality: '720p'
    };

    console.log(`[VIDEO] Starting Apify job (${format})`);

    const result = await requestJson(endpoint.toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    // If the endpoint expects JSON in the POST body,
    // use the requestJsonWithBody helper below instead.
    return result;
}

async function runApify(videoUrl, format) {
    if (!APIFY_TOKEN) {
        throw new Error(
            'APIFY_TOKEN is missing. Add it to Railway Variables.'
        );
    }

    const endpoint = new URL(API_URL);
    endpoint.searchParams.set('token', APIFY_TOKEN);
    endpoint.searchParams.set('timeout', '300');
    endpoint.searchParams.set('memory', '1024');

    const body = JSON.stringify({
        url: videoUrl,
        videoUrl,
        format,
        quality: '720p'
    });

    const result = await new Promise((resolve, reject) => {
        const request = https.request(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                'Accept': 'application/json'
            },
            timeout: TIMEOUT
        }, response => {
            let data = '';

            response.setEncoding('utf8');
            response.on('data', chunk => {
                data += chunk;
            });

            response.on('end', () => {
                if (
                    response.statusCode < 200 ||
                    response.statusCode >= 300
                ) {
                    return reject(
                        new Error(
                            `Apify HTTP ${response.statusCode}: ` +
                            data.slice(0, 300)
                        )
                    );
                }

                try {
                    resolve(JSON.parse(data));
                } catch {
                    reject(
                        new Error('Apify returned invalid JSON')
                    );
                }
            });
        });

        request.on('timeout', () => {
            request.destroy(new Error('Apify request timed out'));
        });

        request.on('error', reject);
        request.write(body);
        request.end();
    });

    const item = Array.isArray(result) ? result[0] : result;

    if (!item) {
        throw new Error('Apify returned no download result');
    }

    const mediaUrl = findMediaUrl(item, format);

    if (!mediaUrl) {
        console.error(
            '[VIDEO] Apify response keys:',
            Object.keys(item)
        );

        throw new Error(
            'Apify response did not contain a usable media URL'
        );
    }

    return {
        url: mediaUrl,
        title: findTitle(item),
        thumbnail:
            item.thumbnail ||
            item.thumbnailUrl ||
            item.data?.thumbnail ||
            null
    };
}

async function sendDownloadedFile({
    conn,
    from,
    mek,
    videoUrl,
    format
}) {
    const download = await runApify(videoUrl, format);

    const extension = format === 'mp3' ? '.mp3' : '.mp4';
    const tempFile = path.join(
        os.tmpdir(),
        `thenuva_${crypto.randomBytes(8).toString('hex')}${extension}`
    );

    try {
        const file = await downloadFile(
            download.url,
            tempFile,
            MAX_FILE_SIZE
        );

        const title = safeFileName(download.title);

        console.log(
            `[VIDEO] Downloaded ${format}: ${file.size} bytes`
        );

        if (format === 'mp3') {
            await conn.sendMessage(from, {
                audio: { url: file.path },
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`,
                ptt: false
            }, { quoted: mek });
        } else if (format === 'mp4') {
            await conn.sendMessage(from, {
                video: { url: file.path },
                mimetype: 'video/mp4',
                fileName: `${title}.mp4`,
                caption: `🎬 *${title}*\n\n${FOOTER}`
            }, { quoted: mek });
        } else if (format === 'document') {
            await conn.sendMessage(from, {
                document: { url: file.path },
                mimetype: 'video/mp4',
                fileName: `${title}.mp4`,
                caption: `📄 *${title}*\n\n${FOOTER}`
            }, { quoted: mek });
        }
    } finally {
        fs.unlink(tempFile, error => {
            if (error && error.code !== 'ENOENT') {
                console.error('[VIDEO] Temp cleanup:', error.message);
            }
        });
    }
}

cmd({
    pattern: 'video',
    alias: ['ytmp4', 'ytvideo'],
    react: '🎬',
    desc: 'Download YouTube video, audio, or document',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, args, q, reply }) => {
    try {
        const videoUrl = (q || args.join(' ')).trim();

        if (!videoUrl) {
            return reply(
                '❌ YouTube video URL එකක් දෙන්න.\n\n' +
                'උදාහරණය: .video https://youtube.com/watch?v=...'
            );
        }

        if (!isValidHttpUrl(videoUrl)) {
            return reply('❌ Valid video URL එකක් දෙන්න.');
        }

        if (activeDownloads.has(from)) {
            return reply(
                '⏳ මේ chat එකේ download එකක් දැනටමත් ක්‍රියාත්මකයි.'
            );
        }

        pendingVideos.set(from, {
            url: videoUrl,
            timestamp: Date.now()
        });

        await sendListMenu(conn, from, {
            title: 'ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴠɪᴅᴇᴏ ᴅᴏᴡɴʟᴏᴀᴅ',
            text: 'ඔයාට අවශ්‍ය format එක තෝරන්න.',
            buttonText: 'Select',
            footer: FOOTER,
            sections: [{
                title: 'DOWNLOAD FORMAT',
                rows: [
                    {
                        title: '🎵 MP3 Audio',
                        description: 'Audio file එක download කරන්න',
                        id: 'ytformat_mp3'
                    },
                    {
                        title: '🎬 MP4 Video',
                        description: 'Video එකක් ලෙස යවන්න',
                        id: 'ytformat_mp4'
                    },
                    {
                        title: '📄 MP4 Document',
                        description: 'MP4 එක document එකක් ලෙස යවන්න',
                        id: 'ytformat_doc'
                    }
                ]
            }]
        }, mek);
    } catch (error) {
        console.error('[VIDEO MENU ERROR]', error);
        reply(`❌ Menu error: ${error.message}`);
    }
});

async function handleVideoFormat(conn, mek, from, format) {
    const pending = pendingVideos.get(from);

    if (!pending || Date.now() - pending.timestamp > 10 * 60 * 1000) {
        pendingVideos.delete(from);

        return conn.sendMessage(from, {
            text:
                '⌛ Video URL එක කල් ඉකුත් වෙලා.\n' +
                'ආයෙත් `.video URL` යවලා format එක තෝරන්න.'
        }, { quoted: mek });
    }

    if (activeDownloads.has(from)) {
        return conn.sendMessage(from, {
            text: '⏳ Download එකක් දැනටමත් ක්‍රියාත්මකයි.'
        }, { quoted: mek });
    }

    activeDownloads.add(from);

    const formatName = {
        mp3: 'MP3 Audio',
        mp4: 'MP4 Video',
        document: 'MP4 Document'
    }[format];

    try {
        await conn.sendMessage(from, {
            text: `⏳ *${formatName}* download කරමින්...`
        }, { quoted: mek });

        await sendDownloadedFile({
            conn,
            from,
            mek,
            videoUrl: pending.url,
            format
        });

        pendingVideos.delete(from);
    } catch (error) {
        console.error(`[VIDEO ${format.toUpperCase()} ERROR]`, error);

        await conn.sendMessage(from, {
            text:
                `❌ ${formatName} download එක අසාර්ථකයි.\n\n` +
                `${error.message}\n\n` +
                'Railway Variables වල APIFY_TOKEN එක සහ Apify actor output එක පරීක්ෂා කරන්න.'
        }, { quoted: mek });
    } finally {
        activeDownloads.delete(from);
    }
}

cmd({
    pattern: 'ytformat_mp3',
    desc: 'Download video as MP3',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from }) => {
    await handleVideoFormat(conn, mek, from, 'mp3');
});

cmd({
    pattern: 'ytformat_mp4',
    desc: 'Download video as MP4',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from }) => {
    await handleVideoFormat(conn, mek, from, 'mp4');
});

cmd({
    pattern: 'ytformat_doc',
    desc: 'Send MP4 as document',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from }) => {
    await handleVideoFormat(conn, mek, from, 'document');
});
