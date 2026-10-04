const axios = require('axios');
const config = require('../config');
const { cmd, commands } = require('../command');

cmd({
    pattern: "mp3",
    alias: ["ytmp3", "song", "audio"],
    react: "🎵",
    desc: "Download YouTube video as MP3",
    category: "download",
    use: ".mp3 <YouTube URL>",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(
                "╭───────────────●●►\n" +
                "│ 🎵 *YOUTUBE MP3*\n" +
                "├───────────────●●►\n" +
                "│\n" +
                "│ ❌ Please provide a YouTube URL.\n" +
                "│\n" +
                "│ Example:\n" +
                "│ `.mp3 https://youtu.be/xxxxx`\n" +
                "│\n" +
                "╰───────────────●●►"
            );
        }

        // YouTube URL validation
        const youtubeRegex =
            /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]+/i;

        if (!youtubeRegex.test(q.trim())) {
            return reply("❌ Please send a valid YouTube URL.");
        }

        // API key from config.env
        const apiKey =
            process.env.MR_THINUZZ_API_KEY ||
            config.MR_THINUZZ_API_KEY;

        if (!apiKey) {
            return reply(
                "❌ *API KEY NOT CONFIGURED*\n\n" +
                "Add `MR_THINUZZ_API_KEY` to your config.env file."
            );
        }

        await conn.sendMessage(from, {
            text: "⏳ *Downloading MP3...*\n\n🎵 Please wait..."
        }, { quoted: mek });

        const apiUrl =
            "https://mr-thinuzz-api-build.vercel.app/api/ytmp3/download";

        const response = await axios.get(apiUrl, {
            params: {
                url: q.trim(),
                apiKey: apiKey
            },
            timeout: 60000
        });

        const result = response.data;

        if (!result || result.status !== true) {
            return reply(
                "❌ *MP3 DOWNLOAD FAILED*\n\n" +
                "The API did not return a valid audio file."
            );
        }

        const data = result.data;

        if (!data || !data.links || !data.links.audio) {
            return reply(
                "❌ *AUDIO NOT FOUND*\n\n" +
                "The API response did not contain an MP3 download link."
            );
        }

        const audioUrl = data.links.audio;

        const title = data.title || "YouTube Audio";
        const filename =
            data.filename ||
            `${title.replace(/[\\/:*?"<>|]/g, '')}.mp3`;

        // Send MP3 as WhatsApp audio
        await conn.sendMessage(from, {
            audio: {
                url: audioUrl
            },
            mimetype: "audio/mpeg",
            fileName: filename,
            ptt: false
        }, { quoted: mek });

        console.log(`[MP3] Sent: ${filename}`);

    } catch (error) {
        console.error("[MP3 ERROR]", error.response?.data || error.message);

        let message = "❌ *MP3 DOWNLOAD FAILED*";

        if (error.response?.status === 401) {
            message += "\n\n🔑 Invalid or missing API key.";
        } else if (error.response?.status === 429) {
            message += "\n\n⏳ API limit reached. Please try again later.";
        } else if (error.code === "ECONNABORTED") {
            message += "\n\n⏱️ API request timed out.";
        } else {
            message += "\n\nPlease try again with another YouTube URL.";
        }

        return reply(message);
    }
});
