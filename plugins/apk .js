const { cmd } = require("../command");
const axios = require("axios");

/*
 * THENUVA X MD - APK Downloader
 *
 * Your API must return:
 * {
 *   success: true,
 *   name: "App Name",
 *   version: "1.0.0",
 *   size: "25 MB",
 *   downloadUrl: "https://your-authorized-server/app.apk"
 * }
 *
 * Set your API endpoint here.
 */
const APK_API = process.env.APK_API || "https://YOUR-APK-API.example.com/api/apk";

cmd(
  {
    pattern: "apk",
    alias: ["downloadapk", "playstore"],
    react: "📦",
    desc: "Download an authorized APK file",
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
          "⚠️ *App name එකක් හෝ Play Store URL එකක් දෙන්න!*\n\n" +
          "📌 Example:\n" +
          ".apk WhatsApp\n\n" +
          "හෝ\n" +
          ".apk https://play.google.com/store/apps/details?id=com.whatsapp"
        );
      }

      // Loading message
      const loading = await danuwa.sendMessage(
        targetJid,
        {
          text:
            "╭───────────────────╮\n" +
            "│ ⚡ *THENUVA X MD* ⚡\n" +
            "╰───────────────────╯\n\n" +
            "🔎 *Fetching APK information...*\n" +
            "⏳ Please wait..."
        },
        { quoted: mek }
      );

      /*
       * Call your authorized APK API.
       *
       * API request:
       * GET /api/apk?q=WhatsApp
       */
      const response = await axios.get(APK_API, {
        params: {
          q: q.trim()
        },
        timeout: 30000,
        headers: {
          "User-Agent": "THENUVA-X-MD/1.0"
        }
      });

      const data = response.data || {};

      if (!data.success || !data.downloadUrl) {
        return await danuwa.sendMessage(
          targetJid,
          {
            text:
              "❌ *APK NOT FOUND*\n\n" +
              "The requested APK is unavailable from the configured source.",
            edit: loading.key
          },
          { quoted: mek }
        );
      }

      const appName =
        data.name ||
        data.appName ||
        "Android Application";

      const version =
        data.version ||
        "Unknown";

      const size =
        data.size ||
        "Unknown";

      const downloadUrl =
        data.downloadUrl;

      // Information message
      let info = "";

      info += "╭────────────────────────╮\n";
      info += "│     ⚡ *THENUVA X MD* ⚡\n";
      info += "╰────────────────────────╯\n\n";

      info += `👋 *Hello ${pushname || "User"}!*\n\n`;

      info += "╭────────────────────────╮\n";
      info += `│ 📱 *App :* ${appName}\n`;
      info += `│ 🔢 *Version :* ${version}\n`;
      info += `│ 📦 *Size :* ${size}\n`;
      info += `│ 🔗 *Query :* ${q}\n`;
      info += "╰────────────────────────╯\n\n";

      info += "📥 *Preparing APK file...*\n";
      info += "⏳ Please wait...";

      await danuwa.sendMessage(
        targetJid,
        {
          text: info,
          edit: loading.key
        },
        { quoted: mek }
      );

      /*
       * Send APK as WhatsApp document.
       */
      const caption =
        "╭────────────────────────╮\n" +
        "│  ✅ *DOWNLOAD SUCCESS*  │\n" +
        "╰────────────────────────╯\n\n" +
        `📱 *App:* ${appName}\n` +
        `🔢 *Version:* ${version}\n` +
        `📦 *Size:* ${size}\n` +
        `👤 *User:* ${pushname || "User"}\n\n` +
        "⚡ *THENUVA X MD*\n" +
        "🚀 *Powered by THENUVA*";

      await danuwa.sendMessage(
        targetJid,
        {
          document: {
            url: downloadUrl
          },

          mimetype:
            "application/vnd.android.package-archive",

          fileName:
            `${appName.replace(/[\\/:*?"<>|]/g, "_")}.apk`,

          caption
        },
        { quoted: mek }
      );

    } catch (error) {
      console.error("THENUVA APK ERROR:", error);

      return reply(
        "❌ *APK Download Error*\n\n" +
        `Reason: ${error.message || "Unknown error"}`
      );
    }
  }
);
```
