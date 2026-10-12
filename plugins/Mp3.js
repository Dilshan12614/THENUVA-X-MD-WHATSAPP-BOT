const axios = require('axios');
const config = require('../config');
const { cmd } = require('../command');

const API_URL =
    'https://apis.davidcyril.name.ng/download/y2mate?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ';

const activeRequests = new Set();
const MAX_AUDIO_SIZE = 50 * 1024 * 1024;

function extractUrl(value) {
    if (typeof value !== 'string') return null;

    let url = value.trim();

    const markdown = url.match(
        /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/
    );

    if (markdown) url = markdown[2];

    try {
        const parsed = new URL(url);

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return null;
        }

        return parsed.href;
    } catch {
        return null;
    }
}

function findAudioUrl(data, depth = 0) {
    if (!data || depth > 6) return null;

    if (typeof data === 'string') {
        return extractUrl(data);
    }

    if (typeof data !== 'object') return null;

    const keys = [
        'download_url',
        'downloadUrl',
        'audio_url',
        'audioUrl',
        'mp3_url',
        'url',
        'link',
        'download',
        'audio',
        'links',
        'data',
        'result'
    ];

    for (const key of keys) {
        if (data[key] !== undefined) {
            const found = findAudioUrl(data[key], depth + 1);
            if (found) return found;
        }
    }

    for (const value of Object.values(data)) {
        const found = findAudioUrl(value, depth + 1);
        if (found) return found;
    }

    return null;
}

