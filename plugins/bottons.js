const { cmd } = require("../command");

cmd(
  {
    pattern: "buttons",
    alias: ["btn", "button"],
    react: "🔘",
    desc: "Show bot buttons",
    category: "main",
    filename: __filename,
  },

  async (
    conn,
    mek,
    m,
    {
      from,
      quoted,
      pushname,
      reply
    }
  ) => {
    try {

      const buttons = [
        {
          buttonId: ".menu",
          buttonText: {
            displayText: "📜 MENU"
          },
          type: 1
        },
        {
          buttonId: ".alive",
          buttonText: {
            displayText: "⚡ ALIVE"
          },
          type: 1
        },
        {
          buttonId: ".ping",
          buttonText: {
            displayText: "🏓 PING"
          },
          type: 1
        }
      ];

      const text = `╭──────────────●●►
│ 🤖 *CYBER THENUVA X MD*
│
│ 👋 Hello *${pushname || "User"}*
│
│ 🔘 Select an option
╰──────────────●●►`;

      const footer = "⚡ POWERED BY THENULA";

      /*
       * IMPORTANT:
       * quoted undefined නම් quoted option එක
       * කිසිම විදිහකට sendMessage එකට නොදෙන්න.
       */

      const options = {};

      if (quoted) {
        options.quoted = quoted;
      }

      await conn.sendMessage(
        from,
        {
          text: text,
          footer: footer,
          buttons: buttons,
          headerType: 1
        },
        options
      );

    } catch (error) {

      console.error("❌ BUTTON ERROR:", error);

      try {
        await reply(
          "❌ Button message එක send කරන්න බැරි වුණා.\n\n" +
          "Error: " + error.message
        );
      } catch (e) {
        console.error("Reply error:", e);
      }
    }
  }
);
