const { cmd } = require('../command');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const { execFile } = require('child_process');

require('dotenv').config({ path: './config.env' });

const execFileAsync = promisify(execFile);

const API_URL = 'https://apis.davidcyril.name.ng/download/ytmp3v2';
const API_KEY = process.env.DAVIDCYRIL_API_KEY;
const MAX_SIZE = 25 * 1024 * 1024;

function isYouTubeUrl(text) {
    try {
        const url = new URL(text);
        return [
            'youtube.com',
            'www.youtube.com',
            'm.youtube.com',
            'music.youtube.com',
            'youtu.be',
            'www.youtu.be'
        ].includes(url.hostname.toLowerCase());
    } catch {
        return false;
    }
}

function safeFileName(name) {
    return String(name || 'THENUVA_AUDIO')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 90) || 'THENUVA_AUDIO';
}

async function getYouTubeUrl(query) {
    if (isYouTubeUrl(query)) return query;

    const result = await yts(query);
    const video = result?.videos?.[0];

    if (!video?.url) {
        throw new Error('ගීතය සොයාගන්න බැරි වුණා.');
    }

    return video.url;
}

async function getAudioInfo(videoUrl) {
    if (!API_KEY) {
        throw new Error('config.env තුළ DAVIDCYRIL_API_KEY එක දාන්න.');
    }

    const response = await fetch(
        `${API_URL}?url=${encodeURIComponent(videoUrl)}`,
        {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'x-api-key': API_KEY
            },
            signal: AbortSignal.timeout(60000)
        }
    );

    const text = await response.text();

    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(`API එකෙන් JSON response එකක් ලැබුණේ නැහැ (HTTP ${response.status}).`);
    }

    if (!response.ok || data.success !== true || !data.result?.download) {
        throw new Error(
            data.message ||
            data.error ||
            `API request එක අසාර්ථකයි (HTTP ${response.status}).`
        );
    }

    return data.result;
}

async function downloadAudio(url) {
    const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(120000)
    });

    if (!response.ok) {
        throw new Error(`Audio download failed: HTTP ${response.status}`);
    }

    const length = Number(response.headers.get('content-length') || 0);

    if (length > MAX_SIZE) {
        throw new Error('Audio file එක 25 MB සීමාව ඉක්මවා තිබෙනවා.');
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (!buffer.length) {
        throw new Error('Audio file එක හිස්.');
    }

    if (buffer.length > MAX_SIZE) {
        throw new Error('Audio file එක 25 MB සීමාව ඉක්මවා තිබෙනවා.');
    }

    return buffer;
}

async function convertToMp3(buffer) {
    const tempDir = await fs.promises.mkdtemp(
        path.join(os.tmpdir(), 'thenuva-mp3-')
    );

    const input = path.join(tempDir, 'audio-input');
    const output = path.join(tempDir, 'audio-output.mp3');

    try {
        await fs.promises.writeFile(input, buffer);

        await execFileAsync('ffmpeg', [
            '-hide_banner',
            '-loglevel', 'error',
            '-y',
            '-i', input,
            '-vn',
            '-codec:a', 'libmp3lame',
            '-b:a', '128k',
            '-ar', '44100',
            '-ac', '2',
            output
        ], {
            timeout: 120000,
            maxBuffer: 2 * 1024 * 1024
        });

        const mp3 = await fs.promises.readFile(output);

        if (!mp3.length) {
            throw new Error('MP3 conversion එක අසාර්ථකයි.');
        }

        if (mp3.length > MAX_SIZE) {
            throw new Error('Converted MP3 එක 25 MB සීමාව ඉක්මවා තිබෙනවා.');
        }

        return mp3;
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error('FFmpeg install කරලා නැහැ.');
        }
        throw error;
    } finally {
        await fs.promises.rm(tempDir, {
            recursive: true,
            force: true
        }).catch(() => {});
    }
}

cmd({
    pattern: 'mp3',
    alias: ['song', 'play', 'music', 'ytmp3'],
    react: '🎵',
    desc: 'Download YouTube music as MP3',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const query = String(q || '').trim();

        if (!query) {
            return reply(
                '╭─〔 *🎵 MP3 DOWNLOADER* 〕\n' +
                '│\n' +
                '│ `.mp3 ගීතයේ නම`\n' +
                '│ `.mp3 YouTube link එක`\n' +
                '│\n' +
                '╰────────────────\n\n' +
                '*ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ*'
            );
        }

        if (!API_KEY) {
            return reply('❌ config.env තුළ DAVIDCYRIL_API_KEY එක සකසන්න.');
        }

        await conn.sendMessage(from, {
            text: '⏳ *ගීතය සොයමින් MP3 එක සකස් කරනවා...*'
        }, { quoted: mek });

        const videoUrl = await getYouTubeUrl(query);
        const info = await getAudioInfo(videoUrl);

        const title = info.title || 'THENUVA_AUDIO';
        const sourceBuffer = await downloadAudio(info.download);
        const mp3Buffer = await convertToMp3(sourceBuffer);

        await conn.sendMessage(from, {
            audio: mp3Buffer,
            mimetype: 'audio/mpeg',
            fileName: `${safeFileName(title)}.mp3`,
            ptt: false
        }, { quoted: mek });

        console.log(`[THENUVA MP3] Sent: ${title}`);
    } catch (error) {
        console.error('[THENUVA MP3 ERROR]', error);

        return reply(
            '❌ *MP3 DOWNLOAD FAILED*\n\n' +
            `${error.message || 'Unknown error'}`
        );
    }
});
