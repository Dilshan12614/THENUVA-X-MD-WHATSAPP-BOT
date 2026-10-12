const axios = require('axios');
const config = require('../config');
const { cmd } = require('../command');

const API_URL = 'https://apis.davidcyril.name.ng/download/y2mate?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ';
const MAX_AUDIO_SIZE = 50 * 1024 * 1024;
const activeRequests = new Set();

// ==========================================
// Extract URL from direct or Markdown links
// ==========================================
function extractUrl(value) {
    if (typeof value !== 'string') return null;

    const text = value.trim();

    // Direct URL
    if (/^https?:\/\//i.test(text)) {
        return text
            .replace(/\\&/g, '&')
            .replace(/&amp;/g, '&');
    }

    // Markdown: [URL](URL)
    const markdownMatch = text.match(
        /\]\((https?:\/\/[^)\s]+)\)/
    );

    if (markdownMatch) {
        return markdownMatch[1]
            .replace(/\\&/g, '&')
            .replace(/&amp;/g, '&');
    }

    // URL embedded in text
    const urlMatch = text.match(/https?:\/\/[^\s)]+/i);

    if (urlMatch) {
        return urlMatch[0]
            .replace(/\\&/g, '&')
            .replace(/&amp;/g, '&');
    }

    return null;
}

// ==========================================
// Find audio download URL in API response
// ==========================================
function findAudioUrl(obj) {
    if (!obj) return null;

    if (typeof obj === 'string') {
        return extractUrl(obj);
    }

    if (typeof obj !== 'object') return null;

    // Exact field from David Cyril y2mate API
    const directDownload = extractUrl(obj.result?.download);
    if (directDownload) return directDownload;

    const keys = [
        'download_url',
        'downloadUrl',
        'audio_url',
        'audioUrl',
        'mp3_url',
        'mp3Url',
        'download',
        'url',
        'link',
        'audio',
        'links',
        'data',
        'result'
    ];

    for (const key of keys) {
        if (!(key in obj)) continue;

        const value = obj[key];

        if (typeof value === 'string') {
            const found = extractUrl(value);
            if (found) return found;
        } else if (value && typeof value === 'object') {
            const found = findAudioUrl(value);
            if (found) return found;
        }
    }

    return null;
}

// ==========================================
// Validate YouTube URL
// ==========================================
function isYouTubeUrl(value) {
    try {
        const url = new URL(value);
        const host = url.hostname.toLowerCase();

        return (
            host === 'youtube.com' ||
            host.endsWith('.youtube.com') ||
            host === 'youtu.be' ||
            host === 'youtube-nocookie.com' ||
            host.endsWith('.youtube-nocookie.com')
        );
    } catch {
        return false;
    }
}

