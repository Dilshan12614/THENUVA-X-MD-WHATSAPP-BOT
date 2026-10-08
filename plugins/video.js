const axios = require('axios');
const { cmd } = require('../command');
const config = require('../config');
const { sendListMenu } = require('../lib/buttons');

const API_BASE =
    'https://mr-thinuzz-api-build.vercel.app';

const API_KEY =
    config.MR_THINUZZ_API_KEY ||
    process.env.MR_THINUZZ_API_KEY ||
    '';

/*
|--------------------------------------------------------------------------
| YouTube URL Check
|--------------------------------------------------------------------------
*/

function isYouTubeUrl(url) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(
        url
    );
}

/*
|--------------------------------------------------------------------------
| Clean File Name
|--------------------------------------------------------------------------
*/

function cleanFileName(name) {
    return String(name || 'THENUVA X MD VIDEO')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100);
}

/*
|--------------------------------------------------------------------------
| Get Title
|--------------------------------------------------------------------------
*/

function getTitle(api) {
    return (
        api?.data?.title ||
        api?.title ||
        'THENUVA X MD VIDEO'
    );
}

/*
|--------------------------------------------------------------------------
| Get Thumbnail
|--------------------------------------------------------------------------
*/

function getThumbnail(api) {
    return (
        api?.data?.thumbnail ||
        api?.thumbnail ||
        null
    );
}

/*
|--------------------------------------------------------------------------
| Get Available Qualities
|--------------------------------------------------------------------------
*/

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

            const quality =
                String(item.quality)
                    .replace(/p$/i, '');

            if (seen.has(quality)) {
                return false;
            }

            if (
                !/^https?:\/\//i.test(
                    item.downloadUrl
                )
            ) {
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

/*
|--------------------------------------------------------------------------
| Find Selected Quality
|--------------------------------------------------------------------------
*/

function findQuality(api, quality) {
    const qualities =
        getQualities(api);

    return qualities.find(
        item =>
            String(item.quality) ===
            String(quality)
    );
}

/*
|--------------------------------------------------------------------------
| Request Video From API
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

    console.log(
        '[VIDEO API]',
        endpoint
    );

    console.log(
        '[VIDEO URL]',
        url
    );

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

    console.log(
        '[VIDEO API STATUS]',
        response.status
    );

    if (
        !response.data
    ) {
        throw new Error(
            'API response එක empty.'
        );
    }

    console.log(
        '[VIDEO API RESPONSE]',
        JSON.stringify(
            response.data,
            null,
            2
        )
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
| Download MP4
|--------------------------------------------------------------------------
|
| Important:
| API එකෙන් ලැබෙන URL එක WhatsAppට direct දෙනවා වෙනුවට
| මුලින් MP4 Buffer එකක් කරලා WhatsAppට upload කරනවා.
|
|--------------------------------------------------------------------------
*/

async function downloadVideoBuffer(videoUrl) {
    if (
        !videoUrl ||
        !/^https?:\/\//i.test(videoUrl)
    ) {
        throw new Error(
            'Invalid video download URL'
        );
    }

    console.log(
        '[VIDEO] Downloading MP4...'
    );

    console.log(
        '[VIDEO DOWNLOAD URL]',
        videoUrl
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
                        'https://www.youtube.com/'
                }
            }
        );

    const buffer =
        Buffer.from(
            response.data
        );

    if (
        !buffer ||
        !buffer.length
    ) {
        throw new Error(
            'Video file එක empty.'
        );
    }

    console.log(
        `[VIDEO] Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB`
    );

    return buffer;
}

/*
|--------------------------------------------------------------------------
| Send Video To WhatsApp
|--------------------------------------------------------------------------
*/

