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

function isYouTubeUrl(url) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url);
}

function cleanFileName(name) {
    return String(name || 'THENUVA X MD VIDEO')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100);
}

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

            const quality =
                String(item.quality);

            if (seen.has(quality)) {
                return false;
            }

            seen.add(quality);

            return /^https?:\/\//i.test(
                item.downloadUrl
            );
        })
        .sort(
            (a, b) =>
                Number(b.quality) -
                Number(a.quality)
        );
}

function findQuality(api, quality) {
    const qualities =
        getQualities(api);

    return qualities.find(
        item =>
            String(item.quality) ===
            String(quality)
    );
}

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
                        'application/json'
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

    if (!response.data?.data) {
        throw new Error(
            'API response එකේ data නැහැ.'
        );
    }

    return response.data;
}

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

    const fileName =
        `${cleanFileName(title)}-${quality}p.mp4`;

    console.log(
        `[VIDEO] Sending ${quality}P`
    );

    await conn.sendMessage(
        from,
        {
            video: {
                url: videoUrl
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
                `┃ ⚡ Powered by THENUVA X MD\n` +
                `┃\n` +
                `╰━━━━━━━━━━━━━━━━━━━━╯`
        },

        {
            quoted
        }
    );
}

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

    if (!qualities.length) {
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

        return sendVideo(
            conn,
            from,
            quoted,
            directUrl,
            title,
            quality
        );
    }

    const rows =
        qualities.map(item => ({
            /*
             * IMPORTANT:
             * This is a real bot command.
             *
             * Example:
             * .video https://youtube.com/... 720
             *
             * Your current button-actions.js
             * already returns IDs beginning
             * with PREFIX as commands.
             */

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

cmd(
    {
        pattern: 'video',

        alias: [
            'ytmp4',
            'playvideo',
            'ytvideo'
        ],

        react: '🎬',

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
             * Example normal command:
             *
             * .video https://youtu.be/xxxxx
             *
             * Example quality command:
             *
             * .video https://youtu.be/xxxxx 720
             */

            const parts =
                body
                    .trim()
                    .split(/\s+/);

            parts.shift();

            if (!parts.length) {
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
             * Last argument can be quality.
             */

            let quality = null;

            const last =
                parts[parts.length - 1];

            if (
                /^\d{3,4}p?$/i.test(last)
            ) {
                quality =
                    last.replace(
                        /p$/i,
                        ''
                    );

                parts.pop();
            }

            const url =
                parts.join(' ').trim();

            if (!isYouTubeUrl(url)) {
                return reply(
                    `❌ *Invalid YouTube URL*\n\n` +
                    `YouTube link එකක් ලබා දෙන්න.`
                );
            }

            if (!API_KEY) {
                return reply(
                    `❌ *API KEY NOT FOUND*\n\n` +
                    `MR_THINUZZ_API_KEY config එකේ නැහැ.`
                );
            }

            /*
             * ==================================
             * QUALITY BUTTON CLICK
             * ==================================
             */

            if (quality) {
                await reply(
                    `⏳ *${quality}P video එක prepare කරනවා...*`
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

            const api =
                await requestVideo(url);

            const title =
                getTitle(api);

            /*
             * ==================================
             * SPECIFIC QUALITY
             * ==================================
             */

            if (quality) {
                const selected =
                    findQuality(
                        api,
                        quality
                    );

                if (!selected) {
                    return reply(
                        `❌ *${quality}P quality එක හමු වුණේ නැහැ.*`
                    );
                }

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
             * ==================================
             * SHOW QUALITY MENU
             * ==================================
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
                    'API request timeout වුණා.';
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