// ==========================================
// Get MP3 command
// ==========================================
cmd({
    pattern: 'mp3',
    alias: ['ytmp3', 'song', 'audio'],
    react: '🎵',
    desc: 'Download YouTube audio as MP3',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, {
    from,
    q,
    reply,
    sender
}) => {
    const requestKey = `${from}:${sender || 'user'}`;

    try {
        if (!q) {
            return reply(
                '🎵 *THENUVA X MD MP3 DOWNLOADER*\n\n' +
                'කරුණාකර YouTube link එකක් දෙන්න.\n\n' +
                '*Example:*\n.mp3 https://youtube.com/watch?v=VIDEO_ID'
            );
        }

        let youtubeUrl;

        try {
            youtubeUrl = new URL(q.trim());
        } catch {
            return reply('❌ නිවැරදි YouTube URL එකක් ලබා දෙන්න.');
        }

        if (!isYouTubeUrl(youtubeUrl.href)) {
            return reply('❌ YouTube link එකක් පමණක් ලබා දෙන්න.');
        }

        if (activeRequests.has(requestKey)) {
            return reply('⏳ ඔබගේ audio request එක දැනටමත් process වෙනවා.');
        }

        activeRequests.add(requestKey);

        await conn.sendMessage(from, {
            react: {
                text: '⏳',
                key: mek.key
            }
        });

        const apiKey =
            process.env.DAVIDCYRIL_API_KEY ||
            config.DAVIDCYRIL_API_KEY;

        const headers = {
            Accept: 'application/json',
            'User-Agent': 'THENUVA-X-MD/2.0.0'
        };

        if (apiKey) {
            headers['x-api-key'] = apiKey;
        }

        console.log('[MP3] Requesting audio:', youtubeUrl.href);

        const apiResponse = await axios.get(API_URL, {
            params: {
                url: youtubeUrl.href,
                format: 'mp3',
                quality: '128'
            },
            headers,
            timeout: 120000,
            maxContentLength: 5 * 1024 * 1024,
            maxBodyLength: 5 * 1024 * 1024,
            validateStatus: status => status >= 200 && status < 500
        });

        const apiData = apiResponse.data;

        console.log(
            '[MP3] API HTTP status:',
            apiResponse.status
        );

        if (
            apiResponse.status < 200 ||
            apiResponse.status >= 300
        ) {
            throw new Error(`API returned HTTP ${apiResponse.status}`);
        }

        if (
            !apiData ||
            typeof apiData !== 'object' ||
            apiData.success === false
        ) {
            throw new Error(
                apiData?.message || 'API did not return a successful response'
            );
        }

        const result = apiData.result || apiData.data || apiData;
        const title = result.title || 'THENUVA_X_MD_Audio';
        const audioUrl = findAudioUrl(apiData);

        console.log('[MP3] Title:', title);
        console.log('[MP3] Audio URL received:', Boolean(audioUrl));

        if (!audioUrl) {
            console.log(
                '[MP3] API response fields:',
                Object.keys(apiData).join(', ')
            );
            throw new Error('Audio download URL not found in API response');
        }

        // Do not follow links to unexpected hosts.
        const parsedAudioUrl = new URL(audioUrl);

        if (!['http:', 'https:'].includes(parsedAudioUrl.protocol)) {
            throw new Error('Invalid audio URL protocol');
        }

        console.log(
            '[MP3] Download host:',
            parsedAudioUrl.hostname
        );

        // Download the audio file
        const audioResponse = await axios.get(audioUrl, {
            responseType: 'arraybuffer',
            timeout: 180000,
            maxContentLength: MAX_AUDIO_SIZE,
            maxBodyLength: MAX_AUDIO_SIZE,
            maxRedirects: 10,
            headers: {
                Accept: 'audio/mpeg, audio/*, application/octet-stream, */*',
                'User-Agent': 'Mozilla/5.0 (compatible; THENUVA-X-MD/2.0.0)'
            },
            validateStatus: () => true
        });

        if (audioResponse.status < 200 || audioResponse.status >= 300) {
            throw new Error(
                `Audio server returned HTTP ${audioResponse.status}`
            );
        }

        const contentType = String(
            audioResponse.headers['content-type'] || ''
        ).toLowerCase();

        const audioBuffer = Buffer.from(audioResponse.data);

        if (!audioBuffer.length) {
            throw new Error('Audio server returned an empty file');
        }

        if (audioBuffer.length > MAX_AUDIO_SIZE) {
            throw new Error('Audio file exceeds the 50 MB limit');
        }

        // Reject HTML or JSON error pages returned by download tunnels
        const start = audioBuffer
            .subarray(0, 512)
            .toString('utf8')
            .trimStart()
            .toLowerCase();

        if (
            contentType.includes('text/html') ||
            start.startsWith('<!doctype html') ||
            start.startsWith('<html') ||
            start.startsWith('{"error"') ||
            start.startsWith('{"message"')
        ) {
            throw new Error(
                'Download server returned HTML/JSON instead of audio. The tunnel may have expired.'
            );
        }

        // Verify common MP3 signatures
        const hasID3 =
            audioBuffer.length >= 3 &&
            audioBuffer.subarray(0, 3).toString('ascii') === 'ID3';

        const hasMpegFrame =
            audioBuffer.length >= 2 &&
            audioBuffer[0] === 0xff &&
            (audioBuffer[1] & 0xe0) === 0xe0;

        if (!hasID3 && !hasMpegFrame) {
            throw new Error(
                `Downloaded file is not a recognizable MP3 (content-type: ${contentType || 'unknown'})`
            );
        }

        // Sanitize filename
        const safeTitle = String(
            result.filename || title
        )
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 150) || 'THENUVA_X_MD_Audio';

        const filename = safeTitle.toLowerCase().endsWith('.mp3')
            ? safeTitle
            : `${safeTitle}.mp3`;

        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: filename,
            ptt: false
        }, {
            quoted: mek
        });

        await conn.sendMessage(from, {
            react: {
                text: '✅',
                key: mek.key
            }
        });

        console.log(
            `[MP3] Sent successfully: ${filename} (${audioBuffer.length} bytes)`
        );

    } catch (error) {
        console.error('[MP3 ERROR]', {
            status: error.response?.status || 'Unknown',
            code: error.code || 'Unknown',
            message: error.message
        });

        let message = '❌ MP3 download කරන්න බැරි වුණා.';

        if (error.message.includes('401') || error.message.includes('403')) {
            message += '\n\nAPI key එක හෝ download server access එක පරීක්ෂා කරන්න.';
        } else if (
            error.message.includes('HTML/JSON') ||
            error.message.includes('not a recognizable MP3')
        ) {
            message += '\n\nDownload server එක audio වෙනුවට වෙනත් content එකක් එවලා. නැවත උත්සාහ කරන්න.';
        } else if (error.message.includes('50 MB')) {
            message += '\n\nAudio file එක 50 MB සීමාව ඉක්මවා ඇත.';
        } else {
            message += `\n\nError: ${error.message}`;
        }

        await reply(message).catch(() => {});

        await conn.sendMessage(from, {
            react: {
                text: '❌',
                key: mek.key
            }
        }).catch(() => {});

    } finally {
        activeRequests.delete(requestKey);
    }
});
