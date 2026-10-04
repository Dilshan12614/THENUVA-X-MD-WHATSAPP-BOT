const axios = require('axios');
const config = require('../config');
const { cmd, commands } = require('../command');

cmd({
    pattern: "t2v",
    alias: ["textvideo", "texttovideo", "aivideo"],
    react: "🎥",
    desc: "Generate video from text prompt",
    category: "convert",
    use: ".t2v <prompt>",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(
                "╭───────────────●●►\n" +
                "│ 🎥 *TEXT TO VIDEO*\n" +
                "├───────────────●●►\n" +
                "│\n" +
                "│ ❌ Please provide a video prompt.\n" +
                "│\n" +
                "│ Example:\n" +
                "│ `.t2v A boy running`\n" +
                "│\n" +
                "│ `.t2v A car driving at night`\n" +
                "│\n" +
                "╰───────────────●●►"
            );
        }

        const apiKey =
            process.env.MR_THINUZZ_API_KEY ||
            config.MR_THINUZZ_API_KEY;

        if (!apiKey) {
            return reply(
                "❌ *API KEY NOT CONFIGURED*\n\n" +
                "Add `MR_THINUZZ_API_KEY` to your Railway Variables."
            );
        }

        await conn.sendMessage(from, {
            text:
                "⏳ *GENERATING VIDEO...*\n\n" +
                "🎥 Prompt: " + q.trim() + "\n\n" +
                "⚡ Please wait..."
        }, { quoted: mek });

        const apiUrl =
            "https://mr-thinuzz-api-build.vercel.app/api/text-to-video";

        const response = await axios.get(apiUrl, {
            params: {
                prompt: q.trim(),
                apiKey: apiKey
            },
            timeout: 120000
        });

        const result = response.data;

        if (!result || result.status !== true) {
            return reply(
                "❌ *VIDEO GENERATION FAILED*\n\n" +
                "The API did not return a valid video."
            );
        }

        const data = result.data;

        if (!data || !data.url) {
            return reply(
                "❌ *VIDEO NOT FOUND*\n\n" +
                "The API did not return a video URL."
            );
        }

        const videoUrl = data.url;

        const videoResponse = await axios.get(videoUrl, {
            responseType: "arraybuffer",
            timeout: 180000,
            maxContentLength: 100 * 1024 * 1024,
            maxBodyLength: 100 * 1024 * 1024
        });

        const videoBuffer = Buffer.from(videoResponse.data);

        await conn.sendMessage(from, {
            video: videoBuffer,
            mimetype: "video/mp4",
            fileName: "thenuva-text-to-video.mp4",
            caption:
                "╭───────────────●●►\n" +
                "│ 🎥 *THENUVA X MD*\n" +
                "├───────────────●●►\n" +
                "│\n" +
                `│ 📝 *Prompt:* ${data.prompt || q.trim()}\n` +
                `│ 📐 *Ratio:* ${data.ratio || "N/A"}\n` +
                `│ 🔊 *Sound:* ${data.sound ? "ON" : "OFF"}\n` +
                "│\n" +
                "│ ✨ *Text To Video*\n" +
                "╰───────────────●●►"
        }, { quoted: mek });

        console.log(
            `[T2V] Generated: ${data.prompt || q.trim()}`
        );

    } catch (error) {
        console.error(
            "[T2V ERROR]",
            error.response?.data || error.message
        );

        let message = "❌ *TEXT TO VIDEO FAILED*";

        if (error.response?.status === 401) {
            message += "\n\n🔑 Invalid or missing API key.";
        } else if (error.response?.status === 429) {
            message += "\n\n⏳ API limit reached. Please try again later.";
        } else if (error.code === "ECONNABORTED") {
            message += "\n\n⏱️ Video generation timed out.";
        } else {
            message +=
                "\n\nPlease try again with another prompt.";
        }

        return reply(message);
    }
});
