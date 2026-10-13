const { cmd } = require('../command');
const { ytmp3 } = require('@vreden/youtube_scraper');

cmd({
    pattern: 'mp3',
    alias: ['song', 'audio', 'ytmp3'],
    react: '🎵',
    desc: 'Download YouTube audio as MP3',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply('🎵 *සින්දුවේ නම හෝ YouTube URL එක දෙන්න.*\n\nඋදා: `.mp3 Shape of You`');
        }

        await reply('🎧 *MP3 එක සකස් කරමින්...*');

        const result = await ytmp3(q);

        console.log('[YTMP3 RESPONSE]', JSON.stringify(result, null, 2));

        const audioUrl =
            result?.download?.url ||
            result?.downloadUrl ||
            result?.download_url ||
            result?.url ||
            result?.link;

        if (!audioUrl || typeof audioUrl !== 'string') {
            return reply('❌ MP3 download link එක ලැබුණේ නැහැ. Console එකේ YTMP3 RESPONSE එක බලන්න.');
        }

        const response = await fetch(audioUrl);

        if (!response.ok) {
            throw new Error(`Audio download failed: HTTP ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
            throw new Error('Download server එකෙන් audio වෙනුවට HTML ලැබුණා.');
        }

        const audioBuffer = Buffer.from(await response.arrayBuffer());

        if (!audioBuffer.length) {
            throw new Error('Audio file එක හිස්.');
        }

        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: 'THENUVA-X-MD.mp3',
            ptt: false
        }, { quoted: mek });

    } catch (error) {
        console.error('[MP3 ERROR]', error);
        reply(`❌ MP3 එක යවන්න බැරි වුණා.\n\n${error.message}`);
    }
});
