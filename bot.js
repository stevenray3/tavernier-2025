// discord-tavernier-bot.js
// Un tavernier convivial pour votre serveur Discord 🍻 + Générateur de mèmes (Imgflip API)

require('dotenv').config();

const { Client, Intents, Collection, MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');

// --- Configuration ---
const PREFIX = '!tavernier';
const CURRENCY = '🪙';
const TAX_RATE = 0.10; // 10% de taxe de taverne

// Carte des boissons
const MENU = {
    biere: { label: 'Bière ambrée', price: 3.5 },
    hydromel: { label: 'Hydromel doux', price: 5 },
    vin: { label: 'Verre de vin', price: 4 },
    the: { label: 'Thé fumant', price: 2.5 },
    cafe: { label: 'Café noir', price: 2 },
    jus: { label: 'Jus de pomme', price: 2.5 },
    potion: { label: 'Potion mystérieuse', price: 7 },
};

// Phrases de tavernier
const TOASTS = [
    "À la vôtre, compagnons !",
    "Que votre route soit longue et vos pintes jamais vides !",
    "La première est pour moi, la deuxième pour l'histoire !",
    "Ici, on sert avec le sourire et on écoute les récits de voyage."
];

const LORE = [
    "On raconte qu'un dragon paya jadis son addition en écailles d'or...",
    "La pierre derrière le comptoir ? Elle provient d'une ruine elfique.",
    "J'ai vu un barde faire lever tout le village avec trois notes seulement.",
    "Un aventurier a oublié sa cape d'invisibilité ici. Si vous la voyez, dites-le moi."
];

// Happy hour
const HAPPY_HOUR = { active: false, discount: 0.25 }; // -25%

// Comptes/notes par utilisateur (mémoire en RAM)
const tabs = new Map();

// Cooldowns
const cooldowns = new Collection();
const COOLDOWN_MS = 3000;

// Utilitaires
function getBill(userId) {
    if (!tabs.has(userId)) tabs.set(userId, { items: [], subtotal: 0 });
    return tabs.get(userId);
}

function formatPrice(num) { return `${num.toFixed(2)} ${CURRENCY}`; }
function todaySpecial() {
    const keys = Object.keys(MENU);
    const index = new Date().getDate() % keys.length;
    const key = keys[index];
    return { key, ...MENU[key] };
}
function applyHappyHour(price) { return HAPPY_HOUR.active ? price * (1 - HAPPY_HOUR.discount) : price; }

function inCooldown(command, userId) {
    if (!cooldowns.has(command)) cooldowns.set(command, new Collection());
    const now = Date.now();
    const timestamps = cooldowns.get(command);
    const expire = timestamps.get(userId) || 0;
    if (now < expire) return Math.ceil((expire - now) / 1000);
    timestamps.set(userId, now + COOLDOWN_MS);
    return 0;
}

// Client
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS
    ]
});

client.once('ready', () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    client.user.setPresence({ activities: [{ name: 'servir une tournée' }], status: 'online' });
});

// Accueil des nouveaux
client.on('guildMemberAdd', (member) => {
    const channel = member.guild.systemChannel || member.guild.channels.cache.find(c => c.isText());
    if (!channel) return;
    channel.send(`Bienvenue à la Taverne, ${member}! Accroche ta cape et fais comme chez toi.`);
});

// Réaction aux mots-clés
const TRIGGERS = [
    { pattern: /santé|cheers|tchin/gi, reply: () => `${randomToast()} 🍻` },
    { pattern: /soif|assoiffé|assoiffee/gi, reply: () => `Ça tombe bien, la maison regorge de breuvages ! Tape \`${PREFIX} menu\` pour voir la carte.` },
];

function randomToast() { return TOASTS[Math.floor(Math.random() * TOASTS.length)]; }
function randomLore() { return LORE[Math.floor(Math.random() * LORE.length)]; }

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    for (const t of TRIGGERS) {
        if (t.pattern.test(message.content)) {
            if (message.type === 'REPLY') return;
            await message.reply(t.reply());
            return;
        }
    }

    if (!message.content.toLowerCase().startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const command = (args.shift() || '').toLowerCase();

    if (!command) return sendHelp(message);

    const cd = inCooldown(command, message.author.id);
    if (cd) return message.reply(`Doucement, voyageur ! Patiente encore ${cd}s avant de relancer \`${command}\`.`);

    switch (command) {
        case 'menu': return sendMenu(message);
        case 'salut': case 'bonjour': return greet(message);
        case 'commander': return orderDrink(message, args);
        case 'addition': return showBill(message);
        case 'payer': return payBill(message);
        case 'happyhour': return toggleHappyHour(message, args);
        case 'histoire': return message.reply(randomLore());
        case 'toast': return message.reply(randomToast());
        case 'dujour': return specialOfDay(message);
        case 'des': return rollDice(message, args);
        case 'pileface': return coinFlip(message);
        case 'meme': return createMeme(message, args);
        case 'help': case 'aide': return sendHelp(message);
        default: return message.reply(`Je n'ai pas compris, ami. Tape \`${PREFIX} help\` pour la carte et les commandes.`);
    }
});

// --- Commandes ---
function sendMenu(message) {
    const special = todaySpecial();
    const lines = Object.entries(MENU).map(([key, item]) => {
        const base = item.price;
        const price = applyHappyHour(base);
        const hh = HAPPY_HOUR.active && price !== base ? ` ~~${formatPrice(base)}~~ **${formatPrice(price)}**` : ` **${formatPrice(price)}**`;
        return `• **${item.label}** (\`${key}\`) —${hh}`;
    });

    const embed = new MessageEmbed()
        .setTitle('🍺 Carte de la Taverne')
        .setDescription(lines.join('\n'))
        .addField('Spécial du jour', `**${special.label}** (\`${special.key}\`) à ${formatPrice(applyHappyHour(special.price))}`)
        .setFooter({ text: HAPPY_HOUR.active ? 'Happy Hour en cours — -25% sur tout !' : 'Bonnes manières et bons récits toujours bienvenus.' });

    return message.channel.send({ embeds: [embed] });
}

