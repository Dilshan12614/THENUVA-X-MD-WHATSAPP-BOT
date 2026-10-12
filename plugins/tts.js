const { cmd } = require('../command');

const API_BASE = 'https://sasa-dev-api.xyz/api/tools/tts';
const API_KEY = process.env.SASA_TTS_API_KEY;

const FOOTER = 'THENUVA X MD • Powered by Dilshan Ashinsa';

cmd({
    pattern: 'tts',
    alias: ['say', 'speak'],
    react: '🗣️',
    desc: 'Convert text to speech',
    category: 'tools',
    use: '.tts <text>',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const text = String(q || '').trim();

        if (!text) {
            return await reply(
                '🗣️ *THENUVA X MD TEXT TO SPEECH*\n\n' +
                'භාවිතය:\n' +
                '.tts Hello everyone\n\n' +
                'Sinhala:\n' +
                '.tts ආයුබෝවන්'
            );
        }

        if (!API_KEY) {
            return await reply(
                '❌ SASA_TTS_API_KEY Railway Variables වල නැහැ.'
            );
        }

        if (text.length > 500) {
            return await reply(
                '⚠️ කරුණාකර අකුරු 500කට අඩු text එකක් දෙන්න.'
            );
        }

        await reply('⏳ *Voice එක සකස් කරමින්...*');

        const lang = /[\u0D80-\u0DFF]/.test(text)
            ? 'si'
            : 'en';

        const apiUrl = new URL(API_BASE);
        apiUrl.searchParams.set('apikey', API_KEY);
        apiUrl.searchParams.set('text', text);
        apiUrl.searchParams.set('lang', lang);

        const response = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
                Accept: 'application/json, audio/mpeg, audio/*'
            },
            signal: AbortSignal.timeout(60000)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                '[TTS API ERROR]',
                response.status,
                errorText.slice(0, 500)
            );

            return await reply(
                `❌ TTS API error: HTTP ${response.status}`
            );
        }

        const contentType =
            response.headers.get('content-type') || '';

        // If the API directly returns audio bytes
        if (contentType.startsWith('audio/')) {
            const audioBuffer = Buffer.from(
                await response.arrayBuffer()
            );

            if (!audioBuffer.length) {
                throw new Error('Empty audio response');
            }

            await conn.sendMessage(from, {
                audio: audioBuffer,
                mimetype: contentType.includes('mpeg')
                    ? 'audio/mpeg'
                    : contentType,
                fileName: 'THENUVA-X-MD-TTS.mp3',
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true
                }
            }, { quoted: mek });

            return;
        }

        // Otherwise inspect JSON response
        if (contentType.includes('application/json')) {
            const data = await response.json();

            console.log(
                '[TTS API RESPONSE]',
                JSON.stringify(data).slice(0, 1500)
            );

            const audioUrl =
                data?.result?.url ||
                data?.result?.audio ||
                data?.result?.audioUrl ||
                data?.result?.download_url ||
                data?.url ||
                data?.audioUrl ||
                data?.audio_url ||
                data?.download_url;

            if (typeof audioUrl === 'string' &&
                /^https?:\/\//i.test(audioUrl)) {
                await conn.sendMessage(from, {
                    audio: { url: audioUrl },
                    mimetype: 'audio/mpeg',
                    fileName: 'THENUVA-X-MD-TTS.mp3',
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true
                    }
                }, { quoted: mek });

                return;
            }

            throw new Error(
                data?.message ||
                data?.error ||
                'API response contains no recognised audio URL. Check Railway logs.'
            );
        }

        const body = await response.text();

        console.error(
            '[TTS UNKNOWN RESPONSE]',
            contentType,
            body.slice(0, 500)
        );

        throw new Error(
            `Unsupported API response: ${contentType || 'unknown content type'}`
        );

    } catch (error) {
        console.error('[TTS ERROR]', error);

        await reply(
            '❌ Voice එක සකස් කරන්න බැරි වුණා.\n' +
            'Railway logs වල [TTS API RESPONSE] හෝ [TTS ERROR] පරීක්ෂා කරන්න.'
        );
    }
});
