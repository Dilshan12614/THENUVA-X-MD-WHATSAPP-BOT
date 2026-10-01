const { actions } = require('./button-actions');

function buildButtonContent(text, buttons, footer = '') {
  if (typeof text !== 'string' || !text.trim()) throw new TypeError('Button text is required');
  if (!Array.isArray(buttons) || buttons.length < 1 || buttons.length > 3) {
    throw new TypeError('Use one to three buttons');
  }
  const ids = new Set();
  return {
    interactiveMessage: {
      body: { text },
      footer: { text: footer },
      nativeFlowMessage: {
        buttons: buttons.map(({ id, text: label }) => {
          if (!Object.hasOwn(actions, id) || typeof label !== 'string' ||
              !label.trim() || label.length > 20 || ids.has(id)) {
            throw new TypeError('Use unique known actions and labels up to 20 characters');
          }
          ids.add(id);
          return { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: label, id }) };
        }),
        messageParamsJson: '{}',
      },
    },
  };
}

function buttonNodes(jid) {
  const nodes = [{ tag: 'biz', attrs: {}, content: [{
    tag: 'interactive', attrs: { type: 'native_flow', v: '1' }, content: [{
      tag: 'native_flow', attrs: { v: '9', name: 'mixed' },
    }],
  }] }];
  if (!jid.endsWith('@g.us')) nodes.push({ tag: 'bot', attrs: { biz_bot: '1' } });
  return nodes;
}

async function sendButtons(conn, jid, { text, buttons, footer = '', prefix = '.' }, quoted) {
  const content = buildButtonContent(text, buttons, footer);
  content.interactiveMessage.body.text += '\n\n' + buttons.map(b =>
    `${b.text}: ${prefix}${actions[b.id]}`).join('\n');
  const { generateWAMessageFromContent, proto } = await import('@whiskeysockets/baileys');
  const message = generateWAMessageFromContent(jid, proto.Message.fromObject({
    viewOnceMessage: { message: {
      messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
      ...content,
    } },
  }), { userJid: conn.user.id, quoted });
  try {
    await conn.relayMessage(jid, message.message, {
      messageId: message.key.id, additionalNodes: buttonNodes(jid),
    });
    return message;
  } catch (error) {
    console.error('Button relay failed:', error?.name || 'Error');
    return conn.sendMessage(jid, { text: content.interactiveMessage.body.text }, { quoted });
  }
}
module.exports = { buildButtonContent, buttonNodes, sendButtons };
