const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');

const { cmd } = require('../command');
const config = require('../config');
const { sendListMenu } = require('../lib/buttons');

const execFileAsync = promisify(execFile);

const API_BASE =
    'https://mr-thinuzz-api-build.vercel.app';

const API_KEY =
    config.MR_THINUZZ_API_KEY ||
    process.env.MR_THINUZZ_API_KEY ||
    '';

/*
|--------------------------------------------------------------------------
| YouTube URL
|--------------------------------------------------------------------------
*/

function isYouTubeUrl(url) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(
        String(url || '')
    );
}

/*
|--------------------------------------------------------------------------
| File Name
|--------------------------------------------------------------------------
*/

function cleanFileName(name) {
    return String(name || 'THENUVA X MD VIDEO')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80);
}

/*
|--------------------------------------------------------------------------
| API Helpers
|--------------------------------------------------------------------------
*/

function getTitle(api) {
    return (
        api?.data?.title ||
        api?.title ||
        'THENUVA X MD VIDEO'
    );
}

function getThumbnail(api) {
    return (
        api?.data?.thumbnail ||
        api?.thumbnail ||
        null
    );
}

function getQualities(api) {
    const qualities =
        api?.data?.all_qualities;

    if (!Array.isArray(qualities)) {
        return [];
    }

    const seen = new Set();

    return qualities
        .filter(item => {
            if (
                !item ||
                !item.quality ||
                !item.downloadUrl
            ) {
                return false;
            }

            if (
                !/^https?:\/\//i.test(
                    item.downloadUrl
                )
            ) {
                return false;
            }

            const quality =
                String(item.quality)
                    .replace(/p$/i, '');

            if (seen.has(quality)) {
                return false;
            }

            seen.add(quality);

            return true;
        })
        .map(item => ({
            quality:
                String(item.quality)
                    .replace(/p$/i, ''),

            downloadUrl:
                item.downloadUrl
        }))
        .sort(
            (a, b) =>
                Number(b.quality) -
                Number(a.quality)
        );
}

function findQuality(api, quality) {
    return getQualities(api).find(
        item =>
            String(item.quality) ===
            String(quality)
    );
}

/*
|--------------------------------------------------------------------------
| API Request
|--------------------------------------------------------------------------
*/

async function requestVideo(url) {
    if (!API_KEY) {
        throw new Error(
            'MR_THINUZZ_API_KEY is missing'
        );
    }

    const endpoint =
        `${API_BASE}/api/ytmp4v2/download`;

    console.log('[VIDEO API]', endpoint);
    console.log('[VIDEO URL]', url);

    const response =
        await axios.get(
            endpoint,
            {
                params: {
                    url,
                    apiKey: API_KEY
                },

                headers: {
                    Accept:
                        'application/json',

                    'User-Agent':
                        'Mozilla/5.0'
                },

                timeout: 60000,

                maxContentLength:
                    Infinity,

                maxBodyLength:
                    Infinity
            }
        );

    if (!response.data) {
        throw new Error(
            'API response එක empty.'
        );
    }

    console.log(
        '[VIDEO API STATUS]',
        response.status
    );

    if (
        response.data?.status === false
    ) {
        throw new Error(
            response.data?.message ||
            response.data?.error ||
            'Video API failed'
        );
    }

    if (
        !response.data?.data
    ) {
        throw new Error(
            'API response එකේ data නැහැ.'
        );
    }

    return response.data;
}

/*
|--------------------------------------------------------------------------
| Temporary Directory
|--------------------------------------------------------------------------
*/

function createTempDir() {
    const dir =
        path.join(
            os.tmpdir(),
            `thenuva-video-${crypto
                .randomBytes(6)
                .toString('hex')}`
        );

    fs.mkdirSync(
        dir,
        {
            recursive: true
        }
    );

    return dir;
}

/*
|--------------------------------------------------------------------------
| Download Original Video
|--------------------------------------------------------------------------
*/