cmd({
    pattern: 'mp3',
    alias: ['ytmp3', 'song', 'audio'],
    react: '🎵',
    desc: 'Download YouTube audio as MP3',
    category: 'download',
    use: '.mp3 <YouTube URL>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {

    if (activeRequests.has(from)) {
        return reply(
            '⏳ දැනට audio request එකක් ක්‍රියාත්මකයි. ටිකක් ඉන්න.'
        );
    }

    if (!q || !q.trim()) {
        return reply(
            '╭───────────────●●►\n' +
            '│ 🎵 *THENUVA X MD MP3*\n' +
            '├───────────────●●►\n' +
            '│\n' +
            '│ 📥 YouTube Audio Downloader\n' +
            '│\n' +
            '│ භාවිතය:\n' +
            '│ .mp3 YouTube_URL\n' +
            '│\n' +
            '╰───────────────●●►'
        );
    }

    let youtubeUrl;

    try {
        youtubeUrl = new URL(q.trim());
    } catch {
        return reply('❌ නිවැරදි YouTube URL එකක් ලබා දෙන්න.');
    }

    const allowedHosts = [
        'youtube.com',
        'www.youtube.com',
        'm.youtube.com',
        'music.youtube.com',
        'youtu.be',
        'www.youtu.be'
    ];

    if (
        !['http:', 'https:'].includes(youtubeUrl.protocol) ||
        !allowedHosts.includes(youtubeUrl.hostname.toLowerCase())
    ) {
        return reply('❌ වලංගු YouTube URL එකක් ලබා දෙන්න.');
    }

    activeRequests.add(from);

    try {
        const apiKey =
            process.env.DAVIDCYRIL_API_KEY ||
            config.DAVIDCYRIL_API_KEY;

        if (!apiKey) {
            return reply(
                '❌ *API KEY NOT CONFIGURED*\n\n' +
                'GitHub repository එකේ Settings → Secrets and variables → Actions ' +
                'වෙත ගොස් DAVIDCYRIL_API_KEY සකසන්න.'
            );
        }

        await reply(
            '⏳ *THENUVA X MD*\n\n' +
            '🎵 Audio එක ලබාගනිමින් පවතී...\n' +
            '📥 කරුණාකර රැඳී සිටින්න.'
        );

        // 1. Request MP3 from the Y2Mate endpoint
        const response = await axios.get(API_URL, {
            params: {
                url: youtubeUrl.href,
                format: 'mp3',
                quality: '128'
            },
            headers: {
                'X-API-Key': apiKey,
                Accept: 'application/json'
            },
            timeout: 120000,
            maxContentLength: 2 * 1024 * 1024,
            maxRedirects: 5
        });

        const apiData = response.data;

        console.log(
            '[MP3] API response:',
            JSON.stringify(apiData).slice(0, 2500)
        );

        if (
            !apiData ||
            typeof apiData !== 'object' ||
            apiData.success === false
        ) {
            return reply(
                '❌ *MP3 DOWNLOAD FAILED*\n\n' +
                String(apiData?.message || 'API එකෙන් audio ලබාගත නොහැක.')
            );
        }

        const data = apiData.data || apiData.result || apiData;

        const audioUrl = findAudioUrl(data);

        const title = String(
            data.title || apiData.title || 'THENUVA AUDIO'
        ).slice(0, 180);

        if (!audioUrl) {
            console.error('[MP3] No audio URL found.');

            return reply(
                '❌ API response එකේ audio URL එක හඳුනාගත නොහැක.\n\n' +
                'GitHub Actions logs වල [MP3] API response පරීක්ෂා කරන්න.'
            );
        }

        console.log('[MP3] Audio URL received:', true);

        // 2. Download the actual audio file
        const fileResponse = await axios.get(audioUrl, {
            responseType: 'arraybuffer',
            timeout: 180000,
            maxContentLength: MAX_AUDIO_SIZE,
            maxBodyLength: MAX_AUDIO_SIZE,
            maxRedirects: 10,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                Accept: 'audio/mpeg, audio/*, application/octet-stream, */*'
            },
            validateStatus: () => true
        });

        if (fileResponse.status === 401 || fileResponse.status === 403) {
            return reply(
                '❌ Download server එකෙන් අවසර ලබා දුන්නේ නැහැ.'
            );
        }

        if (fileResponse.status === 404) {
            return reply('❌ Audio download link එක හමු වුණේ නැහැ.');
        }

        if (fileResponse.status === 429) {
            return reply(
                '⏳ Server rate limit එකට පැමිණ ඇත. පසුව නැවත උත්සාහ කරන්න.'
            );
        }

        if (
            fileResponse.status < 200 ||
            fileResponse.status >= 300
        ) {
            return reply(
                `❌ Audio download අසාර්ථකයි. HTTP ${fileResponse.status}`
            );
        }

        const contentType = String(
            fileResponse.headers['content-type'] || ''
        ).toLowerCase();

        const audioBuffer = Buffer.from(fileResponse.data || []);

        if (!audioBuffer.length) {
            return reply('❌ ලැබුණු audio file එක හිස්.');
        }

        if (audioBuffer.length > MAX_AUDIO_SIZE) {
            return reply('❌ Audio file එක 50 MB සීමාව ඉක්මවා ඇත.');
        }

        // 3. Reject HTML/JSON instead of sending as audio
        const beginning = audioBuffer
            .subarray(0, 512)
            .toString('utf8')
            .trimStart()
            .toLowerCase();

        if (
            contentType.includes('text/html') ||
            contentType.includes('application/json') ||
            beginning.startsWith('<!doctype html') ||
            beginning.startsWith('<html') ||
            beginning.startsWith('{')
        ) {
            console.error(
                '[MP3] Non-audio response:',
                contentType
            );

            return reply(
                '❌ Download URL එකෙන් MP3 file එකක් වෙනුවට webpage/API response එකක් ලැබුණා.'
            );
        }

        // 4. Check common MP3 signatures
        const isMP3 =
            audioBuffer.length >= 3 &&
            audioBuffer.toString('ascii', 0, 3) === 'ID3';

        const hasMpegFrame =
            audioBuffer.length >= 2 &&
            audioBuffer[0] === 0xff &&
            (audioBuffer[1] & 0xe0) === 0xe0;

        const isM4A =
            audioBuffer.length >= 12 &&
            audioBuffer.toString('ascii', 4, 8) === 'ftyp';

        if (!isMP3 && !hasMpegFrame && !isM4A) {
            console.error(
                '[MP3] Unknown audio signature:',
                contentType,
                audioBuffer.subarray(0, 16).toString('hex')
            );

            return reply(
                '❌ ලැබුණු file එක හඳුනාගත හැකි MP3/audio format එකක් නොවේ.'
            );
        }

        if (isM4A) {
            return reply(
                '❌ API එකෙන් MP3 වෙනුවට M4A file එකක් ලැබුණා. ' +
                'API එකෙන් MP3 format එක ඉල්ලිය යුතුයි.'
            );
        }

        // 5. Send MP3 as WhatsApp audio
        const safeTitle = title
            .replace(/[\\/:*?"<>|\r\n]/g, '')
            .slice(0, 120) || 'THENUVA-AUDIO';

        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${safeTitle}.mp3`,
            ptt: false
        }, {
            quoted: mek
        });

        console.log('[MP3] Sent successfully:', safeTitle);

    } catch (error) {
        const status = error.response?.status;

        console.error('[MP3 ERROR]', {
            status: status || 'Unknown',
            code: error.code || 'Unknown',
            message: error.message
        });

        if (status === 401 || status === 403) {
            return reply(
                '❌ API authorization අසාර්ථකයි. API key එක පරීක්ෂා කරන්න.'
            );
        }

        if (status === 429) {
            return reply(
                '⏳ API rate limit එකට පැමිණ ඇත. පසුව නැවත උත්සාහ කරන්න.'
            );
        }

        if (
            error.code === 'ECONNABORTED' ||
            error.code === 'ETIMEDOUT'
        ) {
            return reply('⏳ API timeout. නැවත උත්සාහ කරන්න.');
        }

        return reply(
            '❌ MP3 download අසාර්ථකයි.\n' +
            String(error.message || 'Unknown error')
        );

    } finally {
        activeRequests.delete(from);
    }
});
