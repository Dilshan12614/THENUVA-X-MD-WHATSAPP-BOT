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

  async (conn, mek, m, {
    from,
    quoted,
    pushname,
    reply
  }) => {

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

      await conn.sendButtonText(
        from,
        buttons,
        `╭──────────────●●►
│ 🤖 *CYBER THENUVA X MD*
│
│ 👋 Hello *${pushname || "User"}*
│
│ 🔘 Select an option below
╰──────────────●●►`,
        "⚡ POWERED BY THENULA",
        quoted
      );

    } catch (error) {

      console.error("BUTTON ERROR:", error);

      await reply(
        "❌ Button message එක send කරන්න බැරි වුණා."
      );
    }
  }
);
