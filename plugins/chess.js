const { sendPluginButtons } = require('../lib/buttons');
const { cmd } = require("../command");
const { Chess } = require("chess.js");
const sharp = require("sharp");

const games = new Map();

const PIECES = {
  w: {
    p: "♙",
    n: "♘",
    b: "♗",
    r: "♖",
    q: "♕",
    k: "♔",
  },
  b: {
    p: "♟",
    n: "♞",
    b: "♝",
    r: "♜",
    q: "♛",
    k: "♚",
  },
};

const LIGHT = "#f0d9b5";
const DARK = "#b58863";

cmd(
  {
    pattern: "chess",
    alias: ["ches", "chessgame"],
    react: "♟️",
    desc: "Play Chess against CYBER THENUWA BOT",
    category: "game",
    filename: __filename,
  },

  async (
    danuwa,
    mek,
    m,
    { from, q, pushname, reply }
  ) => {
    const jid =
      typeof from === "string"
        ? from
        : mek?.key?.remoteJid;

    if (!jid) {
      return reply("❌ Chat ID එක හඳුනාගන්න බැරි වුණා.");
    }

    const input = String(q || "").trim();

    try {
      // NEW GAME
      if (!input || /^(new|start)$/i.test(input)) {
        games.set(
          jid,
          createGame(pushname || "Player")
        );

        return await sendBoard(
          danuwa,
          mek,
          jid,
          games.get(jid),
          "NEW GAME"
        );
      }

      const game = games.get(jid);

      if (!game) {
        games.set(
          jid,
          createGame(pushname || "Player")
        );

        return await sendBoard(
          danuwa,
          mek,
          jid,
          games.get(jid),
          "NEW GAME"
        );
      }

      // HELP
      if (/^(help|menu)$/i.test(input)) {
        return reply(
          `♟️ *CYBER THENUWA CHESS*\n\n` +
          `🎮 *.chess* — New Game\n` +
          `♟️ *.chess e2e4* — Move\n` +
          `↩️ *.chess undo* — Undo\n` +
          `🔄 *.chess flip* — Flip Board\n` +
          `🏳️ *.chess resign* — Resign\n` +
          `🆕 *.chess new* — New Game\n\n` +
          `📌 *Move Example:*\n` +
          `.chess e2e4\n` +
          `.chess g1f3\n` +
          `.chess e7e8q`
        );
      }

      // FLIP
      if (/^flip$/i.test(input)) {
        game.flipped = !game.flipped;

        return await sendBoard(
          danuwa,
          mek,
          jid,
          game,
          "BOARD FLIPPED"
        );
      }

      // RESIGN
      if (/^resign$/i.test(input)) {
        games.delete(jid);

        return reply(
          `🏳️ *GAME OVER*\n\n` +
          `👤 *Player:* ${game.player}\n` +
          `🤖 *Winner:* CYBER THENUWA BOT\n\n` +
          `🆕 *.chess* — New Game`
        );
      }

      // UNDO
      if (/^undo$/i.test(input)) {
        const history = game.chess.history();

        if (history.length >= 2) {
          game.chess.undo();
          game.chess.undo();
        } else if (history.length === 1) {
          game.chess.undo();
        } else {
          return reply(
            "ℹ️ *Undo කරන්න moves නැහැ.*"
          );
        }

        return await sendBoard(
          danuwa,
          mek,
          jid,
          game,
          "UNDO"
        );
      }

      // CHECK MOVE FORMAT
      const moveText = normalizeMove(input);

      if (!moveText) {
        return reply(
          `❌ *Invalid move format!*\n\n` +
          `📌 Example:\n` +
          `*.chess e2e4*\n\n` +
          `♟️ Promotion:\n` +
          `*.chess e7e8q*`
        );
      }

      // PLAYER = WHITE
      if (game.chess.turn() !== "w") {
        return reply(
          "⏳ *BOTගේ turn එක.*\nටිකක් ඉන්න..."
        );
      }

      let playerMove;

      try {
        playerMove = game.chess.move({
          from: moveText.from,
          to: moveText.to,
          ...(moveText.promotion
            ? { promotion: moveText.promotion }
            : {}),
        });
      } catch {
        playerMove = null;
      }

      if (!playerMove) {
        return reply(
          `❌ *Illegal Chess Move!*\n\n` +
          `♟️ Move: ${input}\n\n` +
          `Board එකේ legal move එකක් try කරන්න.`
        );
      }

      // PLAYER CHECKMATE / DRAW
      if (game.chess.isGameOver()) {
        return await finishGame(
          danuwa,
          mek,
          jid,
          game
        );
      }

      // BOT MOVE
      const botMove = chooseBotMove(
        game.chess
      );

      if (!botMove) {
        return await finishGame(
          danuwa,
          mek,
          jid,
          game
        );
      }

      game.chess.move({
        from: botMove.from,
        to: botMove.to,
        ...(botMove.promotion
          ? { promotion: botMove.promotion }
          : {}),
      });

      // BOT CHECKMATE / DRAW
      if (game.chess.isGameOver()) {
        return await finishGame(
          danuwa,
          mek,
          jid,
          game
        );
      }

      return await sendBoard(
        danuwa,
        mek,
        jid,
        game,
        `BOT MOVE: ${botMove.san}`
      );

    } catch (error) {
      console.error(
        "Chess Error:",
        error
      );

      return reply(
        `❌ *Chess Error!*\n\n${error.message || error}`
      );
    }
  }
);