async function downloadOriginalVideo(
    videoUrl,
    outputPath
) {
    console.log(
        '[VIDEO] Downloading original file...'
    );

    const response =
        await axios.get(
            videoUrl,
            {
                responseType:
                    'arraybuffer',

                timeout:
                    180000,

                maxContentLength:
                    Infinity,

                maxBodyLength:
                    Infinity,

                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',

                    Accept:
                        'video/mp4,video/*,*/*',

                    Referer:
                        'https://savetube.vip/'
                }
            }
        );

    const data =
        Buffer.from(
            response.data
        );

    if (
        !data.length
    ) {
        throw new Error(
            'Downloaded video file එක empty.'
        );
    }

    const firstBytes =
        data
            .subarray(0, 100)
            .toString('utf8')
            .toLowerCase();

    if (
        firstBytes.includes('<html') ||
        firstBytes.includes('<!doctype') ||
        firstBytes.includes('access denied')
    ) {
        throw new Error(
            'Video server එක MP4 වෙනුවට error page එකක් ලබා දුන්නා.'
        );
    }

    fs.writeFileSync(
        outputPath,
        data
    );

    console.log(
        `[VIDEO] Original size: ${(data.length / 1024 / 1024).toFixed(2)} MB`
    );

    return outputPath;
}

/*
|--------------------------------------------------------------------------
| FFmpeg Compression
|--------------------------------------------------------------------------
|
| LOW SIZE / GOOD QUALITY
|
| Video  : H.264
| Audio  : AAC 96k
| CRF    : 29
| Preset : medium
| Max    : 720p
| Pixel  : yuv420p
| MP4    : faststart
|
|--------------------------------------------------------------------------
*/

async function convertToWhatsAppMp4(
    inputPath,
    outputPath
) {
    console.log(
        '[VIDEO] Compressing with FFmpeg...'
    );

    try {
        await execFileAsync(
            'ffmpeg',
            [
                '-y',

                '-hide_banner',

                '-loglevel',
                'error',

                /*
                | Input
                */

                '-i',
                inputPath,

                /*
                | Video stream
                */

                '-map',
                '0:v:0',

                /*
                | Audio if available
                */

                '-map',
                '0:a:0?',

                /*
                |--------------------------------------------------------------------------
                | Resize
                |--------------------------------------------------------------------------
                |
                | Maximum output:
                |
                | Landscape  -> 1280x720
                | Portrait   -> 720x1280
                |
                | Smaller videos are NOT enlarged.
                |
                */

                '-vf',
                'scale=w=min(1280\\,iw):h=min(720\\,ih):force_original_aspect_ratio=decrease',

                /*
                | H.264
                */

                '-c:v',
                'libx264',

                /*
                | Compression
                */

                '-preset',
                'medium',

                /*
                | Higher CRF = smaller file
                |
                | 29 = good balance for WhatsApp
                */

                '-crf',
                '29',

                /*
                | WhatsApp compatible pixel format
                */

                '-pix_fmt',
                'yuv420p',

                /*
                | Remove B-frames that can cause some
                | mobile playback problems
                */

                '-bf',
                '2',

                /*
                |--------------------------------------------------------------------------
                | Audio compression
                |--------------------------------------------------------------------------
                */

                '-c:a',
                'aac',

                '-b:a',
                '96k',

                '-ar',
                '44100',

                /*
                |--------------------------------------------------------------------------
                | MP4
                |--------------------------------------------------------------------------
                */

                '-movflags',
                '+faststart',

                /*
                | Remove unnecessary metadata
                */

                '-map_metadata',
                '-1',

                outputPath
            ],
            {
                timeout:
                    300000,

                maxBuffer:
                    10 * 1024 * 1024
            }
        );
    } catch (error) {
        console.error(
            '[FFMPEG ERROR]',
            error?.stderr ||
            error?.message ||
            error
        );

        throw new Error(
            'FFmpeg video compression failed.'
        );
    }

    if (
        !fs.existsSync(outputPath)
    ) {
        throw new Error(
            'FFmpeg output file එක හදලා නැහැ.'
        );
    }

    const stat =
        fs.statSync(
            outputPath
        );

    if (
        !stat.size
    ) {
        throw new Error(
            'FFmpeg output video එක empty.'
        );
    }

    console.log(
        `[VIDEO] Compressed size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`
    );

    return outputPath;
}

/*
|--------------------------------------------------------------------------
| Verify MP4
|--------------------------------------------------------------------------
*/

async function verifyVideo(outputPath) {
    try {
        const { stdout } =
            await execFileAsync(
                'ffprobe',
                [
                    '-v',
                    'error',

                    '-show_entries',
                    'format=format_name,duration',

                    '-show_streams',

                    '-of',
                    'json',

                    outputPath
                ],
                {
                    timeout:
                        30000,

                    maxBuffer:
                        5 * 1024 * 1024
                }
            );

        const info =
            JSON.parse(
                stdout || '{}'
            );

        const videoStream =
            Array.isArray(
                info.streams
            )
                ? info.streams.find(
                    stream =>
                        stream.codec_type ===
                        'video'
                )
                : null;

        if (!videoStream) {
            throw new Error(
                'Video stream එක හමු වුණේ නැහැ.'
            );
        }

        console.log(
            '[VIDEO STREAM]',
            videoStream.codec_name
        );

        return true;

    } catch (error) {
        console.error(
            '[FFPROBE ERROR]',
            error?.stderr ||
            error?.message ||
            error
        );

        throw new Error(
            'Final MP4 file එක verify කරන්න බැරි වුණා.'
        );
    }
}

