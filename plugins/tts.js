const axios = require('axios');
const config = require('../config');
const { cmd, commands } = require('../command');

cmd({
    pattern: "tts",
    alias: ["say", "voice", "speak"],
    react: "🗣️",
    desc: "Convert text to speech",
    category: "convert",
    use: ".tts <text>",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(
                "╭───────────────●●►\n" +
                "│ 🗣️ *TEXT TO SPEECH*\n" +
                "├───────────────●●►\n" +
                "│\n" +
                "│ ❌ Please provide some text.\n" +
                "│\n" +
                "│ Example:\n" +
                "│ `.tts ආයුබෝවන්`\n" +
                "│ `.tts Hello everyone`\n" +
                "│\n" +
                "╰───────────────●●►"
            );
        }

        // API key from config.env / Railway Variables
        const apiKey =
            process.env.MR_THINUZZ_API_KEY ||
            config.MR_THINUZZ_API_KEY;

        if (!apiKey) {
            return reply(
                "❌ *API KEY NOT CONFIGURED*\n\n" +
                "Add `MR_THINUZZ_API_KEY` to your config.env " +
                "or Railway Variables."
            );
        }

        await conn.sendMessage(from, {
            text:
                "⏳ *Creating Voice...*\n\n" +
                "🗣️ Please wait..."
        }, { quoted: mek });

        const apiUrl =
            "https://mr-thinuzz-api-build.vercel.app/api/tts";

        const response = await axios.get(apiUrl, {
            params: {
                text: q.trim(),
                apiKey: apiKey
            },
            timeout: 60000
        });

        const result = response.data;

        if (!result || result.status !== true) {
            return reply(
                "❌ *TTS FAILED*\n\n" +
                "The API did not return a valid response."
            );
        }

        const data = result.data;

        if (!data || !data.audio_url) {
            return reply(
                "❌ *AUDIO NOT FOUND*\n\n" +
                "The TTS API did not return an audio URL."
            );
        }

        const audioUrl = data.audio_url;

        // Download generated MP3
        const audioResponse = await axios.get(audioUrl, {
            responseType: "arraybuffer",
            timeout: 60000
        });

        const audioBuffer = Buffer.from(audioResponse.data);

        // Send as WhatsApp audio
        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: "audio/mpeg",
            fileName: "thenuva-tts.mp3",
            ptt: false
        }, { quoted: mek });

        console.log(
            `[TTS] Sent: ${data.text || q.trim()} | ` +
            `Language: ${data.language || "unknown"} | ` +
            `Gender: ${data.gender || "unknown"}`
        );

    } catch (error) {
        console.error(
            "[TTS ERROR]",
            error.response?.data || error.message
        );

        let message = "❌ *TTS FAILED*";

        if (error.response?.status === 401) {
            message += "\n\n🔑 Invalid or missing API key.";
        } else if (error.response?.status === 429) {
            message += "\n\n⏳ API limit reached. Please try again later.";
        } else if (error.code === "ECONNABORTED") {
            message += "\n\n⏱️ API request timed out.";
        } else {
            message +=
                "\n\nPlease try again with different text.";
        }

        return reply(message);
    }
});
