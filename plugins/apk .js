const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "apk",
    alias: ["playstore", "app", "downloadapk"],
    react: "📦",
    desc: "Get Google Play Store app information",
    category: "download",
    filename: __filename,
  },

  async (danuwa, mek, m, { from, q, pushname, reply }) => {
    try {
      const targetJid =
        typeof from === "string"
          ? from
          : mek?.key?.remoteJid;

      if (!targetJid) return;

      if (!q) {
        return reply(
          "⚠️ *Google Play Store link එකක් දෙන්න!*\n\n" +
          "📌 Example:\n" +
          ".apk https://play.google.com/store/apps/details?id=com.whatsapp"
        );
      }

      let playUrl = q.trim();
      let packageId = "";

      // Get package ID
      try {
        const parsed = new URL(playUrl);

        if (
          parsed.hostname === "play.google.com" ||
          parsed.hostname.endsWith(".play.google.com")
        ) {
          packageId = parsed.searchParams.get("id") || "";
        }
      } catch (e) {
        // Invalid URL
      }

      // Package ID directly given
      if (
        !packageId &&
        /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)+$/.test(playUrl)
      ) {
        packageId = playUrl;

        playUrl =
          "https://play.google.com/store/apps/details?id=" +
          packageId;
      }

      if (!packageId) {
        return reply(
          "❌ *Invalid Play Store Link!*\n\n" +
          "මේ වගේ link එකක් භාවිතා කරන්න:\n" +
          "https://play.google.com/store/apps/details?id=com.whatsapp"
        );
      }

      // Loading
      const loadingMsg = await danuwa.sendMessage(
        targetJid,
        {
          text:
            "╭────────────────────────╮\n" +
            "│   ⚡ *THENUVA X MD* ⚡   │\n" +
            "╰────────────────────────╯\n\n" +
            "🔎 *PLAY STORE SEARCHING...*\n" +
            "⏳ Fetching app information..."
        },
        { quoted: mek }
      );

      // Request Play Store
      const response = await axios.get(playUrl, {
        timeout: 20000,

        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; K) " +
            "AppleWebKit/537.36 " +
            "(KHTML, like Gecko) " +
            "Chrome/151.0.0.0 Mobile Safari/537.36",

          "Accept-Language": "en-US,en;q=0.9"
        }
      });

      const html = response.data;

      if (!html || typeof html !== "string") {
        throw new Error("Play Store response unavailable");
      }

      // Extract meta data
      function getMeta(name) {
        const regex = new RegExp(
          '<meta[^>]+(?:property|name)=["\']' +
            name +
            '["\'][^>]+content=["\']([^"\']+)["\']',
          "i"
        );

        const match = html.match(regex);

        return match ? match[1] : "";
      }

      function decode(value) {
        return String(value || "")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">");
      }

      // App name
      let appName =
        getMeta("og:title") ||
        getMeta("twitter:title") ||
        "Google Play Application";

      appName = decode(appName)
        .replace(/\s*-\s*Apps on Google Play$/i, "")
        .trim();

      // Description
      let description =
        getMeta("og:description") ||
        getMeta("description") ||
        "No description available.";

      description = decode(description)
        .replace(/\s+/g, " ")
        .trim();

      if (description.length > 300) {
        description =
          description.substring(0, 300) + "...";
      }

      // App icon
      let icon =
        getMeta("og:image") ||
        getMeta("twitter:image") ||
        "";

      icon = decode(icon);

      // Canonical URL
      let officialUrl = playUrl;

      const canonicalMatch = html.match(
        /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i
      );

      if (canonicalMatch && canonicalMatch[1]) {
        officialUrl = decode(canonicalMatch[1]);
      }

      // Information message
      let infoText = "";

      infoText +=
        "╭────────────────────────────╮\n";
      infoText +=
        "│     📦 *THENUVA X MD* 📦    │\n";
      infoText +=
        "╰────────────────────────────╯\n\n";

      infoText +=
        `👋 *Hello ${pushname || "User"}!*\n\n`;

      infoText +=
        "╭────────────────────────────╮\n";

      infoText +=
        `│ 📱 *App:* ${appName}\n`;

      infoText +=
        `│ 🆔 *Package:* ${packageId}\n`;

      infoText +=
        "│ 🏪 *Source:* Google Play Store\n";

      infoText +=
        "│ 🔐 *Official:* ✅\n";

      infoText +=
        "╰────────────────────────────╯\n\n";

      infoText +=
        `📝 *Description:*\n${description}\n\n`;

      infoText +=
        "📲 *INSTALL / DOWNLOAD*\n";

      infoText +=
        "━━━━━━━━━━━━━━━━━━━━\n";

      infoText +=
        `${officialUrl}\n\n`;

      infoText +=
        "⚡ *THENUVA X MD*\n";

      infoText +=
        "🚀 *Powered by THENUVA*";

      // Send icon + information
      if (icon) {
        try {
          await danuwa.sendMessage(
            targetJid,
            {
              image: {
                url: icon
              },
              caption: infoText
            },
            {
              quoted: mek
            }
          );
        } catch (imageError) {
          await danuwa.sendMessage(
            targetJid,
            {
              text: infoText
            },
            {
              quoted: mek
            }
          );
        }
      } else {
        await danuwa.sendMessage(
          targetJid,
          {
            text: infoText
          },
          {
            quoted: mek
          }
        );
      }

      // Edit loading message
      try {
        await danuwa.sendMessage(
          targetJid,
          {
            text:
              "╭────────────────────────╮\n" +
              "│       ✅ *SUCCESS*       │\n" +
              "╰────────────────────────╯\n\n" +
              `📱 *${appName}* found successfully!\n\n` +
              "📲 Official Google Play Store link has been sent.",
            edit: loadingMsg.key
          },
          {
            quoted: mek
          }
        );
      } catch (editError) {
        console.log(
          "Loading edit failed:",
          editError.message
        );
      }

    } catch (error) {
      console.error(
        "THENUVA APK ERROR:",
        error
      );

      return reply(
        "❌ *PLAY STORE ERROR*\n\n" +
        "App information ලබාගන්න බැරි වුණා.\n\n" +
        "🔗 Link එක check කරලා නැවත try කරන්න."
      );
    }
  }
);
