const { cmd, commands } = require("../command");
const getFbVideoInfo = require("@xaviabot/fb-downloader");

cmd(
  {
    pattern: "fb",
    alias: ["facebook", "fbdl"],
    react: "📥",
    desc: "Download Facebook Videos in HD/SD quality effortlessly.",
    category: "download",
    filename: __filename,
  },
  async (danuwa, mek, m, { from, quoted, body, args, q, pushname, reply }) => {
    try {
      // JID එක නිවැරදිව ලබා ගැනීම
      const targetJid = typeof from === 'string' ? from : (mek.key.remoteJid || String(from));

      // 1. ලින්ක් එක ලබා දී ඇත්දැයි සහ එය නිවැරදිදැයි පරීක්ෂා කිරීම
      if (!q) {
        return reply("⚠️ *කරුණාකර වලංගු Facebook වීඩියෝ ලින්ක් එකක් ඇතුළත් කරන්න!* \n_Example: .fb https://facebook.com..._");
      }

      const fbRegex = /(https?:\/\/)?(www\.)?(facebook|fb)\.com\/.+/;
      if (!fbRegex.test(q)) {
        return reply("❌ *වැරදි ලින්ක් එකක්! කරුණාකර නැවත පරීක්ෂා කර උත්සාහ කරන්න.*");
      }

      // 2. දත්ත ලබා ගන්නා තෙක් 'Loading' පණිවිඩය යැවීම
      const loadingMsg = await danuwa.sendMessage(targetJid, { 
        text: `⚡ *CYBER THENUWA FETCHING DATA...*` 
      }, { quoted: mek });

      // 3. API මඟින් වීඩියෝ තොරතුරු ලබා ගැනීම
      const videoData = await getFbVideoInfo(q);
      if (!videoData || (!videoData.sd && !videoData.hd)) {
        return await danuwa.sendMessage(targetJid, { 
          text: "❌ *වීඩියෝව බාගත කිරීමට නොහැකි විය. මෙය පුද්ගලික (Private) වීඩියෝවක් හෝ කැඩුණු ලින්ක් එකක් විය හැක.*", 
          edit: loadingMsg.key 
        });
      }

      const { title, sd, hd } = videoData;
      
      // pushname එක Welcome සෙක්ෂන් එකට එකතු කර සකස් කළ විස්තර පත්‍රිකාව
      let detailsText = `👋 HELLOW ${pushname || "User"} ❤️ Welcome to\n`;
      detailsText += `CYBER X THENULA\n\n`;
      detailsText += `✅THENUWA X MD✅\n`;
      detailsText += `╭───────────────────.★*\n`;
      detailsText += `│  ◦ 📝 *Title :* ${title || "Facebook Video"}\n`;
      detailsText += `│  ◦ 🌐 *Url :* ${q}\n`;
      detailsText += `│  ◦ 🎬 *Quality :* ${hd ? "HD Available" : "SD Only"}\n`;
      detailsText += `│  ◦ ⚡ *HD [High] :* ${hd ? "✅" : "❌"}\n`;
      detailsText += `│  ◦ 🖼️ *Standard [Standard] :* ${sd ? "✅" : "❌"}\n`;
      detailsText += `╰───────────────────.★*\n\n`;
      detailsText += `╭───────────────╼\n`;
      detailsText += `│👨‍💻 CYBER-TEAM 🥷\n`;
      detailsText += `╰───────────────╼\n\n`;
      detailsText += `📥 *DOWNLOADING VIDEO FILE* 📥\n`;
      detailsText += `─── ── ─●●●─ ── ───\n\n\n`;

      // විස්තර පණිවිඩය යාවත්කාලීන කිරීම (Baileys නිවැරදි ව්‍යුහය)
      await danuwa.sendMessage(targetJid, { 
        text: detailsText,
        edit: loadingMsg.key,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363403804248705@newsletter",
            newsletterName: "CYBER XMD",
            serverMessageId: 1
          }
        }
      });

      // 4. තත්ත්වයෙන් උසස්ම වීඩියෝ ලින්ක් එක තෝරා ගැනීම
      const downloadUrl = hd || sd;
      const finalQuality = hd ? "HD Quality" : "SD Quality";

      // 5. වීඩියෝ ෆයිල් එක සෘජුවම WhatsApp වෙත අප්ලෝඩ් කිරීමේ Caption එක
      let videoCaption = `✅ *DOWNLOAD SUCCESS* ✅\n`;
      videoCaption += `╭───────────────────.★*\n`;
      videoCaption += `│  ◦ 👤 *User :* ${pushname || "User"}\n`;
      videoCaption += `│  ◦ 🎞️ *Status :* Successfully Sent\n`;
      videoCaption += `│  ◦ 🖼️ *Quality :* ${finalQuality}\n`;
      videoCaption += `╰───────────────────.★*\n\n`;
      videoCaption += `> *©⚡ POWERED by CYBER THENUWA* 🚀\n\n\n`;

      // වීඩියෝ එක යවන විට Newsletter එක පෙන්වීම
      await danuwa.sendMessage(
        targetJid,
        {
          video: { url: downloadUrl },
          caption: videoCaption,
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363403804248705@newsletter",
              newsletterName: "CYBER XMD",
              serverMessageId: 1
            }
          }
        },
        { quoted: mek }
      );

    } catch (error) {
      console.error("FB Downloader Error:", error);
      reply(`❌ *Error occurred:* ${error.message || error}`);
    }
  }
);
