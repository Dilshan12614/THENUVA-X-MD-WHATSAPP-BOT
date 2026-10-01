const actions = Object.freeze({
  'thenuva:chess': 'chess',
  'thenuva:apk': 'apk',
  'thenuva:about': 'about',
});

function unwrapMessage(message) {
  for (let i = 0; i < 8 && message; i++) {
    const wrapped = message.ephemeralMessage || message.viewOnceMessage ||
      message.viewOnceMessageV2 || message.viewOnceMessageV2Extension ||
      message.documentWithCaptionMessage;
    if (!wrapped?.message) break;
    message = wrapped.message;
  }
  return message || {};
}

function getButtonId(message) {
  message = unwrapMessage(message);
  const native = message.interactiveResponseMessage?.nativeFlowResponseMessage;
  if (native) {
    if (typeof native.paramsJson !== 'string' || native.paramsJson.length > 4096) return '';
    try {
      const data = JSON.parse(native.paramsJson);
      return typeof data?.id === 'string' ? data.id : '';
    } catch { return ''; }
  }
  return message.buttonsResponseMessage?.selectedButtonId ||
    message.templateButtonReplyMessage?.selectedId ||
    message.listResponseMessage?.singleSelectReply?.selectedRowId || '';
}

function getCommandBody(message, prefix) {
  message = unwrapMessage(message);
  const id = getButtonId(message);
  if (Object.hasOwn(actions, id)) return prefix + actions[id];
  if (typeof id === 'string' && id.startsWith(prefix)) {
    const action = id.slice(prefix.length);
    if (Object.values(actions).includes(action) || action === 'menu2') return id;
  }
  return message.conversation || message.extendedTextMessage?.text ||
    message.imageMessage?.caption || message.videoMessage?.caption || '';
}
module.exports = { actions, unwrapMessage, getButtonId, getCommandBody };