// ================================
// CREATE GAME
// ================================

function createGame(player) {
  return {
    chess: new Chess(),
    player,
    flipped: false,
    createdAt: Date.now(),
  };
}


// ================================
// MOVE FORMAT
// ================================

function normalizeMove(input) {
  const clean = input
    .toLowerCase()
    .replace(/[\s-]/g, "");

  const match = clean.match(
    /^([a-h][1-8])([a-h][1-8])([qrbn])?$/
  );

  if (!match) {
    return null;
  }

  return {
    from: match[1],
    to: match[2],
    promotion: match[3],
  };
}


// ================================
// BOT AI
// ================================

function chooseBotMove(chess) {
  const moves =
    chess.moves({
      verbose: true,
    });

  if (!moves.length) {
    return null;
  }

  const scored = moves.map(
    (move) => {
      let score =
        Math.random() * 10;

      // Capture
      if (move.captured) {
        score += 80;
      }

      // Promotion
      if (move.promotion) {
        score += 120;
      }

      // Check
      if (
        move.san &&
        move.san.includes("+")
      ) {
        score += 70;
      }

      // Checkmate
      if (
        move.san &&
        move.san.includes("#")
      ) {
        score += 10000;
      }

      // Center
      if (
        [
          "d4",
          "e4",
          "d5",
          "e5",
        ].includes(move.to)
      ) {
        score += 8;
      }

      return {
        move,
        score,
      };
    }
  );

  scored.sort(
    (a, b) =>
      b.score - a.score
  );

  return scored[0].move;
}


// ================================
// SEND BOARD
// ================================

async function sendBoard(
  danuwa,
  mek,
  jid,
  game,
  action
) {
  const image =
    await renderBoard(
      game.chess,
      game.flipped
    );

  const turnText =
    game.chess.turn() === "w"
      ? `♙ ${game.player}'s turn`
      : "🤖 Bot's turn";

  const history =
    game.chess.history();

  const lastMove =
    history.length > 0
      ? history[history.length - 1]
      : "No moves yet";

  const caption =
    `♟️ *CYBER THENUWA X MD*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +

    `🎮 *CHESS GAME*\n\n` +

    `╭────────────────────╮\n` +
    `│ ⚡ *${action}*\n` +
    `│\n` +
    `│ 👤 *Player:* ${game.player}\n` +
    `│ 🤖 *Bot:* CYBER BOT\n` +
    `│ 🔢 *Moves:* ${history.length}\n` +
    `│ ♟️ *Turn:* ${turnText}\n` +
    `│ 📝 *Last:* ${lastMove}\n` +
    `╰────────────────────╯\n\n` +

    `📌 *HOW TO PLAY*\n` +
    `➡️ *.chess e2e4*\n\n` +

    `↩️ *.chess undo*\n` +
    `🔄 *.chess flip*\n` +
    `🆕 *.chess new*\n` +
    `🏳️ *.chess resign*\n\n` +

    `> ⚡ *POWERED BY CYBER THENUWA*`;

  await danuwa.sendMessage(
    jid,
    {
      image,
      caption,
    },
    {
      quoted: mek,
    }
  );
  await sendPluginButtons(danuwa, jid, 'chess', mek);
}


// ================================
// GAME FINISH
// ================================

async function finishGame(
  danuwa,
  mek,
  jid,
  game
) {
  let result = "DRAW";

  if (
    game.chess.isCheckmate()
  ) {
    // After a checkmate:
    // White to move = Black won
    // Black to move = White won
    result =
      game.chess.turn() === "w"
        ? "BOT"
        : "PLAYER";
  }

  const image =
    await renderBoard(
      game.chess,
      game.flipped
    );

  let title;

  if (result === "PLAYER") {
    title = "🏆 YOU WIN!";
  } else if (result === "BOT") {
    title = "🤖 BOT WINS!";
  } else {
    title = "🤝 DRAW!";
  }

  const caption =
    `♟️ *CYBER THENUWA X MD*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +

    `🎮 *CHESS GAME OVER*\n\n` +

    `╭────────────────────╮\n` +
    `│ ${title}\n` +
    `│\n` +
    `│ 👤 ${game.player}\n` +
    `│ 🤖 CYBER BOT\n` +
    `│ 🔢 Moves: ${game.chess.history().length}\n` +
    `╰────────────────────╯\n\n` +

    `🆕 *.chess* — New Game\n\n` +

    `> ⚡ *POWERED BY CYBER THENUWA*`;

  games.delete(jid);

  await danuwa.sendMessage(
    jid,
    {
      image,
      caption,
    },
    {
      quoted: mek,
    }
  );
  await sendPluginButtons(danuwa, jid, 'chess-finished', mek);
}


