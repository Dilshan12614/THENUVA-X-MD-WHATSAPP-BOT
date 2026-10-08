const axios = require('axios');
const { cmd } = require('../command');
const config = require('../config');
const { sendListMenu } = require('../lib/buttons');

const API_BASE =
    config.MR_THINUZZ_API_URL ||
    process.env.MR_THINUZZ_API_URL ||
    'https://mr-thinuzz-api-build.vercel.app';

const API_KEY =
    config.MR_THINUZZ_API_KEY ||
    process.env.MR_THINUZZ_API_KEY ||
    '';

const MENU_IMAGE =
    config.MENU_IMAGE ||
    process.env.MENU_IMAGE ||
    '';

function isYouTubeUrl(url) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(
        url
    );
}

function safeFileName(name) {
    return String(name || 'THENUVA-X-MD-VIDEO')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120);
}

function getQualityNumber(value) {
    const match = String(value || '').match(/\d+/);
    return match ? Number(match[0]) : 0;
}

function findQuality(data, quality) {
    const qualities = Array.isArray(data?.all_qualities)
        ? data.all_qualities
        : [];

    return qualities.find(item => {
        return (
            String(item?.quality) === String(quality) &&
            typeof item?.downloadUrl === 'string' &&
            /^https?:\/\//i.test(item.downloadUrl)
        );
    });
}

