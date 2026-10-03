const { cmd } = require('../command');

const API_URL = 'https://supunofc.site/api/download/ytmp4-down';

// API key එක Railway Variables / GitHub Secrets වලින් ගන්න
const API_KEY = process.env.YT_API_KEY || 'supun-y3t6k5ig8pdgv32j8z50usxq';

const PREFERRED_QUALITY = ['720p', '480p', '360p', '240p'];

function isYouTubeUrl(url) {
    try {
        const u = new URL(url);

        return (
            u.hostname === 'youtube.com' ||
            u.hostname === 'www.youtube.com' ||
            u.hostname === 'youtu.be' ||
            u.hostname === 'www.youtu.be' ||
            u.hostname.endsWith('.youtube.com')
        );
    } catch {
        return false;
    }
}

function cleanUrl(text) {
    if (!text) return null;

    const match = text.match(
        /https?:\/\/(?:www\.)?(?:youtube\.com\/\S+|youtu\.be\/\S+)/i
    );

    return match ? match[0].replace(/[)>.,]+$/, '') : null;
}

function formatSize(bytes) {
    if (!bytes || isNaN(bytes)) return 'Unknown';

    const mb = bytes / 1024 / 1024;

    if (mb >= 1024) {
        return `${(mb / 1024).toFixed(2)} GB`;
    }

    return `${mb.toFixed(2)} MB`;
}

async function fetchBuffer(url, headers = {}) {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
            Accept: 'video/mp4,application/json,*/*',
            ...headers
        },
        redirect: 'follow'
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const contentType =
        response.headers.get('content-type') || '';

    const buffer = Buffer.from(await response.arrayBuffer());

    return {
        buffer,
        contentType,
        response
    };
}

async function getApiResult(youtubeUrl, stream = false, quality = '') {
    if (!API_KEY) {
        throw new Error(
            'YT_API_KEY is missing. Add YT_API_KEY to Railway Variables.'
        );
    }

    const params = new URLSearchParams();

    params.set('url', youtubeUrl);
    params.set('apikey', API_KEY);

    if (stream) {
        params.set('stream', 'true');
    }

    if (quality) {
        params.set('quality', quality.replace('p', ''));
    }

    const endpoint = `${API_URL}?${params.toString()}`;

    console.log(
        `[YTMP4] Request: ${API_URL}?url=...&apikey=***${stream ? '&stream=true' : ''}`
    );

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
            Accept: 'video/mp4,application/json,*/*'
        },
        redirect: 'follow'
    });

    const contentType =
        response.headers.get('content-type') || '';

    const raw = Buffer.from(await response.arrayBuffer());

    return {
        response,
        contentType,
        raw
    };
}

async function tryStreamMode(youtubeUrl) {
    console.log('[YTMP4] Trying API stream mode...');

    try {
        const result = await getApiResult(
            youtubeUrl,
            true,
            '720p'
        );

        const contentType =
            result.contentType.toLowerCase();

        // API directly returned MP4
        if (
            contentType.includes('video/mp4') ||
            contentType.includes('video/') ||
            result.raw.slice(4, 8).toString() === 'ftyp'
        ) {
            console.log(
                `[YTMP4] Stream received: ${formatSize(result.raw.length)}`
            );

            return {
                buffer: result.raw,
                quality: '720p'
            };
        }

        // Maybe API returned JSON
        try {
            const json = JSON.parse(result.raw.toString());

            if (json && json.success === false) {
                console.log(
                    '[YTMP4] Stream mode rejected:',
                    json.message || 'Unknown API error'
                );
            }
        } catch {
            // Not JSON, ignore
        }

        return null;
    } catch (error) {
        console.log(
            '[YTMP4] Stream mode failed:',
            error.message
        );

        return null;
    }
}

async function getDownloadList(youtubeUrl) {
    const result = await getApiResult(youtubeUrl);

    let json;

    try {
        json = JSON.parse(result.raw.toString());
    } catch {
        throw new Error(
            'API returned an invalid response.'
        );
    }

    if (!json.success) {
        throw new Error(
            json.message ||
            json.error ||
            'API request failed.'
        );
    }

    if (!Array.isArray(json.result)) {
        throw new Error(
            'API did not return download results.'
        );
    }

    return json.result;
}

function selectQuality(results) {
    for (const wanted of PREFERRED_QUALITY) {
        const found = results.find(
            item =>
                String(item.resolution).toLowerCase() ===
                wanted.toLowerCase() &&
                item.downloadUrl
        );

        if (found) {
            return found;
        }
    }

    // fallback: first usable result
    return results.find(item => item.downloadUrl);
}

async function downloadFromUrl(downloadUrl) {
    console.log(
        '[YTMP4] Downloading returned media URL...'
    );

    const result = await fetchBuffer(downloadUrl, {
        Referer: 'https://www.youtube.com/',
        Origin: 'https://www.youtube.com/'
    });

    if (!result.buffer || result.buffer.length < 1000) {
        throw new Error('Downloaded file is empty.');
    }

    return result.buffer;
}