// ================================
// CHESS BOARD IMAGE
// ================================

async function renderBoard(
  chess,
  flipped
) {
  const size = 720;
  const square = 80;

  const files = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
  ];

  const ranks = [
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
    "1",
  ];

  const board =
    chess.board();

  const visibleFiles =
    flipped
      ? [...files].reverse()
      : files;

  const visibleRanks =
    flipped
      ? [...ranks].reverse()
      : ranks;

  let svg = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="720"
    height="790"
    viewBox="0 0 720 790">

    <rect
      width="720"
      height="790"
      fill="#10241e"/>

    <rect
      x="10"
      y="10"
      width="700"
      height="770"
      rx="28"
      fill="#183c31"/>

    <text
      x="360"
      y="45"
      text-anchor="middle"
      font-family="Arial"
      font-size="23"
      font-weight="bold"
      fill="white">
      CYBER THENUWA X MD • CHESS
    </text>

    <g transform="translate(40,70)">
  `;

  for (
    let row = 0;
    row < 8;
    row++
  ) {
    for (
      let col = 0;
      col < 8;
      col++
    ) {

      const rankIndex =
        flipped
          ? 7 - row
          : row;

      const fileIndex =
        flipped
          ? 7 - col
          : col;

      const isLight =
        (row + col) % 2 === 0;

      const x =
        col * square;

      const y =
        row * square;

      svg += `
        <rect
          x="${x}"
          y="${y}"
          width="80"
          height="80"
          fill="${
            isLight
              ? LIGHT
              : DARK
          }"/>
      `;

      // Rank number
      if (col === 0) {
        svg += `
          <text
            x="7"
            y="${y + 18}"
            font-family="Arial"
            font-size="13"
            font-weight="bold"
            fill="${
              isLight
                ? DARK
                : LIGHT
            }">
            ${visibleRanks[row]}
          </text>
        `;
      }

      // File letter
      if (row === 7) {
        svg += `
          <text
            x="${x + 66}"
            y="${y + 72}"
            text-anchor="end"
            font-family="Arial"
            font-size="13"
            font-weight="bold"
            fill="${
              isLight
                ? DARK
                : LIGHT
            }">
            ${visibleFiles[col]}
          </text>
        `;
      }

      const piece =
        board[rankIndex][fileIndex];

      if (piece) {
        const symbol =
          PIECES[
            piece.color
          ][piece.type];

        svg += `
          <text
            x="${x + 40}"
            y="${y + 58}"
            text-anchor="middle"
            font-family="DejaVu Sans, Noto Sans Symbols 2, serif"
            font-size="58"
            fill="${
              piece.color === "w"
                ? "#ffffff"
                : "#111111"
            }"
            stroke="${
              piece.color === "w"
                ? "#222222"
                : "#ffffff"
            }"
            stroke-width="1.5"
            paint-order="stroke">
            ${symbol}
          </text>
        `;
      }
    }
  }

  svg += `
    </g>

    <text
      x="360"
      y="755"
      text-anchor="middle"
      font-family="Arial"
      font-size="19"
      font-weight="bold"
      fill="white">
      ♟️ PLAY • THINK • WIN
    </text>

  </svg>
  `;

  return sharp(
    Buffer.from(svg)
  )
    .png()
    .toBuffer();
}