/*
|--------------------------------------------------------------------------
| Send Playable Compressed Video
|--------------------------------------------------------------------------
*/

async function sendVideo(
    conn,
    from,
    quoted,
    videoUrl,
    title,
    quality,
    thumbnail = null
) {
    if (
        !videoUrl ||
        !/^https?:\/\//i.test(
            videoUrl
        )
    ) {
        throw new Error(
            'Invalid video download URL'
        );
    }

    const tempDir =
        createTempDir();

    const inputPath =
        path.join(
            tempDir,
            'source-video.mp4'
        );

    const outputPath =
        path.join(
            tempDir,
            'thenuva-video.mp4'
        );

    try {
        /*
        |--------------------------------------------------------------------------
        | 1. Download original
        |--------------------------------------------------------------------------
        */

        await downloadOriginalVideo(
            videoUrl,
            inputPath
        );

        /*
        |--------------------------------------------------------------------------
        | 2. Compress with FFmpeg
        |--------------------------------------------------------------------------
        */

        await convertToWhatsAppMp4(
            inputPath,
            outputPath
        );

        /*
        |--------------------------------------------------------------------------
        | 3. Verify final video
        |--------------------------------------------------------------------------
        */

        await verifyVideo(
            outputPath
        );

        /*
        |--------------------------------------------------------------------------
        | File sizes
        |--------------------------------------------------------------------------
        */

        let originalSize = 0;
        let compressedSize = 0;

        try {
            originalSize =
                fs.statSync(
                    inputPath
                ).size;

            compressedSize =
                fs.statSync(
                    outputPath
                ).size;
        } catch (_) {}

        const originalMB =
            (
                originalSize /
                1024 /
                1024
            ).toFixed(2);

        const compressedMB =
            (
                compressedSize /
                1024 /
                1024
            ).toFixed(2);

        let reduction = 0;

        if (
            originalSize > 0 &&
            compressedSize > 0
        ) {
            reduction =
                Math.max(
                    0,
                    (
                        100 -
                        (
                            compressedSize /
                            originalSize
                        ) *
                            100
                    )
                ).toFixed(0);
        }

        const fileName =
            `${cleanFileName(title)}-${quality}p.mp4`;

        console.log(
            `[VIDEO] Original: ${originalMB} MB`
        );

        console.log(
            `[VIDEO] Compressed: ${compressedMB} MB`
        );

        console.log(
            `[VIDEO] Reduced: ${reduction}%`
        );

        /*
        |--------------------------------------------------------------------------
        | 4. Send compressed MP4
        |--------------------------------------------------------------------------
        */

        await conn.sendMessage(
            from,
            {
                video: {
                    url:
                        outputPath
                },

                mimetype:
                    'video/mp4',

                fileName,

                caption:
                    `╭━━━〔 🎬 THENUVA X MD 〕━━━╮\n` +
                    `┃\n` +
                    `┃ 🎥 *${title}*\n` +
                    `┃ 📺 Quality: *${quality}P*\n` +
                    `┃\n` +
                    `┃ 📦 Original: *${originalMB} MB*\n` +
                    `┃ ⚡ Compressed: *${compressedMB} MB*\n` +
                    `┃ 💾 Reduced: *${reduction}%*\n` +
                    `┃\n` +
                    `┃ ▶️ Playable MP4\n` +
                    `┃ ⚡ Powered by THENUVA X MD\n` +
                    `┃\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━╯`
            },
            {
                quoted
            }
        );

        console.log(
            '[VIDEO] Compressed video sent successfully.'
        );

    } finally {
        /*
        |--------------------------------------------------------------------------
        | 5. Cleanup
        |--------------------------------------------------------------------------
        */

        try {
            fs.rmSync(
                tempDir,
                {
                    recursive: true,
                    force: true
                }
            );

            console.log(
                '[VIDEO] Temporary files cleaned.'
            );

        } catch (cleanupError) {
            console.error(
                '[VIDEO CLEANUP ERROR]',
                cleanupError?.message
            );
        }
    }
}

