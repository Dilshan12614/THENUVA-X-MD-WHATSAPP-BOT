const { isJidGroup } = require('@whiskeysockets/baileys');
const { loadMessage, getAnti, setAnti } = require('../data');
const config = require('../config');

// Define fakevCard for antidelete messages - LUXALGO AI
const fakevCard = {
    key: {
        fromMe: false,
        participant: "0@s.whatsapp.net",
        remoteJid: "status@broadcast"
    },
    message: {
        contactMessage: {
            displayName: "© LUXALGO AI 🤖",
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:LUXALGO AI BOT\nORG:LUXALGO AI;\nTEL;type=CELL;type=VOICE;waid=94773416478:+94773416478\nEND:VCARD`
        }
    }
};

// Track antidelete status globally
let globalAntiStatus = {
    gc: false,
    dm: false
};

// Initialize antidelete status from database
const initializeAntiStatus = async () => {
    try {
        const gcStatus = await getAnti('gc');
        const dmStatus = await getAnti('dm');
        globalAntiStatus = { gc: gcStatus, dm: dmStatus };
        console.log(`📊 Antidelete Status Initialized: GC=${gcStatus}, DM=${dmStatus}`);
    } catch (error) {
        console.error('Error initializing antidelete status:', error);
    }
};

const DeletedText = async (conn, mek, jid, deleteInfo, isGroup, update) => {
    try {
        const messageContent = mek.message?.conversation || 
                             mek.message?.extendedTextMessage?.text || 
                             mek.message?.imageMessage?.caption ||
                             mek.message?.videoMessage?.caption ||
                             'Unknown content';
        
        const formattedContent = messageContent.length > 200 
            ? messageContent.substring(0, 200) + '...' 
            : messageContent;

        const deleteText = `╔═══════════════════════
║  *🛡️ ANTI-DELETE DETECTED*  
╚═══════════════════════

${deleteInfo}

┌─「 DELETED CONTENT 」━━━━━━━━━━
│ 
│  *📝 Message:*
│  ${formattedContent}
│ 
└────────────────────

*Powered by LUXALGO AI ⚡*`;

        await conn.sendMessage(
            jid,
            {
                text: deleteText,
                ...fakevCard,
                contextInfo: {
                    mentionedJid: isGroup ? [update.key.participant, mek.key.participant] : [update.key.remoteJid],
                    forwardingScore: 999,
                    isForwarded: true,
                },
            },
            { quoted: mek },
        );
    } catch (error) {
        console.error('Error in DeletedText:', error);
    }
};

const DeletedMedia = async (conn, mek, jid, deleteInfo) => {
    try {
        const antideletedmek = structuredClone(mek.message);
        const messageType = Object.keys(antideletedmek)[0];
        
        if (antideletedmek[messageType]) {
            antideletedmek[messageType].contextInfo = {
                stanzaId: mek.key.id,
                participant: mek.sender,
                quotedMessage: mek.message,
            };
        }

        // Prepare caption for media messages
        const deleteCaption = `╔═══════════════════════
║  *🛡️ ANTI-DELETE DETECTED*  
╚═══════════════════════

${deleteInfo}

*Powered by LUXALGO AI ⚡*`;

        if (messageType === 'imageMessage' || messageType === 'videoMessage') {
            antideletedmek[messageType].caption = deleteCaption;
            await conn.relayMessage(jid, antideletedmek, {});
        } else if (messageType === 'audioMessage') {
            // For audio, send as text notification
            await conn.sendMessage(jid, { 
                text: deleteCaption,
                ...fakevCard 
            }, { quoted: mek });
            
            // Also forward the original audio
            await conn.relayMessage(jid, antideletedmek, {});
        } else if (messageType === 'documentMessage') {
            // For documents, add caption
            antideletedmek[messageType].caption = deleteCaption;
            await conn.relayMessage(jid, antideletedmek, {});
        } else if (messageType === 'stickerMessage') {
            // For stickers, send notification with sticker
            await conn.sendMessage(jid, { 
                text: `${deleteInfo}\n\n📎 *Sticker was deleted*`,
                ...fakevCard 
            }, { quoted: mek });
            
            // Forward the sticker
            await conn.relayMessage(jid, antideletedmek, {});
        } else {
            // For other media types
            await conn.sendMessage(jid, { 
                text: deleteCaption,
                ...fakevCard 
            }, { quoted: mek });
        }
    } catch (e) {
        console.error('Error in DeletedMedia:', e);
        // Fallback to text message
        await conn.sendMessage(jid, { 
            text: `*🚨 Deleted Media Detected*\n\n${deleteInfo}`,
            ...fakevCard 
        }, { quoted: mek });
    }
};

// Store deleted messages for logging
const deletedMessages = new Map();

const AntiDelete = async (conn, updates) => {
    try {
        // Ensure status is initialized
        if (!globalAntiStatus.gc && !globalAntiStatus.dm) {
            await initializeAntiStatus();
        }

        for (const update of updates) {
            if (update.update.message === null) {
                const store = await loadMessage(update.key.id);

                if (store && store.message) {
                    const mek = store.message;
                    const isGroup = isJidGroup(store.jid);
                    
                    // Check antidelete status from global variable
                    const antiDeleteType = isGroup ? 'gc' : 'dm';
                    const antiDeleteActive = globalAntiStatus[antiDeleteType];

                    if (!antiDeleteActive) continue;

                    const deleteTime = new Date().toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    });
                    const deleteDate = new Date().toLocaleDateString();

                    let deleteInfo, jid, mentionedJid = [];
                    
                    if (isGroup) {
                        try {
                            const groupMetadata = await conn.groupMetadata(store.jid);
                            const groupName = groupMetadata.subject;
                            const sender = mek.key.participant || mek.participant || 'Unknown';
                            const deleter = update.key.participant || 'Unknown';
                            
                            const senderNumber = sender.split('@')[0];
                            const deleterNumber = deleter.split('@')[0];
                            
                            mentionedJid = [deleter, sender].filter(Boolean);
                            
                            deleteInfo = `┌─「 DETAILS 」━━━━━━━━━━━━━━━
│ 
│  *🕐 Time:* ${deleteTime}
│  *📅 Date:* ${deleteDate}
│  *🏘️ Group:* ${groupName}
│  *🗑️ Deleted By:* @${deleterNumber}
│  *📤 Sender:* @${senderNumber}
│ 
└────────────────────`;
                            
                            // Send to group
                            jid = store.jid;
                            
                        } catch (error) {
                            // If can't get group info
                            deleteInfo = `┌─「 DETAILS 」━━━━━━━━━━━━━━━
│ 
│  *🕐 Time:* ${deleteTime}
│  *📅 Date:* ${deleteDate}
│  *🏘️ Group:* Unknown Group
│  *🗑️ Deleted By:* Unknown User
│  *📤 Sender:* Unknown Sender
│ 
└────────────────────`;
                            
                            jid = store.jid;
                        }
                    } else {
                        // DM/Personal chat
                        const senderNumber = mek.key.remoteJid?.split('@')[0] || 'Unknown';
                        const deleterNumber = update.key.remoteJid?.split('@')[0] || 'Unknown';
                        
                        mentionedJid = [update.key.remoteJid].filter(Boolean);
                        
                        deleteInfo = `┌─「 DETAILS 」━━━━━━━━━━━━━━━
│ 
│  *🕐 Time:* ${deleteTime}
│  *📅 Date:* ${deleteDate}
│  *💬 Chat:* Personal
│  *🗑️ Deleted By:* @${deleterNumber}
│  *📤 Sender:* @${senderNumber}
│ 
└────────────────────`;
                        
                        // Send to bot owner's inbox
                        jid = conn.user.id;
                    }

                    // Determine message type and handle accordingly
                    const hasText = mek.message?.conversation || 
                                   mek.message?.extendedTextMessage?.text ||
                                   mek.message?.imageMessage?.caption ||
                                   mek.message?.videoMessage?.caption;
                    
                    const isMedia = mek.message?.imageMessage || 
                                   mek.message?.videoMessage || 
                                   mek.message?.audioMessage || 
                                   mek.message?.documentMessage ||
                                   mek.message?.stickerMessage;

                    if (hasText && !isMedia) {
                        await DeletedText(conn, mek, jid, deleteInfo, isGroup, update);
                    } else if (isMedia) {
                        await DeletedMedia(conn, mek, jid, deleteInfo);
                    } else {
                        // Unknown message type
                        const unknownDeleteText = `╔═══════════════════════
║  *🛡️ ANTI-DELETE DETECTED*  
╚═══════════════════════

${deleteInfo}

┌─「 MESSAGE TYPE 」━━━━━━━━━━━━
│ 
│  *⚠️ Type:* Unknown/System Message
│  *🔒 Content:* Cannot be recovered
│ 
└────────────────────

*Powered by LUXALGO AI ⚡*`;

                        await conn.sendMessage(
                            jid,
                            {
                                text: unknownDeleteText,
                                ...fakevCard,
                                contextInfo: {
                                    mentionedJid: mentionedJid,
                                    forwardingScore: 999,
                                    isForwarded: true,
                                },
                            },
                            { quoted: mek }
                        );
                    }

                    // Store in memory for logging
                    const messageId = update.key.id;
                    if (!deletedMessages.has(messageId)) {
                        deletedMessages.set(messageId, {
                            timestamp: new Date(),
                            details: deleteInfo,
                            content: mek,
                            type: isGroup ? 'group' : 'dm'
                        });
                        
                        // Limit storage to 1000 messages
                        if (deletedMessages.size > 1000) {
                            const firstKey = deletedMessages.keys().next().value;
                            deletedMessages.delete(firstKey);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error in AntiDelete:', error);
    }
};

// Command to toggle antidelete
const toggleAntiDelete = async (conn, jid, type, enable = true) => {
    try {
        // Update database
        const success = await setAnti(type, enable);
        
        if (!success) {
            await conn.sendMessage(jid, { 
                text: '*❌ Failed to update antidelete settings*',
                ...fakevCard 
            });
            return false;
        }
        
        // Update global status
        globalAntiStatus[type] = enable;
        
        const typeName = type === 'gc' ? 'Group Chats' : 'Direct Messages';
        const statusText = enable ? '✅ ENABLED' : '❌ DISABLED';
        
        const statusMessage = `╔═══════════════════════
║  *🛡️ ANTI-DELETE STATUS*  
╚═══════════════════════

┌─「 STATUS UPDATE 」━━━━━━━━━━
│ 
│  *⚙️ Type:* ${typeName}
│  *📊 Status:* ${statusText}
│  *🕐 Time:* ${new Date().toLocaleTimeString()}
│  *📅 Date:* ${new Date().toLocaleDateString()}
│ 
└────────────────────

*💬 Message:* Anti-delete for ${typeName.toLowerCase()} has been ${enable ? 'activated' : 'deactivated'}. ${enable ? 'Deleted messages will now be monitored and reported.' : 'Messages can now be deleted without tracking.'}

*Powered by LUXALGO AI ⚡*`;

        await conn.sendMessage(jid, {
            text: statusMessage,
            ...fakevCard
        });
        
        return true;
    } catch (error) {
        console.error('Error in toggleAntiDelete:', error);
        await conn.sendMessage(jid, { 
            text: '*❌ Error updating antidelete settings*',
            ...fakevCard 
        });
        return false;
    }
};

// Get current antidelete status
const getAntiDeleteStatus = () => {
    return {
        gc: globalAntiStatus.gc,
        dm: globalAntiStatus.dm,
        timestamp: new Date()
    };
};

// Get deleted messages log
const getDeletedLog = () => {
    return Array.from(deletedMessages.values());
};

// Clear deleted messages log
const clearDeletedLog = () => {
    deletedMessages.clear();
};

// Initialize on module load
initializeAntiStatus();

module.exports = {
    DeletedText,
    DeletedMedia,
    AntiDelete,
    toggleAntiDelete,
    getAntiDeleteStatus,
    getDeletedLog,
    clearDeletedLog
};
