const { cmd } = require('../command');
const yts = require('yt-search');

const API_URL = 'https://sasa-dev-api.xyz/api/yt/mp3-dl';
const API_KEY = process.env.SASA_YTMP3_API_KEY;

const FOOTER =
    '> ᴛʜᴇɴᴜᴡᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa';

const pendingSongs = new Map();
const activeChats = new Set();

function safeFileName(name) {
    return String(name || 'THENUVA-X-MD')
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 100) || 'THENUVA-X-MD';
}

function getAudioUrl(data) {
    const keys = [
        'download_url',
        'downloadUrl',
        'audio_url',
        'audioUrl',
        'url',
        'link'
    ];

    const queue = [data];
    const seen = new Set();

    while (queue.length) {
        const item = queue.shift();

        if (!item || typeof item !== 'object' || seen.has(item)) {
            continue;
        }

        seen.add(item);

        for (const key of keys) {
            const value = item[key];

            if (
                typeof value === 'string' &&
                /^https?:\/\//i.test(value)
            ) {
                return value;
            }
        }

        for (const value of Object.values(item)) {
            if (value && typeof value === 'object') {
                queue.push(value);
            }
        }
    }

    return null;
}

async function downloadSong(conn, mek, from, reply, query) {
    if (activeChats.has(from)) {
        return reply('⏳ මේ chat එකේ download එකක් දැනටමත් සිදුවෙනවා.');
    }

    activeChats.add(from);

    try {
        if (!API_KEY) {
            return reply(
                '❌ SASA_YTMP3_API_KEY එක GitHub Secrets / Railway Variables වල සකස් කරන්න.\n\n' +
                FOOTER
            );
        }

        await conn.sendMessage(from, {
            react: { text: '🔎', key: mek.key }
        });

        const search = await yts(query);
        const song = search?.videos?.[0];

        if (!song?.url) {
            return reply('❌ ඒ නමට ගැළපෙන YouTube සින්දුවක් හමු වුණේ නැහැ.');
        }

        await reply(
            '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━╮\n' +
            '┃ 🎵 *MP3 DOWNLOAD*\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            `┃ 📌 ${song.title}\n` +
            '┃ ⏳ සින්දුව සකස් කරමින්...\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );

        const endpoint = new URL(API_URL);
        endpoint.searchParams.set('apikey', API_KEY);
        endpoint.searchParams.set('url', song.url);
        endpoint.searchParams.set('quality', '128');
        endpoint.searchParams.set('raw', 'false');

        const apiResponse = await fetch(endpoint, {
            signal: AbortSignal.timeout(180000)
        });

        const contentType = (
            apiResponse.headers.get('content-type') || ''
        ).toLowerCase();

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();

            console.error(
                '[SASA MP3 ERROR]',
                apiResponse.status,
                errorText.slice(0, 500)
            );

            throw new Error(
                `SASA API HTTP ${apiResponse.status}. පසුව නැවත උත්සාහ කරන්න.`
            );
        }

        let audioBuffer;
        let title = song.title;

        if (
            contentType.includes('audio/') ||
            contentType.includes('application/octet-stream')
        ) {
            audioBuffer = Buffer.from(await apiResponse.arrayBuffer());
        } else {
            const responseData = await apiResponse.json();

            if (
                responseData?.success === false ||
                responseData?.status === false
            ) {
                throw new Error(
                    responseData?.message ||
                    responseData?.error ||
                    'API එකෙන් download එක අසාර්ථක බව දන්වා ඇත.'
                );
            }

            const audioUrl = getAudioUrl(responseData);

            if (!audioUrl) {
                console.error(
                    '[SASA MP3 RESPONSE]',
                    JSON.stringify(responseData).slice(0, 1500)
                );

                throw new Error(
                    'API response එකේ audio download URL එක හමු වුණේ නැහැ.'
                );
            }

            title =
                responseData?.data?.title ||
                responseData?.title ||
                song.title;

            const audioResponse = await fetch(audioUrl, {
                signal: AbortSignal.timeout(180000)
            });

            if (!audioResponse.ok) {
                throw new Error(
                    `Audio download HTTP ${audioResponse.status}`
                );
            }

            const audioType = (
                audioResponse.headers.get('content-type') || ''
            ).toLowerCase();

            if (
                audioType.includes('text/html') ||
                audioType.includes('application/json')
            ) {
                throw new Error('Download URL එකෙන් audio file එකක් ලැබුණේ නැහැ.');
            }

            audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
        }

        if (!audioBuffer?.length) {
            throw new Error('ලැබුණු audio file එක හිස්.');
        }

        if (audioBuffer.length > 64 * 1024 * 1024) {
            throw new Error('Audio file එක 64 MB සීමාව ඉක්මවයි.');
        }

        const filename = safeFileName(title);

        await conn.sendMessage(
            from,
            {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${filename}.mp3`,
                ptt: false
            },
            { quoted: mek }
        );

        await conn.sendMessage(from, {
            react: { text: '✅', key: mek.key }
        });

    } catch (error) {
        console.error('[MP3 DOWNLOAD ERROR]', error.message);

        await reply(
            '╭━━〔 *ᴍᴘ3 ғᴀɪʟᴇᴅ* 〕━━╮\n' +
            `┃ ❌ ${error.message}\n` +
            '┃ නැවත ටික වේලාවකින් උත්සාහ කරන්න.\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );
    } finally {
        activeChats.delete(from);
    }
}

cmd({
    pattern: 'mp3',
    alias: ['song', 'audio', 'ytmp3'],
    react: '🎵',
    desc: 'Search and download MP3 by song name',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    const query = args.join(' ').trim();

    if (!query) {
        pendingSongs.set(from, true);

        return reply(
            '╭━━〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕━━╮\n' +
            '┃ 🎵 *MP3 SONG SEARCH*\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            '┃ සින්දුවේ නම දැන් එවන්න.\n' +
            '┃ URL එකක් අවශ්‍ය නැහැ.\n' +
            '┣━━━━━━━━━━━━━━━━━━╯\n' +
            FOOTER
        );
    }

    pendingSongs.delete(from);

    return downloadSong(conn, mek, from, reply, query);
});ක්