async function sendVideo(
    conn,
    from,
    quoted,
    videoUrl,
    title,
    quality
) {
    if (
        !videoUrl ||
        !/^https?:\/\//i.test(videoUrl)
    ) {
        throw new Error(
            'Invalid video URL'
        );
    }

    /*
    | Download first
    */

    const videoBuffer =
        await downloadVideoBuffer(
            videoUrl
        );

    const fileName =
        `${cleanFileName(title)}-${quality}p.mp4`;

    console.log(
        `[VIDEO] Uploading ${quality}P to WhatsApp...`
    );

    /*
    | Send Buffer
    */

    await conn.sendMessage(
        from,
        {
            video:
                videoBuffer,

            mimetype:
                'video/mp4',

            fileName,

            caption:
                `╭━━━〔 🎬 THENUVA X MD 〕━━━╮\n` +
                `┃\n` +
                `┃ 🎥 *${title}*\n` +
                `┃ 📺 Quality: *${quality}P*\n` +
                `┃\n` +
                `┃ ⚡ Powered by THENUVA X MD\n` +
                `┃\n` +
                `╰━━━━━━━━━━━━━━━━━━━━╯`
        },
        {
            quoted
        }
    );

    console.log(
        '[VIDEO] Sent successfully'
    );
}

/*
|--------------------------------------------------------------------------
| Quality Selection Menu
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
    | If API doesn't return all qualities,
    | use direct video link.
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
            quality
        );
    }

    /*
    | Create quality rows
    |
    | Example ID:
    | .video https://youtu.be/xxxxx 720
    |
    | getCommandBody() මේක direct command එකක්
    | විදිහට return කරන නිසා button-actions.js
    | වෙනස් කරන්න අවශ්‍ය නැහැ.
    */

    const rows =
        qualities.map(item => ({
            id:
                `${config.PREFIX}video ${originalUrl} ${item.quality}`,

            title:
                `${item.quality}P`,

            description:
                `Download ${item.quality}P video`
        }));

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
                `┃\n` +
                `╰━━━━━━━━━━━━━━━━━━━━╯`,

            buttonText:
                'SELECT QUALITY',

            footer:
                '⚡ Powered by THENUVA X MD',

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
            'Download YouTube video',

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
            | Check command
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
            | Split command
            */

            const parts =
                body
                    .trim()
                    .split(/\s+/);

            /*
            | Remove command
            */

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
            | Detect quality
            |
            | Supports:
            | 1080
            | 1080p
            | 720
            | 720p
            | 360
            | 360p
            | 144
            | 144p
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
            | Rebuild URL
            */

            const url =
                parts
                    .join(' ')
                    .trim();

            /*
            | Validate YouTube URL
            */

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
            | Check API key
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
            | Processing message
            */

            if (
                quality
            ) {
                await reply(
                    `╭━━━〔 🎬 THENUVA X MD 〕━━━╮\n` +
                    `┃\n` +
                    `┃ ⏳ *${quality}P video එක prepare කරනවා...*\n` +
                    `┃\n` +
                    `┃ Please wait...\n` +
                    `┃\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━╯`
                );
            } else {
                await reply(
                    `╭━━━〔 🎬 THENUVA X MD 〕━━━╮\n` +
                    `┃\n` +
                    `┃ ⏳ *Processing video...*\n` +
                    `┃\n` +
                    `┃ YouTube video එක ලබාගන්නවා.\n` +
                    `┃\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━╯`
                );
            }

            /*
            | Request API
            */

            const api =
                await requestVideo(
                    url
                );

            const title =
                getTitle(api);

            /*
            | If user selected quality
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
                        getQualities(
                            api
                        )
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
                        `┃ Available:\n` +
                        `┃ ${available || 'Unknown'}\n` +
                        `┃\n` +
                        `╰━━━━━━━━━━━━━━━━━━━━╯`
                    );
                }

                /*
                | Download + upload to WhatsApp
                */

                return await sendVideo(
                    conn,
                    from,
                    mek,
                    selected.downloadUrl,
                    title,
                    selected.quality
                );
            }

            /*
            | Show quality selection
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
                error?.message ||
                error
            );

            let message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                'Unknown error';

            /*
            | HTTP Errors
            */

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

            /*
            | Timeout
            */

            if (
                error?.code ===
                'ECONNABORTED'
            ) {
                message =
                    'Video download timeout වුණා.';
            }

            /*
            | Axios network errors
            */

            if (
                error?.code ===
                'ERR_BAD_RESPONSE'
            ) {
                message =
                    'Video server එකෙන් invalid response එකක් ලැබුණා.';
            }

            /*
            | Final error
            */

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