/*
|--------------------------------------------------------------------------
| Quality Menu
|--------------------------------------------------------------------------
*/

async function sendQualityMenu(
    conn,
    from,
    quoted,
    api,
    originalUrl
) {
    const title =
        getTitle(api);

    const thumbnail =
        getThumbnail(api);

    const qualities =
        getQualities(api);

    /*
    | No quality list
    */

    if (
        !qualities.length
    ) {
        const directUrl =
            api?.data?.links?.video;

        if (!directUrl) {
            throw new Error(
                'API එක MP4 download URL එකක් return කරලා නැහැ.'
            );
        }

        const quality =
            String(
                api?.data?.quality_found ||
                '720'
            ).replace(
                /p/i,
                ''
            );

        return await sendVideo(
            conn,
            from,
            quoted,
            directUrl,
            title,
            quality,
            thumbnail
        );
    }

    /*
    | Quality rows
    */

    const rows =
        qualities.map(
            item => ({
                id:
                    `${config.PREFIX}video ${originalUrl} ${item.quality}`,

                title:
                    `🎬 ${item.quality}P`,

                description:
                    `Download compressed ${item.quality}P video`
            })
        );

    await sendListMenu(
        conn,
        from,
        {
            title:
                `╭━━━〔 🎬 THENUVA X MD 〕━━━╮\n` +
                `┃\n` +
                `┃ 🎥 *${title}*\n` +
                `┃\n` +
                `┃ 📺 Select video quality\n` +
                `┃ 📦 FFmpeg compression enabled\n` +
                `┃\n` +
                `╰━━━━━━━━━━━━━━━━━━━━╯`,

            buttonText:
                'SELECT QUALITY',

            footer:
                '⚡ H.264 + AAC • Low Size • THENUVA X MD',

            image:
                thumbnail || null,

            sections: [
                {
                    title:
                        '🎬 AVAILABLE QUALITY',

                    rows
                }
            ]
        },
        quoted
    );
}

/*
|--------------------------------------------------------------------------
| VIDEO COMMAND
|--------------------------------------------------------------------------
*/