function buildQualityRows(data, originalUrl) {
    const qualities = Array.isArray(data?.all_qualities)
        ? data.all_qualities
        : [];

    const unique = new Map();

    for (const item of qualities) {
        const quality = String(item?.quality || '').trim();
        const downloadUrl = item?.downloadUrl;

        if (!quality) continue;
        if (!downloadUrl) continue;
        if (!/^https?:\/\//i.test(downloadUrl)) continue;

        if (!unique.has(quality)) {
            unique.set(quality, {
                quality,
                downloadUrl
            });
        }
    }

    const rows = [...unique.values()]
        .sort(
            (a, b) =>
                getQualityNumber(b.quality) -
                getQualityNumber(a.quality)
        )
        .map(item => ({
            id:
                `video_quality|${encodeURIComponent(
                    item.quality
                )}|${encodeURIComponent(originalUrl)}`,

            title: `${item.quality}P`,

            description:
                `Download ${item.quality}P video`
        }));

    return rows;
}

function parseQualityAction(id) {
    if (
        typeof id !== 'string' ||
        !id.startsWith('video_quality|')
    ) {
        return null;
    }

    const parts = id.split('|');

    if (parts.length < 3) {
        return null;
    }

    try {
        return {
            quality: decodeURIComponent(parts[1]),
            url: decodeURIComponent(parts.slice(2).join('|'))
        };
    } catch {
        return null;
    }
}

async function requestVideo(url) {
    const endpoint =
        `${API_BASE}/ytmp4v3/download-all`;

    console.log('[VIDEO] API:', endpoint);
    console.log('[VIDEO] URL:', url);

    const response = await axios.get(endpoint, {
        params: {
            url
        },
        headers: {
            'x-api-key': API_KEY,
            Accept: 'application/json'
        },
        timeout: 60000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    });

    console.log(
        '[VIDEO] API status:',
        response.status
    );

    console.log(
        '[VIDEO] API response:',
        JSON.stringify(response.data, null, 2)
    );

    if (!response.data?.status) {
        throw new Error(
            response.data?.message ||
            response.data?.error ||
            'Video API request failed'
        );
    }

    if (!response.data?.data) {
        throw new Error(
            'API response does not contain data'
        );
    }

    return response.data;
}

async function sendQualityMenu(
    conn,
    from,
    quoted,
    apiData,
    originalUrl
) {
    const data = apiData.data;

    const title =
        data.title ||
        'YouTube Video';

    const rows =
        buildQualityRows(
            data,
            originalUrl
        );

    if (!rows.length) {
        throw new Error(
            'No downloadable qualities found'
        );
    }

    const available =
        rows
            .map(row => row.title)
            .join(' • ');

    await sendListMenu(
        conn,
        from,
        {
            title:
                `╭━━━〔 🎬 THENUVA X MD 〕━━━╮\n` +
                `┃\n` +
                `┃ 🎥 ${title}\n` +
                `┃\n` +
                `┃ 📺 Available: ${available}\n` +
                `┃\n` +
                `╰━━━━━━━━━━━━━━━━━━━━╯`,

            buttonText:
                'SELECT QUALITY',

            footer:
                '⚡ Powered by THENUVA X MD',

            image:
                data.thumbnail ||
                MENU_IMAGE,

            sections: [
                {
                    title:
                        '🎬 VIDEO QUALITY',

                    rows
                }
            ]
        },
        quoted
    );
}

async function sendVideo(
    conn,
    from,
    quoted,
    {
        videoUrl,
        title,
        quality
    }
) {
    if (
        typeof videoUrl !== 'string' ||
        !/^https?:\/\//i.test(videoUrl)
    ) {
        throw new Error(
            'Invalid video download URL'
        );
    }

    const fileName =
        `${safeFileName(title)}-${quality}p.mp4`;

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
                `┃ 🎥 ${title}\n` +
                `┃\n` +
                `┃ 📺 Quality: ${quality}P\n` +
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

cmd(
    {
        pattern: 'video',
        alias: [
            'ytmp4',
            'playvideo',
            'ytvideo'
        ],
        react: '🎬',
        desc: 'Download YouTube video',
        category: 'download',
        filename: __filename
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
            const args =
                body
                    .trim()
                    .split(/\s+/)
                    .slice(1)
                    .join(' ')
                    .trim();

            if (!args) {
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
             * Quality button click
             *
             * ID format:
             * video_quality|720|https://youtube.com/...
             */
            if (
                args.startsWith(
                    'video_quality|'
                )
            ) {
                const selected =
                    parseQualityAction(args);

                if (!selected) {
                    return reply(
                        '❌ Invalid video quality selection.'
                    );
                }

                const apiData =
                    await requestVideo(
                        selected.url
                    );

                const data =
                    apiData.data;

                const selectedQuality =
                    findQuality(
                        data,
                        selected.quality
                    );

                if (!selectedQuality) {
                    return reply(
                        `❌ ${selected.quality}P quality එක API එකේ නැහැ.`
                    );
                }

                await reply(
                    `⏳ *${selected.quality}P video එක prepare කරනවා...*`
                );

                await sendVideo(
                    conn,
                    from,
                    mek,
                    {
                        videoUrl:
                            selectedQuality.downloadUrl,

                        title:
                            data.title ||
                            'THENUVA X MD VIDEO',

                        quality:
                            selectedQuality.quality
                    }
                );

                return;
            }

            if (!isYouTubeUrl(args)) {
                return reply(
                    `❌ *Invalid YouTube URL*\n\n` +
                    `YouTube video link එකක් ලබා දෙන්න.`
                );
            }

            if (!API_KEY) {
                console.log(
                    '[VIDEO] MR_THINUZZ_API_KEY missing'
                );

                return reply(
                    `❌ *API KEY NOT FOUND*\n\n` +
                    `config.env එකේ:\n\n` +
                    `MR_THINUZZ_API_KEY=YOUR_KEY`
                );
            }

            await reply(
                `╭━━━〔 🎬 THENUVA X MD 〕━━━╮\n` +
                `┃\n` +
                `┃ ⏳ *Processing...*\n` +
                `┃\n` +
                `┃ YouTube video එක ලබාගන්නවා.\n` +
                `┃\n` +
                `╰━━━━━━━━━━━━━━━━━━━━╯`
            );

            const apiData =
                await requestVideo(args);

            await sendQualityMenu(
                conn,
                from,
                mek,
                apiData,
                args
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
                    'API key එක invalid හෝ expired.';
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
                    'Video API endpoint එක හමු වුණේ නැහැ.';
            }

            if (
                error?.code ===
                'ECONNABORTED'
            ) {
                message =
                    'API request timeout වුණා. නැවත try කරන්න.';
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
