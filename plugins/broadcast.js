const { cmd } = require('../command');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Keep the same database path as index.js
const db = new sqlite3.Database(
    path.join(process.cwd(), 'chats.db'),
    (err) => {
        if (err) {
            console.error('[BROADCAST DB OPEN]', err.message);
        } else {
            console.log('[BROADCAST] Database connected');
        }
    }
);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS broadcast_subscribers (
            jid TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            subscribed_at INTEGER NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('[BROADCAST TABLE]', err.message);
        } else {
            console.log('[BROADCAST] Subscriber table ready');
        }
    });
});

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
        });
    });
}

function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({
                changes: this.changes,
                lastID: this.lastID
            });
        });
    });
}

function getCurrentJid(mek, from) {
    return mek?.key?.remoteJid || from || null;
}

function getChatType(jid) {
    if (typeof jid !== 'string') return null;

    if (jid.endsWith('@g.us')) {
        return 'group';
    }

    if (
        jid.endsWith('@s.whatsapp.net') ||
        jid.endsWith('@lid')
    ) {
        return 'private';
    }

    return null;
}

function isBotChat(jid, conn) {
    const botJid = conn?.user?.id;

    if (!botJid || !jid) return false;

    const botNumber = botJid.split(':')[0].split('@')[0];
    const chatNumber = jid.split('@')[0].split(':')[0];

    return (
        !jid.endsWith('@g.us') &&
        botNumber === chatNumber
    );
}

// ======================================
// SUBSCRIBE CURRENT CHAT
// ======================================
cmd({
    pattern: 'bcsubscribe',
    alias: ['bcjoin'],
    desc: 'Subscribe current chat to broadcasts',
    category: 'main',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const jid = getCurrentJid(mek, from);
        const type = getChatType(jid);

        console.log('[BC SUBSCRIBE]', {
            from,
            jid,
            type
        });

        if (!type) {
            return reply(
                '❌ මේ chat එක subscribe කරන්න බැහැ.'
            );
        }

        await dbRun(
            `INSERT INTO broadcast_subscribers
                (jid, type, subscribed_at)
             VALUES (?, ?, ?)
             ON CONFLICT(jid) DO UPDATE SET
                type = excluded.type,
                subscribed_at = excluded.subscribed_at`,
            [jid, type, Date.now()]
        );

        return reply(
            '╭─〔 *ᴛʜᴇɴᴜᴠᴀ x ᴍᴅ* 〕─●●►\n' +
            '│\n' +
            '│ ✅ *Broadcast Subscription Active*\n' +
            `│ ➤ ᴛʏᴘᴇ : ${type}\n` +
            '│\n' +
            '│ Broadcast ලබාගැනීමට මේ chat එක subscribe කළා.\n' +
            '│ ඉවත් වීමට `.bcunsubscribe` භාවිතා කරන්න.\n' +
            '│\n' +
            '╰────────────────●●►'
        );
    } catch (err) {
        console.error('[BC SUBSCRIBE ERROR]', err);

        return reply(
            '❌ Subscribe කිරීම අසාර්ථකයි.\n' +
            'Database error එකක් ඇතිවුණා.'
        );
    }
});

// ======================================
// UNSUBSCRIBE CURRENT CHAT
// ======================================
cmd({
    pattern: 'bcunsubscribe',
    alias: ['bcleave'],
    desc: 'Unsubscribe current chat from broadcasts',
    category: 'main',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const jid = getCurrentJid(mek, from);

        if (!getChatType(jid)) {
            return reply('❌ මේ chat එක හඳුනාගන්න බැහැ.');
        }

        const result = await dbRun(
            'DELETE FROM broadcast_subscribers WHERE jid = ?',
            [jid]
        );

        if (result.changes === 0) {
            return reply(
                'ℹ️ මේ chat එක subscribe වෙලා නැහැ.'
            );
        }

        return reply(
            '✅ Broadcast subscription එක ඉවත් කළා.'
        );
    } catch (err) {
        console.error('[BC UNSUBSCRIBE ERROR]', err);

        return reply(
            '❌ Unsubscribe කිරීම අසාර්ථකයි.'
        );
    }
});

// ======================================
// BROADCAST SENDER
// ======================================
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
                if (jid.endsWith('@broadcast')) return false;
                if (jid.endsWith('@newsletter')) return false;
                if (isBotChat(jid, conn)) return false;

                return true;
            });

        console.log('[BROADCAST TARGETS]', {
            type,
            count: targets.length,
            targets
        });
    } catch (err) {
        console.error('[BROADCAST DB ERROR]', err);

        return reply(
            '❌ Database එකෙන් subscribers ලබාගන්න බැරි වුණා.'
        );
    }

    if (targets.length === 0) {
        return reply(
            '❌ *Subscribe වුණු chats හමු වුණේ නැහැ.*\n\n' +
            (type === 'group'
                ? 'Group එකේ `.bcsubscribe` දාලා නැවත උත්සාහ කරන්න.'
                : 'Private chat එකේ `.bcsubscribe` දාලා නැවත උත්සාහ කරන්න.')
        );
    }

    let sent = 0;
    let failed = 0;

    await reply(
        '╭─〔 *ʙʀᴏᴀᴅᴄᴀsᴛ* 〕─●●►\n' +
        '│\n' +
        `│ ➤ ᴛᴀʀɢᴇᴛs : ${targets.length}\n` +
        '│ ➤ sᴛᴀᴛᴜs : Started\n' +
        '│\n' +
        '╰────────────────●●►'
    );

    for (const jid of targets) {
        try {
            await conn.sendMessage(jid, {
                text: message
            });

            sent++;

            console.log('[BROADCAST SENT]', jid);
        } catch (err) {
            failed++;

            console.error(
                '[BROADCAST SEND ERROR]',
                jid,
                err?.message || err
            );
        }

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

// ======================================
// PRIVATE BROADCAST
// ======================================
cmd({
    pattern: 'broadcast',
    alias: ['bc'],
    desc: 'Broadcast to subscribed private chats',
    category: 'owner',
    filename: __filename
}, async (conn, mek, m, { isOwner, body, reply }) => {
    if (!isOwner) {
        return reply(
            '❌ මේ command එක භාවිතා කළ හැක්කේ bot owner ට පමණයි.'
        );
    }

    const message = String(body || '')
        .trim()
        .replace(/^\.?broadcast(?:\s+|$)/i, '')
        .trim();

    if (!message) {
        return reply(
            '📌 භාවිතය:\n.broadcast ඔබගේ message එක'
        );
    }

    return sendBroadcast(
        conn,
        message,
        'private',
        reply
    );
});

// ======================================
// GROUP BROADCAST
// ======================================
cmd({
    pattern: 'bcgroup',
    alias: ['groupbc'],
    desc: 'Broadcast to subscribed groups',
    category: 'owner',
    filename: __filename
}, async (conn, mek, m, { isOwner, body, reply }) => {
    if (!isOwner) {
        return reply(
            '❌ මේ command එක භාවිතා කළ හැක්කේ bot owner ට පමණයි.'
        );
    }

    const message = String(body || '')
        .trim()
        .replace(/^\.?bcgroup(?:\s+|$)/i, '')
        .trim();

    if (!message) {
        return reply(
            '📌 භාවිතය:\n.bcgroup ඔබගේ message එක'
        );
    }

    return sendBroadcast(
        conn,
        message,
        'group',
        reply
    );
});
