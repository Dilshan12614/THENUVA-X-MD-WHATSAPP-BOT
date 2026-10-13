const { cmd } = require('../command');

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = 'ZSKNl5eniyeAPcPkf';

const API_URL =
    `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`;

const TIMEOUT = 300000;
const MAX_VIDEO_SIZE = 64 * 1024 * 1024;

function isYouTubeUrl(value) {
    try {
        const url = new URL(value);
        return ['youtube.com', 'www.youtube.com', 'm.youtube.com',
            'youtu.be', 'www.youtu.be'].includes(url.hostname) &&
            ['http:', 'https:'].includes(url.protocol);
    } catch {
        return false;
    }
}

function findDownloadUrl(data) {
    const seen = new Set();
    const queue = [data];

    while (queue.length) {
        const item = queue.shift();

        if (!item || typeof item !== 'object' || seen.has(item)) continue;
        seen.add(item);

        for (const key of [
            'downloadUrl', 'download_url', 'videoUrl',
            'video_url', 'url', 'link'
        ]) {
            const value = item[key];

            if (typeof value === 'string' &&
                /^https?:\/\//i.test(value) &&
                /\.(mp4|m4v)(?:[?#]|$)/i.test(value)) {
                return value;
            }
        }

        for (const value of Object.values(item)) {
            if (value && typeof value === 'object') queue.push(value);
        }
    }

    return null;
}

function findTitle(data) {
    for (const item of Array.isArray(data) ? data : [data]) {
        const title = item?.title || item?.videoTitle ||
            item?.name || item?.data?.title;

        if (typeof title === 'string' && title.trim()) return title;
    }
    return 'YouTube Video';
}

cmd({
    pattern: 'video',
    alias: ['ytmp4', 'ytvideo'],
    react: '🎬',
    desc: 'Download YouTube video',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        const input = args.join(' ').trim();

        if (!input) {
            return reply(
                '╭━━〔 *THENUVA X MD* 〕━━╮\n' +
                '┃ 🎬 *YOUTUBE DOWNLOADER*\n' +
                '╰━━━━━━━━━━━━━━━━━━╯\n\n' +
                '📌 භාවිතය: `.video YouTube_URL`'
            );
        }

        if (!isYouTubeUrl(input)) {
            return reply('❌ නිවැරදි YouTube URL එකක් ලබා දෙන්න.');
        }

        if (!APIFY_TOKEN) {
            return reply(
                '❌ GitHub Secrets වල APIFY_TOKEN සකස් කරලා නැහැ.'
            );
        }

        await conn.sendMessage(from, {
            react: { text: '⏳', key: mek.key }
        });

        const controller = AbortSignal.timeout(TIMEOUT);

        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${APIFY_TOKEN}`,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                urls: [{ url: input }],
                quality: '1080',
                format: 'default',
                residentialProxyMode: 'disabled',
                proxyCountry: ''
            }),
            signal: controller
        });

        const responseText = await apiResponse.text();

        if (!apiResponse.ok) {
            console.error('[APIFY VIDEO] HTTP:', apiResponse.status);
            console.error('[APIFY VIDEO] Error:', responseText.slice(0, 300));
            return reply(
                `❌ Apify API Error: HTTP ${apiResponse.status}\n` +
                'Actor ID, token සහ Actor access පරීක්ෂා කරන්න.'
            );
        }

        let result;

        try {
            result = JSON.parse(responseText);
        } catch {
            return reply('❌ Apify එකෙන් වලංගු JSON response එකක් ලැබුණේ නැහැ.');
        }

        const downloadUrl = findDownloadUrl(result);

        if (!downloadUrl) {
            console.error(
                '[APIFY VIDEO] Output:',
                JSON.stringify(result).slice(0, 1000)
            );
            return reply(
                '❌ Actor එකේ output එකෙන් MP4 download URL එක හමු වුණේ නැහැ.\n' +
                'Apify Actor output format එක පරීක්ෂා කරන්න.'
            );
        }

        await reply('📥 වීඩියෝව ලබාගනිමින් පවතී...');

        const videoResponse = await fetch(downloadUrl, {
            headers: {
                Accept: 'video/mp4, video/*, application/octet-stream'
            },
            signal: controller
        });

        if (!videoResponse.ok) {
            throw new Error(`Video URL HTTP ${videoResponse.status}`);
        }

        const contentType =
            videoResponse.headers.get('content-type') || '';

        if (
            !contentType.includes('video/') &&
            !contentType.includes('application/octet-stream')
        ) {
            throw new Error(`Download URL returned ${contentType || 'unknown content'}`);
        }

        const declaredSize = Number(
            videoResponse.headers.get('content-length') || 0
        );

        if (declaredSize > MAX_VIDEO_SIZE) {
            return reply('❌ වීඩියෝව 64 MB සීමාව ඉක්මවයි.');
        }

        const buffer = Buffer.from(await videoResponse.arrayBuffer());

        if (!buffer.length) throw new Error('Downloaded file is empty');

        if (buffer.length > MAX_VIDEO_SIZE) {
            return reply('❌ වීඩියෝව 64 MB සීමාව ඉක්මවයි.');
        }

        const title = findTitle(result)
            .replace(/[\\/:*?"<>|]/g, '')
            .slice(0, 100);

        await conn.sendMessage(from, {
            video: buffer,
            mimetype: 'video/mp4',
            fileName: `${title || 'THENUVA-X-MD'}.mp4`,
            caption: `🎬 *${title}*\n\n⚡ Downloaded by THENUVA X MD`
        }, { quoted: mek });

        await conn.sendMessage(from, {
            react: { text: '✅', key: mek.key }
        });

    } catch (error) {
        console.error('[APIFY VIDEO ERROR]', error.message);

        await conn.sendMessage(from, {
            react: { text: '❌', key: mek.key }
        });

        return reply(
            '❌ *VIDEO DOWNLOAD FAILED*\n\n' +
            `${error.name === 'TimeoutError'
                ? 'Apify request එකට වැඩි කාලයක් ගත වුණා.'
                : error.message}\n\n` +
            'GitHub Actions logs සහ Apify Actor output පරීක්ෂා කරන්න.'
        );
    }
});
