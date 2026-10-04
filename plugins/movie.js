const axios = require('axios');
const config = require('../config');
const { cmd, commands } = require('../command');

cmd({
    pattern: "movie",
    alias: ["film", "moviedetails", "movieinfo"],
    react: "🎬",
    desc: "Get movie details",
    category: "search",
    use: ".movie <movie name>",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(
                "╭───────────────●●►\n" +
                "│ 🎬 *MOVIE SEARCH*\n" +
                "├───────────────●●►\n" +
                "│\n" +
                "│ ❌ Please enter a movie name.\n" +
                "│\n" +
                "│ Example:\n" +
                "│ `.movie New Fears Eve`\n" +
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
                "⏳ *Searching Movie...*\n\n" +
                "🎬 Please wait..."
        }, { quoted: mek });

        const apiUrl =
            "https://mr-thinuzz-api-build.vercel.app/api/awafim";

        const response = await axios.get(apiUrl, {
            params: {
                q: q.trim(),
                apiKey: apiKey
            },
            timeout: 60000
        });

        const result = response.data;

        if (!result || result.status !== true) {
            return reply(
                "❌ *MOVIE SEARCH FAILED*\n\n" +
                "No movie information was found."
            );
        }

        const data = result.data;

        if (!data || !data.title) {
            return reply(
                "❌ *MOVIE NOT FOUND*\n\n" +
                "Try another movie name."
            );
        }

        const genres = Array.isArray(data.genres)
            ? data.genres.join(", ")
            : "N/A";

        const cast = Array.isArray(data.cast)
            ? data.cast.join(", ")
            : "N/A";

        let message =
            "╭───────────────●●►\n" +
            "│ 🎬 *THENUVA X MD*\n" +
            "├───────────────●●►\n" +
            "│\n" +
            `│ 🎞️ *Title:* ${data.title || "N/A"}\n` +
            `│ 📂 *Category:* ${data.category || "N/A"}\n` +
            `│ 🎭 *Genres:* ${genres}\n` +
            `│ ⭐ *Rating:* ${data.rating || "N/A"}` +
            `${data.rating_count ? ` (${data.rating_count})` : ""}\n` +
            `│ 📅 *Release:* ${data.release_date || "N/A"}\n` +
            `│ ⏱️ *Runtime:* ${data.runtime || "N/A"}\n` +
            `│ 🌐 *Language:* ${data.language || "N/A"}\n` +
            `│\n` +
            `│ 👥 *Cast:* ${cast}\n` +
            `│\n`;

        if (data.description) {
            message +=
                `│ 📝 *Description:*\n` +
                `│ ${data.description}\n` +
                `│\n`;
        }

        message +=
            "╰───────────────●●►";

        if (data.image) {
            await conn.sendMessage(from, {
                image: {
                    url: data.image
                },
                caption: message
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, {
                text: message
            }, { quoted: mek });
        }

        if (data.trailer) {
            await conn.sendMessage(from, {
                text:
                    "🎥 *TRAILER*\n\n" +
                    `${data.trailer}`
            }, { quoted: mek });
        }

        if (data.url) {
            await conn.sendMessage(from, {
                text:
                    "🌐 *MOVIE INFO*\n\n" +
                    `${data.url}`
            }, { quoted: mek });
        }

        console.log(`[MOVIE] Found: ${data.title}`);

    } catch (error) {
        console.error(
            "[MOVIE ERROR]",
            error.response?.data || error.message
        );

        let message = "❌ *MOVIE SEARCH FAILED*";

        if (error.response?.status === 401) {
            message +=
                "\n\n🔑 Invalid or missing API key.";
        } else if (error.response?.status === 429) {
            message +=
                "\n\n⏳ API limit reached. Please try again later.";
        } else if (error.code === "ECONNABORTED") {
            message +=
                "\n\n⏱️ API request timed out.";
        } else {
            message +=
                "\n\nPlease try another movie name.";
        }

        return reply(message);
    }
});
