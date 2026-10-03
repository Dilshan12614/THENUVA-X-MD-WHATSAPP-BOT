const { sendPluginButtons } = require('../lib/buttons');
const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");

cmd(
  {
    pattern: "apk",
    alias: ["downloadapk", "apkdl"],
    react: "📦",
    desc: "Download an APK from a direct APK URL",
    category: "download",
    filename: __filename,
  },

  async (
    danuwa,
    mek,
    m,
    { from, q, pushname, reply }
  ) => {
    let filePath = null;

    try {
      if (!q) {
        await sendPluginButtons(danuwa, from, 'apk', mek);
        return reply(
          "❌ *Direct APK link එකක් දෙන්න.*\n\n" +
          "📌 Example:\n" +
          ".apk https://example.com/app.apk"
        );
      }

      // Only HTTP/HTTPS URLs
      if (!/^https?:\/\//i.test(q)) {
        return reply(
          "❌ *වැරදි APK URL එකක්!*\n\n" +
          "Direct `.apk` download link එකක් දෙන්න."
        );
      }

      const targetJid =
        typeof from === "string"
          ? from
          : mek?.key?.remoteJid;

      if (!targetJid) {
        return reply("❌ Chat ID එක හඳුනාගන්න බැරි වුණා.");
      }

      const loading = await danuwa.sendMessage(
        targetJid,
        {
          text:
            `╭────────────────────╮\n` +
            `│ 📦 *CYBER THENUWA X MD*\n` +
            `╰────────────────────╯\n\n` +
            `⏳ *APK එක ලබාගනිමින්...*\n` +
            `👤 User: ${pushname || "User"}`
        },
        { quoted: mek }
      );

      // Download APK to temporary file
      const fileName =
        `cyber-apk-${Date.now()}.apk`;

      filePath = path.join(os.tmpdir(), fileName);

      const response = await axios({
        method: "GET",
        url: q,
        responseType: "stream",
        timeout: 120000,
        maxRedirects: 5,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Android) AppleWebKit/537.36 Chrome/151 Safari/537.36"
        }
      });

      const contentType =
        String(response.headers["content-type"] || "").toLowerCase();

      const totalSize =
        Number(response.headers["content-length"] || 0);

      // Reject obvious HTML pages
      if (
        contentType.includes("text/html") ||
        contentType.includes("text/plain")
      ) {
        throw new Error(
          "මෙය direct APK file URL එකක් නොවේ. Web page එකක් ලැබුණා."
        );
      }

      const writer = fs.createWriteStream(filePath);

      await new Promise((resolve, reject) => {
        response.data.pipe(writer);

        writer.on("finish", resolve);
        writer.on("error", reject);

        response.data.on("error", reject);
      });

      // Basic file validation
      const stat = fs.statSync(filePath);

      if (!stat.size || stat.size < 1024) {
        throw new Error(
          "APK file එක හිස් හෝ download වීම අසාර්ථකයි."
        );
      }

      // Update loading message
      await danuwa.sendMessage(
        targetJid,
        {
          text:
            `╭────────────────────╮\n` +
            `│ 📦 *CYBER THENUWA X MD*\n` +
            `╰────────────────────╯\n\n` +
            `✅ *APK Download Complete!*\n\n` +
            `📁 Size: ${formatBytes(stat.size)}\n` +
            `📤 WhatsApp වෙත upload කරමින්...`,
          edit: loading.key
        }
      );

      const caption =
        `╭────────────────────╮\n` +
        `│ 📦 *APK DOWNLOAD* \n` +
        `╰────────────────────╯\n\n` +
        `👤 *User:* ${pushname || "User"}\n` +
        `📦 *File:* ${fileName}\n` +
        `💾 *Size:* ${formatBytes(stat.size)}\n` +
        `✅ *Status:* Downloaded Successfully\n\n` +
        `> ⚡ *POWERED BY CYBER THENUWA X MD*`;

      // Send ACTUAL APK FILE
      await danuwa.sendMessage(
        targetJid,
        {
          document: {
            url: filePath
          },
          mimetype:
            "application/vnd.android.package-archive",
          fileName: fileName,
          caption: caption
        },
        { quoted: mek }
      );

      // Delete temporary file
      try {
        fs.unlinkSync(filePath);
        filePath = null;
      } catch {}

      await sendPluginButtons(danuwa, targetJid, 'apk', mek);

    } catch (error) {
      console.error("APK Downloader Error:", error);

      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }

      const message =
        error?.response?.status
          ? `HTTP ${error.response.status}`
          : error?.message || "Unknown error";

      await reply(
        `❌ *APK Download Failed!*\n\n` +
        `⚠️ ${message}\n\n` +
        `📌 Direct APK URL එකක් භාවිතා කරන්න.`
      );
    }
  }
);

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "Unknown";

  const units = ["B", "KB", "MB", "GB"];

  let i = 0;
  let size = bytes;

  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }

  return `${size.toFixed(2)} ${units[i]}`;
}
