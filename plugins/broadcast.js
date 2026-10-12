const { cmd } = require('../command');
const sqlite3 = require('sqlite3').verbose();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Use the same database file created in index.js
const db = new sqlite3.Database('./chats.db');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS broadcast_subscribers (
            jid TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            subscribed_at INTEGER NOT NULL
        )
    `);
});

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve(this);
        });
    });
}

function getChatType(jid) {
    if (typeof jid !== 'string') return null;
    if (jid.endsWith('@g.us')) return 'group';
    if (jid.endsWith('@s.whatsapp.net') ||
        jid.endsWith('@lid')) return 'private';
    return null;
}

// Subscribe the current chat
cmd({
    pattern: 'bcsubscribe',
    alias: ['bcjoin'],
    desc: 'Subscribe this chat to owner broadcasts',
    category: 'main',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const jid = from || mek?.key?.remoteJid;
        const type = getChatType(jid);

        if (!type) {
            return reply('❌ මේ chat එක subscribe කරන්න බැහැ.');
        }

        await dbRun(
            `INSERT INTO broadcast_subscribers (jid, type, subscribed_at)
             VALUES (?, ?, ?)
             ON CONFLICT(jid) DO UPDATE SET
                 type = excluded.type,
                 subscribed_at = excluded.subscribed_at`,
            [jid, type, Date.now()]
        );

        return reply(
            '✅ *THENUVA X MD BROADCAST*\n\n' +
            'මේ chat එක broadcast ලබාගැනීමට subscribe කළා.\n' +
            'අවශ්‍ය නැතිනම් `.bcunsubscribe` භාවිතා කරන්න.'
        );
    } catch (err) {
        console.error('[BC SUBSCRIBE]', err);
        return reply('❌ Subscribe කිරීම අසාර්ථකයි.');
    }
});

// Unsubscribe the current chat
cmd({
    pattern: 'bcunsubscribe',
    alias: ['bcleave'],
    desc: 'Unsubscribe this chat from owner broadcasts',
    category: 'main',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const jid = from || mek?.key?.remoteJid;

        if (!getChatType(jid)) {
            return reply('❌ මේ chat එක හඳුනාගන්න බැහැ.');
        }

        await dbRun(
            'DELETE FROM broadcast_subscribers WHERE jid = ?',
            [jid]
        );

        return reply('✅ Broadcast subscription එක ඉවත් කළා.');
    } catch (err) {
        console.error('[BC UNSUBSCRIBE]', err);
        return reply('❌ Unsubscribe කිරීම අසාර්ථකයි.');
    }
});

async function sendBroadcast(conn, message, type, reply) {
    let targets;

    try {
        const rows = await dbAll(
            'SELECT jid FROM broadcast_subscribers WHERE type = ?',
            [type]
        );

        targets = rows
            .map(row => row.jid)
            .filter(jid => {
                if (!getChatType(jid)) return false;
                if (getChatType(jid) !== type) return false;
                if (jid === 'status@broadcast') return false;
                if (jid.endsWith('@newsletter')) return false;

                const botJid = conn.user?.id?.split(':')[0];
                if (botJid && jid.split('@')[0].split(':')[0] === botJid) {
                    return false;
                }

                return true;
            });
    } catch (err) {
        console.error('[BROADCAST DB]', err);
        return reply('❌ Database එකෙන් subscribers ලබාගන්න බැරි වුණා.');
    }

    if (!targets.length) {
        return reply(
            '❌ Subscribe වුණු chats නැහැ.\n\n' +
            'Chat එකකින් `.bcsubscribe` යොදා subscribe වෙන්න.'
        );
    }

    let sent = 0;
    let failed = 0;

    await reply(
        '╭─〔 *ʙʀᴏᴀᴅᴄᴀsᴛ* 〕─●●►\n' +
        `│ ➤ ᴛᴀʀɢᴇᴛs : ${targets.length}\n` +
        '│ ➤ sᴛᴀᴛᴜs : Started\n' +
        '╰────────────────●●►'
    );

    for (const jid of targets) {
        try {
            await conn.sendMessage(jid, { text: message });
            sent++;
        } catch (err) {
            failed++;
            console.error('[BROADCAST ERROR]', jid, err.message);
        }

        // Keep a delay between messages
        await sleep(1500);
    }

    return reply(
        '╭─〔 *ʙʀᴏᴀᴅᴄᴀsᴛ ʀᴇsᴜʟᴛ* 〕─●●►\n' +
        '│\n' +
        `│ ➤ ᴛᴀʀɢᴇᴛs : ${targets.length}\n` +
        `│ ➤ sᴇɴᴛ : ${sent}\n` +
        `│ ➤ ғᴀɪʟᴇᴅ : ${failed}\n` +
        '│\n' +
        '╰────────────────●●►\n\n' +
        '> ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ • ᴘᴏᴡᴇʀᴇᴅ ʙʏ Dilshan Ashinsa'
    );
}

cmd({
    pattern: 'broadcast',
    alias: ['bc'],
    desc: 'Broadcast to subscribed private chats',
    category: 'owner',
    filename: __filename
}, async (conn, mek, m, { isOwner, body, reply }) => {
    if (!isOwner) {
        return reply('❌ මේ command එක භාවිතා කළ හැක්කේ bot owner ට පමණයි.');
    }

    const message = String(body || '')
        .trim()
        .replace(/^\.?broadcast(?:\s+|$)/i, '')
        .trim();

    if (!message) {
        return reply('Usage: .broadcast Your message here');
    }

    return sendBroadcast(conn, message, 'private', reply);
});

cmd({
    pattern: 'bcgroup',
    alias: ['groupbc'],
    desc: 'Broadcast to subscribed groups',
    category: 'owner',
    filename: __filename
}, async (conn, mek, m, { isOwner, body, reply }) => {
    if (!isOwner) {
        return reply('❌ මේ command එක භාවිතා කළ හැක්කේ bot owner ට පමණයි.');
    }

    const message = String(body || '')
        .trim()
        .replace(/^\.?bcgroup(?:\s+|$)/i, '')
        .trim();

    if (!message) {
        return reply('Usage: .bcgroup Your message here');
    }

    return sendBroadcast(conn, message, 'group', reply);
});
