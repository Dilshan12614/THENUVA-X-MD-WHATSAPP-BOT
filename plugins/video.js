const axios = require('axios');
const config = require('../config');
const { cmd, commands } = require('../command');

cmd({
    pattern: "video",
    alias: ["ytmp4", "playvideo", "mp4"],
    react: "🎬",
    desc: "Download YouTube video as MP4",
    category: "download",
    use: ".video <YouTube URL>",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(
                "╭───────────────●●►\n" +
                "│ 🎬 *YOUTUBE MP4*\n" +
                "├───────────────●●►\n" +
                "│\n" +
                "│ ❌ Please provide a YouTube URL.\n" +
                "│\n" +
                "│ Example:\n" +
                "│ `.video https://youtu.be/xxxxx`\n" +
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

        // API key from config.env / Railway Variables
        const apiKey =
            process.env.MR_THINUZZ_API_KEY ||
            config.MR_THINUZZ_API_KEY;

        if (!apiKey) {
            return reply(
                "❌ *API KEY NOT CONFIGURED*\n\n" +
                "Add `MR_THINUZZ_API_KEY` to your config.env file " +
                "or Railway Variables."
            );
        }

        await conn.sendMessage(from, {
            text: "⏳ *Downloading MP4...*\n\n🎬 Please wait..."
        }, { quoted: mek });

        const apiUrl =
            "https://mr-thinuzz-api-build.vercel.app/api/ytmp4v3/download-all";

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
                "❌ *MP4 DOWNLOAD FAILED*\n\n" +
                "The API did not return a valid video file."
            );
        }

        const data = result.data;

        if (!data || !data.links || !data.links.video) {
            return reply(
                "❌ *VIDEO NOT FOUND*\n\n" +
                "The API response did not contain an MP4 download link."
            );
        }

        const videoUrl = data.links.video;

        const title = data.title || "YouTube Video";

        const filename =
            data.filename ||
            `${title.replace(/[\\/:*?"<>|]/g, '')}.mp4`;

        // Download MP4 into buffer
        const videoResponse = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: 120000
        });

        const videoBuffer = Buffer.from(videoResponse.data);

        // Send MP4 as WhatsApp video
        await conn.sendMessage(from, {
            video: videoBuffer,
            mimetype: "video/mp4",
            fileName: filename,
            caption:
                `╭───────────────●●►\n` +
                `│ 🎬 *THENUVA X MD*\n` +
                `├───────────────●●►\n` +
                `│\n` +
                `│ 📌 *${title}*\n` +
                `│\n` +
                `│ 🎥 MP4 Video\n` +
                `│\n` +
                `╰───────────────●●►`
        }, { quoted: mek });

        console.log(`[VIDEO] Sent: ${filename}`);

    } catch (error) {
        console.error(
            "[VIDEO ERROR]",
            error.response?.data || error.message
        );

        let message = "❌ *MP4 DOWNLOAD FAILED*";

        if (error.response?.status === 401) {
            message += "\n\n🔑 Invalid or missing API key.";
        } else if (error.response?.status === 429) {
            message += "\n\n⏳ API limit reached. Please try again later.";
        } else if (error.code === "ECONNABORTED") {
            message += "\n\n⏱️ API request timed out.";
        } else {
            message +=
                "\n\nPlease try again with another YouTube URL.";
        }

        return reply(message);
    }
});