function greet(message) {
    const nickname = message.member?.nickname || message.author.username;
    return message.channel.send(`Salut, ${nickname} ! Installe-toi, que puis-je te servir ?`);
}

function orderDrink(message, args) {
    const key = (args[0] || '').toLowerCase();
    if (!key || !MENU[key]) {
        return message.reply(`Je ne trouve pas cette boisson. Tape \`${PREFIX} menu\` pour voir la carte.`);
    }
    const item = MENU[key];
    const price = applyHappyHour(item.price);
    const bill = getBill(message.author.id);
    bill.items.push({ key, label: item.label, price });
    bill.subtotal += price;
    return message.channel.send(`Une **${item.label}** pour ${message.member?.displayName || message.author.username} ! Ça fera ${formatPrice(price)}.`);
}

function calcTotals(subtotal) { const tax = subtotal * TAX_RATE; return { tax, total: subtotal + tax }; }

function showBill(message) {
    const bill = getBill(message.author.id);
    if (!bill.items.length) return message.reply("Votre note est vierge pour l'instant.");
    const { tax, total } = calcTotals(bill.subtotal);
    const lines = bill.items.map((it, i) => `${i + 1}. ${it.label} — ${formatPrice(it.price)}`);
    const embed = new MessageEmbed()
        .setTitle(`🧾 Addition de ${message.member?.displayName || message.author.username}`)
        .setDescription(lines.join('\n'))
        .addField('Sous-total', formatPrice(bill.subtotal), true)
        .addField('Taxe (10%)', formatPrice(tax), true)
        .addField('Total', `**${formatPrice(total)}**`, false);
    return message.channel.send({ embeds: [embed] });
}

function payBill(message) {
    const bill = getBill(message.author.id);
    if (!bill.items.length) return message.reply("Rien à régler.");
    const { total } = calcTotals(bill.subtotal);
    tabs.set(message.author.id, { items: [], subtotal: 0 });
    return message.channel.send(`Merci pour votre visite ! Vous avez réglé **${formatPrice(total)}**.`);
}

function toggleHappyHour(message, args) {
    if (!message.member.permissions.has('MANAGE_GUILD')) return message.reply("Seul le patron peut annoncer l'Happy Hour !");
    if (!args[0]) return message.reply(`Happy Hour est **${HAPPY_HOUR.active ? 'activée' : 'désactivée'}**.`);
    const on = args[0].toLowerCase();
    if (on === 'on') { HAPPY_HOUR.active = true; return message.channel.send('🔔 Happy Hour ! -25% sur tout !'); }
    if (on === 'off') { HAPPY_HOUR.active = false; return message.channel.send("Happy Hour terminée."); }
}

function specialOfDay(message) {
    const sp = todaySpecial();
    return message.reply(`Le spécial du jour est **${sp.label}** (\`${sp.key}\`) à ${formatPrice(applyHappyHour(sp.price))}.`);
}

function rollDice(message, args) {
    const input = (args[0] || '1d20').toLowerCase();
    const match = input.match(/(\d*)d(\d+)/);
    if (!match) return message.reply('Format invalide. Exemple: `!tavernier des 2d6`');
    let count = parseInt(match[1] || '1', 10);
    const faces = parseInt(match[2], 10);
    if (count > 20) count = 20;
    const rolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * faces));
    const sum = rolls.reduce((a, b) => a + b, 0);
    return message.reply(`🎲 ${input} → [ ${rolls.join(', ')} ] = **${sum}**`);
}

function coinFlip(message) {
    const r = Math.random() < 0.5 ? 'Pile' : 'Face';
    return message.reply(`🪙 **${r}** !`);
}

async function createMeme(message, args) {
    // Usage: !tavernier meme <template_id> | haut | bas
    const parts = args.join(' ').split('|').map(p => p.trim());
    if (parts.length < 3) return message.reply("Format: `!tavernier meme <template_id> | texte haut | texte bas`");
    const template_id = parts[0];
    const text0 = parts[1];
    const text1 = parts[2];

    const url = `https://api.imgflip.com/caption_image`;
    const params = new URLSearchParams();
    params.append('template_id', template_id);
    params.append('username', process.env.IMGFLIP_USER);
    params.append('password', process.env.IMGFLIP_PASS);
    params.append('text0', text0);
    params.append('text1', text1);

    try {
        const res = await fetch(url, { method: 'POST', body: params });
        const data = await res.json();
        if (!data.success) throw new Error(data.error_message);
        return message.channel.send(`Voici ton mème : ${data.data.url}`);
    } catch (e) {
        return message.reply(`Erreur création du mème : ${e.message}`);
    }
}

function sendHelp(message) {
    const embed = new MessageEmbed()
        .setTitle('👨‍🍳 Le Tavernier — Aide')
        .setDescription(`Préfixe: \`${PREFIX}\`

**Commandes**
• \`menu\`, \`commander <boisson>\`, \`addition\`, \`payer\`
• \`dujour\`, \`histoire\`, \`toast\`
• \`des [XdY]\`, \`pileface\`
• \`meme <template_id> | haut | bas\` — Génère un mème via Imgflip
• \`happyhour on|off\` (Admin)
`);
    return message.channel.send({ embeds: [embed] });
}

// Connexion
client.login(process.env.DISCORD_TOKEN);

const http = require('http');
const PORT = process.env.PORT || 10000;
http.createServer((_, res) => res.end('ok')).listen(PORT);