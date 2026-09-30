const config = require('../config')
const {cmd , commands} = require('../command')

cmd({
    pattern: "about",
    react: "👑",
    desc: "get owner dec",
    category: "main",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
let madeMenu = `👋 *HELLOW, ${pushname}!* ❤️ welcome to CYBER X THENULA...


🌟 *DEVELOPER DETAILS* 🌟
─────────────────────
👨‍💻 *Developer:* THENULA AND DILSHAN
🔞 *Age:* 19 Years Old
🙈 *Location:* Personal Hai 😁
🤖 *Status:* Simple WhatsApp Bot Developer
──────────────────────

 💡 *Thank you for using my bot!*...


> *⚡ Powered By CYBER X THENULA*`

await conn.sendMessage(from, {
    image: { url: 'https://i.ibb.co/7JWk0d08/11625411f042.jpg' },
    caption: madeMenu,
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: config.NEWSLETTER_JID || '120363403804248705@newsletter',
            newsletterName: 'CYBER XMD',
            serverMessageId: 143
        }
    }
}, { quoted: mek })

}catch(e){
console.log(e)
reply(`${e}`)
}
})
