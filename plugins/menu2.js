const { sendButtons } = require('../lib/buttons')
const config = require('../config')
const {cmd , commands} = require('../command')
const os = require("os")
const {runtime} = require('../lib/functions')

cmd({
    pattern: "menu2",
    react: "👾",
    desc: "get cmd list",
    category: "main",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
let menu = {
main: '',
download: '',
group: '',
owner: '',
convert: '',
search: ''
};

for (let i = 0; i < commands.length; i++) {
if (commands[i].pattern && !commands[i].dontAddCommandList) {
menu[commands[i].category] += `*┋* .${commands[i].pattern}\n`;
 }
}

let madeMenu = `👋 HELLOW...*${pushname || 'User'}* ❤️ Welcome to CYBER X THENULA


✅CYBER THENUWA X MD✅
╭┈───────────────•* 
│  ◦ 🕒 *Runtime* :  ${runtime(process.uptime())}
│  ◦ ⚡ *mode* :  *[${config.MODE}]*
│  ◦ ⚙️ *prefix* : *[${config.PREFIX}]*
│  ◦ 💾 *Ram use* : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(require('os').totalmem / 1024 / 1024)}MB
│  ◦ 🤖 *Name Bot* : *THENUWA XMD*
│  ◦ 👤 *creater* : *Thenula/Dilshan*
│  ◦ 📌 *version* : *ᴠ.2.0.0*
│  ◦ 📜 *Menu Cmd* : *menu list*
╰┈───────────────•*


*╭───────────────❒⁠⁠⁠⁠*
*│* *🧑‍💻CYBER-TEAM🧑‍💻*
*┕───────────────❒*


📥*ᴅᴏᴡɴʟᴏᴀᴅ ᴄᴏᴍᴍᴀɴᴅs*📥

*╭──────────●●►*
${menu.download || '*┋* No Commands Available\n'}*╰──────────●●►*


⚙️*ᴍᴀɪɴ ᴄᴏᴍᴍᴀɴᴅs*⚙️

*╭──────────●●►*
${menu.main || '*┋* No Commands Available\n'}*╰──────────●●►*


👥*ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅs*👥

*╭──────────●●►*
${menu.group || '*┋* No Commands Available\n'}*╰──────────●●►*


👨‍💻 *ᴏᴡɴᴇʀ ᴄᴏᴍᴍᴀɴᴅs*👨‍💻 

*╭──────────●●►*
${menu.owner || '*┋* No Commands Available\n'}*╰──────────●●►*


🎡*cᴏɴᴠᴇʀᴛ ᴄᴏᴍᴍᴀɴᴅs*🎡

*╭──────────●●►*
${menu.convert || '*┋* No Commands Available\n'}*╰──────────●●►*


🔎*sᴇᴀʀᴄʜ ᴄᴏᴍᴍᴀɴᴅs*🔎

*╭──────────●●►*
${menu.search || '*┋* No Commands Available\n'}*╰──────────●●►*

*❒⁠⁠⁠⁠▭▬▭▬▭▬▭▬▭▬▭▬▭▬▭❒*⁠⁠⁠⁠

> *<b>💥 POWERED 💥</b> BY CYBER X MD⁴³²*

මේකේ .uRL/.vv තියේ menu එකේ පෙන්නන්නෑ හොදේ...`;

await conn.sendMessage(
    from,
    {
        image: { url: `https://i.ibb.co/N68698yW/5df1e9c651fd.jpg` },
        caption: madeMenu,
        contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363403804248705@newsletter',
                newsletterName: 'THENUWA XMD',
                serverMessageId: 143
            }
        }
    },
    { quoted: mek }
);

await sendButtons(conn, from, {
    text: 'Choose an option',
    prefix: config.PREFIX,
    buttons: [
        { id: 'thenuva:apk', text: 'Download APK' },
        { id: 'thenuva:chess', text: 'Play Chess' },
        { id: 'thenuva:about', text: 'About' }
    ]
}, mek);

}catch(e){
console.log(e);
reply(`${e}`);
}
});