cmd(
    {
        pattern: 'video',
        alias: ['ytmp4', 'playvideo'],
        react: '🎬',
        desc: 'Download YouTube video as MP4',
        category: 'download',
        filename: __filename
    },
    async (
        conn,
        mek,
        m,
        {
            from,
            quoted,
            body,
            isCmd,
            command,
            args,
            reply
        }
    ) => {
        try {
            const input =
                args && args.length
                    ? args.join(' ').trim()
                    : body
                        ? body.replace(
                              /^\.?(video|ytmp4|playvideo)\s*/i,
                              ''
                          ).trim()
                        : '';

            const youtubeUrl = cleanUrl(input);

            if (!youtubeUrl || !isYouTubeUrl(youtubeUrl)) {
                return reply(
                    '❌ *Invalid YouTube URL*\n\n' +
                    'Example:\n' +
                    '`.video https://youtu.be/VIDEO_ID`'
                );
            }

            if (!API_KEY) {
                return reply(
                    '❌ *YT API key is not configured.*\n\n' +
                    'Add `YT_API_KEY` to Railway Variables.'
                );
            }

            await reply(
                '⏳ *YOUTUBE VIDEO*\n\n' +
                '🔎 Searching video...\n' +
                '▰▱▱▱▱ 20%'
            );

            /*
             * STEP 1
             * Try provider stream mode.
             *
             * If Supun API supports:
             * &stream=true
             *
             * the API can return MP4 directly and we don't
             * need to fetch the temporary googlevideo URL.
             */
            const streamResult =
                await tryStreamMode(youtubeUrl);

            if (streamResult) {
                await reply(
                    '⬇️ *Downloading...*\n\n' +
                    `🎞️ Quality: ${streamResult.quality}\n` +
                    `📦 Size: ${formatSize(streamResult.buffer.length)}\n` +
                    '▰▰▰▰▰ 100%'
                );

                await conn.sendMessage(
                    from,
                    {
                        video: streamResult.buffer,
                        mimetype: 'video/mp4',
                        fileName: `THENUVA-X-MD-${Date.now()}.mp4`,
                        caption:
                            '🎬 *THENUVA X MD*\n\n' +
                            '✅ YouTube video downloaded\n' +
                            `🎞️ Quality: ${streamResult.quality}`
                    },
                    {
                        quoted: mek
                    }
                );

                return;
            }

            /*
             * STEP 2
             * Normal JSON API mode.
             */
            await reply(
                '🔍 *Video found*\n\n' +
                '⚙️ Preparing download...\n' +
                '▰▰▱▱▱ 40%'
            );

            const results =
                await getDownloadList(youtubeUrl);

            const selected =
                selectQuality(results);

            if (!selected) {
                return reply(
                    '❌ *No downloadable MP4 quality found.*'
                );
            }

            console.log(
                `[YTMP4] Selected: ${selected.resolution} | ${selected.size || 'Unknown'}`
            );

            await reply(
                '🎞️ *VIDEO READY*\n\n' +
                `🎯 Quality: *${selected.resolution}*\n` +
                `📦 Size: *${selected.size || 'Unknown'}*\n\n` +
                '⬇️ Downloading...\n' +
                '▰▰▰▱▱ 60%'
            );

            /*
             * STEP 3
             * Fetch temporary download URL.
             */
            let videoBuffer;

            try {
                videoBuffer =
                    await downloadFromUrl(
                        selected.downloadUrl
                    );
            } catch (error) {
                console.log(
                    '[YTMP4] Primary download failed:',
                    error.message
                );

                /*
                 * Try another quality.
                 * This is useful when one returned URL
                 * becomes unavailable.
                 */
                for (const quality of PREFERRED_QUALITY) {
                    if (
                        quality === selected.resolution
                    ) {
                        continue;
                    }

                    const alternative =
                        results.find(
                            item =>
                                String(
                                    item.resolution
                                ).toLowerCase() ===
                                    quality.toLowerCase() &&
                                item.downloadUrl
                        );

                    if (!alternative) {
                        continue;
                    }

                    try {
                        console.log(
                            `[YTMP4] Trying fallback: ${quality}`
                        );

                        videoBuffer =
                            await downloadFromUrl(
                                alternative.downloadUrl
                            );

                        if (videoBuffer) {
                            selected.resolution =
                                alternative.resolution;
                            selected.size =
                                alternative.size;

                            break;
                        }
                    } catch (fallbackError) {
                        console.log(
                            `[YTMP4] ${quality} failed:`,
                            fallbackError.message
                        );
                    }
                }
            }

            if (
                !videoBuffer ||
                videoBuffer.length < 1000
            ) {
                return reply(
                    '❌ *VIDEO DOWNLOAD FAILED*\n\n' +
                    'The API successfully returned the video information, ' +
                    'but the temporary media server rejected the download (HTTP 403).\n\n' +
                    'The bot code cannot fix an expired/IP-restricted media URL. ' +
                    'The API provider needs to support direct stream/proxy download for this endpoint.'
                );
            }

            /*
             * STEP 4
             * Send MP4 to WhatsApp.
             */
            await reply(
                '📤 *Sending video to WhatsApp...*\n\n' +
                '▰▰▰▰▱ 90%'
            );

            await conn.sendMessage(
                from,
                {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    fileName:
                        `THENUVA-X-MD-${Date.now()}.mp4`,
                    caption:
                        '╭──────────●●►\n' +
                        '│ 🎬 *THENUVA X MD*\n' +
                        '│\n' +
                        `│ 🎞️ Quality: ${selected.resolution}\n` +
                        `│ 📦 Size: ${selected.size || formatSize(videoBuffer.length)}\n` +
                        '│ ✅ Download Complete\n' +
                        '╰──────────●●►'
                },
                {
                    quoted: mek
                }
            );

            console.log(
                `[YTMP4] Sent successfully: ${selected.resolution}`
            );
        } catch (error) {
            console.error(
                '[YTMP4 ERROR]',
                error
            );

            return reply(
                '❌ *YTMP4 ERROR*\n\n' +
                `${error.message || 'Unknown error'}`
            );
        }
    }
);
