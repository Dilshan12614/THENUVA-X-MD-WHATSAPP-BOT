const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "apk",
    alias: ["playstore", "app", "downloadapk"],
    react: "📦",
    desc: "Get Google Play Store app details",
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
          "⚠️ *Google Play Store link එකක් හෝ App name එකක් දෙන්න!*\n\n" +
          "📌 Example:\n" +
          ".apk https://play.google.com/store/apps/details?id=com.whatsapp"
        );
      }

      let playUrl = q.trim();
      let packageId = "";

      // ─────────────────────────────
      // Extract package ID
      // ─────────────────────────────
      if (playUrl.includes("play.google.com")) {
        try {
          const parsed = new URL(playUrl);
          packageId = parsed.searchParams.get("id") || "";
        } catch {}
      }

      // If user gives package ID directly
      if (!packageId && /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)+$/.test(playUrl)) {
        packageId = playUrl;
        playUrl =
          `https://play.google.com/store/apps/details?id=${packageId}`;
      }

      // App name only
      if (!packageId) {
        return reply(
          "❌ *Package ID එක හඳුනාගන්න බැරි වුණා.*\n\n" +
          "Google Play Store link එකක් දෙන්න:\n\n" +
          ".apk https://play.google.com/store/apps/details?id=com.whatsapp"
        );
      }

      // Loading
      const loading = await danuwa.sendMessage(
        targetJid,
        {
          text:
            "╭────────────────────────╮\n" +
            "│   ⚡ *THENUVA X MD* ⚡\n" +
            "╰────────────────────────╯\n\n" +
            "🔎 *PLAY STORE SEARCHING...*\n" +
            "⏳ Fetching application information..."
        },
        { quoted: mek }
      );

      // ─────────────────────────────
      // Fetch Play Store page
      // ─────────────────────────────
      const response = await axios.get(playUrl, {
        timeout: 20000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });

      const html = response.data;

      if (!html || typeof html !== "string") {
        throw new Error("Play Store page unavailable");
      }

      // ─────────────────────────────
      // Helper
      // ─────────────────────────────
      function getMeta(property) {
        const regex = new RegExp(
          `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
          "i"
        );

        const match = html.match(regex);
        return match ? match[1] : null;
      }

      function decode(value) {
        if (!value) return "";
        return value
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">");
      }

      // ─────────────────────────────
      // Get app title
      // ─────────────────────────────
      let appName =
        getMeta("og:title") ||
        getMeta("twitter:title") ||
        "Google Play Application";

      appName = decode(appName);

      // Remove common Play Store suffix
      appName = appName
        .replace(/\s*-\s*Apps on Google Play$/i, "")
        .trim();

      // ─────────────────────────────
      // Get icon
      // ─────────────────────────────
      let icon =
        getMeta("og:image") ||
        getMeta("twitter:image") ||
        "";

      icon = decode(icon);

      // ─────────────────────────────
      // Get description
      // ─────────────────────────────
      let description =
        getMeta("og:description") ||
        getMeta("description") ||
        "No description available.";

      description = decode(description)
        .replace(/\s+/g, " ")
        .trim();

      if (description.length > 300) {
        description = description.substring(0, 300) + "...";
      }

      // ─────────────────────────────
      // Get canonical URL
      // ─────────────────────────────
      let officialUrl = playUrl;

      const canonicalMatch = html.match(
        /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i
      );

      if (canonicalMatch && canonicalMatch[1]) {
        officialUrl = decode(canonicalMatch[1]);
      }

      // ─────────────────────────────
      // Success message
      // ─────────────────────────────
      let text = "";

      text += "╭────────────────────────────╮\n";
      text += "│     📦 *THENUVA X MD* 📦    │\n";
      text += "╰────────────────────────────╯\n\n";

      text += `👋 *Hello ${pushname || "User"}!*\n\n`;

      text += "╭────────────────────────────╮\n";
      text += `│ 📱 *App:* ${appName}\n`;
      text += `│ 🆔 *Package:* ${packageId}\n`;
      text += "│ 🏪 *Source:* Google Play Store\n";
      text += "│ 🔐 *Official:* ✅\n";
      text += "╰────────────────────────────╯\n\n";

      text += `📝 *Description:*\n${description}\n\n`;

      text += "╭────────────────────────────╮\n";
      text += "│ 📥 *INSTALL / DOWNLOAD*    │\n";
      text += "╰────────────────────────────╯\n\n";

      text += `🔗 ${officialUrl}\n\n`;

      text += "📲 Open the link above to install the app\n";
      text += "directly from Google Play Store.\n\n";

      text += "⚡ *THENUVA X MD*\n";
      text += "🚀 *Powered by THENUVA*";

      // ─────────────────────────────
      // Send icon if available
      // ─────────────────────────────
      if (icon) {
        try {
          await danuwa.sendMessage(
            targetJid,
            {
              image: { url: icon },
              caption: text
            },
            { quoted: mek }
          );
        } catch {
          await danuwa.sendMessage(
            targetJid,
            { text },
            { quoted: mek }
          );
        }
      } else {
        await danuwa.sendMessage(
          targetJid,
          { text },
          { quoted: mek }
        );
      }

      // Edit loading message
      try {
        await danuwa.sendMessage(
          targetJid,
          {
            text:
              `✅ *${appName} FOUND!*\n\n` +
              "📦 Google Play Store information loaded successfully.\n" +
              "📲 Official install link has been sent above.",
            edit: loading.key
          },
          { quoted: mek }
        );
      } catch {}

    } catch (error) {
      console.error("THENUVA APK ERROR:", error);

      return reply(
        "❌ *PLAY STORE ERROR*\n\n" +
        "App එකේ Play Store information ලබාගන්න බැරි වුණා.\n\n" +
        "• Link එක public ද බලන්න\n" +
        "• Play Store URL එක නිවැරදිද බලන්න\n" +
        "• පසුව නැවත try කරන්න."
      );
    }
  }
);
```