cmd(
    {
        pattern:
            'video',

        alias: [
            'ytmp4',
            'playvideo',
            'ytvideo'
        ],

        react:
            '🎬',

        desc:
            'Download compressed YouTube video',

        category:
            'download',

        filename:
            __filename
    },

    async (
        conn,
        mek,
        m,
        {
            from,
            body,
            reply
        }
    ) => {
        try {
            /*
            |--------------------------------------------------------------------------
            | Check body
            |--------------------------------------------------------------------------
            */

            if (
                typeof body !== 'string' ||
                !body.trim()
            ) {
                return reply(
                    `╭━━━〔 🎬 THENUVA X MD 〕━━━╮\n` +
                    `┃\n` +
                    `┃ ❌ YouTube link එකක් දෙන්න.\n` +
                    `┃\n` +
                    `┃ Example:\n` +
                    `┃ .video https://youtu.be/xxxxx\n` +
                    `┃\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━╯`
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Split
            |--------------------------------------------------------------------------
            */

            const parts =
                body
                    .trim()
                    .split(/\s+/);

            parts.shift();

            if (
                !parts.length
            ) {
                return reply(
                    `╭━━━〔 🎬 THENUVA X MD 〕━━━╮\n` +
                    `┃\n` +
                    `┃ ❌ YouTube link එකක් දෙන්න.\n` +
                    `┃\n` +
                    `┃ Example:\n` +
                    `┃ .video https://youtu.be/xxxxx\n` +
                    `┃\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━╯`
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Quality
            |--------------------------------------------------------------------------
            */

            let quality =
                null;

            const last =
                parts[
                    parts.length - 1
                ];

            if (
                /^\d{3,4}p?$/i.test(
                    last
                )
            ) {
                quality =
                    last.replace(
                        /p$/i,
                        ''
                    );

                parts.pop();
            }

            /*
            |--------------------------------------------------------------------------
            | URL
            |--------------------------------------------------------------------------
            */

            const url =
                parts
                    .join(' ')
                    .trim();

            if (
                !isYouTubeUrl(url)
            ) {
                return reply(
                    `╭━━━〔 ❌ INVALID URL 〕━━━╮\n` +
                    `┃\n` +
                    `┃ YouTube link එකක් ලබා දෙන්න.\n` +
                    `┃\n` +
                    `┃ Example:\n` +
                    `┃ .video https://youtu.be/xxxxx\n` +
                    `┃\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━╯`
                );
            }

            /*
            |--------------------------------------------------------------------------
            | API Key
            |--------------------------------------------------------------------------
            */

            if (
                !API_KEY
            ) {
                return reply(
                    `╭━━━〔 ❌ API ERROR 〕━━━╮\n` +
                    `┃\n` +
                    `┃ MR_THINUZZ_API_KEY\n` +
                    `┃ config එකේ නැහැ.\n` +
                    `┃\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━╯`
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Processing message
            |--------------------------------------------------------------------------
            */

            await reply(
                quality
                    ? (
                        `╭━━━〔 🎬 THENUVA X MD 〕━━━╮\n` +
                        `┃\n` +
                        `┃ ⏳ *${quality}P video එක prepare කරනවා...*\n` +
                        `┃\n` +
                        `┃ 📥 Downloading...\n` +
                        `┃ ⚙️ FFmpeg compressing...\n` +
                        `┃ 📦 Size optimize කරනවා...\n` +
                        `┃\n` +
                        `╰━━━━━━━━━━━━━━━━━━━━╯`
                    )
                    : (
                        `╭━━━〔 🎬 THENUVA X MD 〕━━━╮\n` +
                        `┃\n` +
                        `┃ ⏳ *Processing video...*\n` +
                        `┃\n` +
                        `┃ 📺 YouTube video එක ලබාගන්නවා.\n` +
                        `┃ ⚙️ FFmpeg compression enabled.\n` +
                        `┃ 📦 Low-size MP4 හදනවා...\n` +
                        `┃\n` +
                        `╰━━━━━━━━━━━━━━━━━━━━╯`
                    )
            );

            /*
            |--------------------------------------------------------------------------
            | API
            |--------------------------------------------------------------------------
            */

            const api =
                await requestVideo(
                    url
                );

            const title =
                getTitle(api);

            const thumbnail =
                getThumbnail(api);

            /*
            |--------------------------------------------------------------------------
            | Selected quality
            |--------------------------------------------------------------------------
            */

            if (
                quality
            ) {
                const selected =
                    findQuality(
                        api,
                        quality
                    );

                if (
                    !selected
                ) {
                    const available =
                        getQualities(api)
                            .map(
                                item =>
                                    `${item.quality}P`
                            )
                            .join(', ');

                    return reply(
                        `╭━━━〔 ❌ QUALITY NOT FOUND 〕━━━╮\n` +
                        `┃\n` +
                        `┃ ❌ *${quality}P* quality එක හමු වුණේ නැහැ.\n` +
                        `┃\n` +
                        `┃ 📺 Available:\n` +
                        `┃ ${available || 'Unknown'}\n` +
                        `┃\n` +
                        `╰━━━━━━━━━━━━━━━━━━━━╯`
                    );
                }

                return await sendVideo(
                    conn,
                    from,
                    mek,
                    selected.downloadUrl,
                    title,
                    selected.quality,
                    thumbnail
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Show quality menu
            |--------------------------------------------------------------------------
            */

            return await sendQualityMenu(
                conn,
                from,
                mek,
                api,
                url
            );

        } catch (error) {
            console.error(
                '[VIDEO ERROR]',
                error?.response?.data ||
                error?.stderr ||
                error?.message ||
                error
            );

            let message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                'Unknown error';

            if (
                error?.response?.status === 401
            ) {
                message =
                    'API key එක invalid.';
            }

            if (
                error?.response?.status === 403
            ) {
                message =
                    'Video server එක request එක block කරලා.';
            }

            if (
                error?.response?.status === 404
            ) {
                message =
                    'YTMP4 API endpoint එක හමු වුණේ නැහැ.';
            }

            if (
                error?.code ===
                'ECONNABORTED'
            ) {
                message =
                    'Video download timeout වුණා.';
            }

            if (
                String(
                    message
                ).toLowerCase()
                    .includes('ffmpeg')
            ) {
                message =
                    'FFmpeg install වෙලා නැහැ. Railway build එකේ FFmpeg install කරන්න.';
            }

            return reply(
                `╭━━━〔 ❌ VIDEO ERROR 〕━━━╮\n` +
                `┃\n` +
                `┃ ${message}\n` +
                `┃\n` +
                `┃ 🎬 THENUVA X MD\n` +
                `┃\n` +
                `╰━━━━━━━━━━━━━━━━━━━━╯`
            );
        }
    }
);
