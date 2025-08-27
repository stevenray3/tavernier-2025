// discord-tavernier-bot.js
// Un tavernier convivial pour votre serveur Discord 🍻 + Générateur de mèmes (Imgflip API)

require('dotenv').config();

const { Client, Intents, Collection, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js'); const fetch = require('node-fetch');

// Slash commands (v13)
const { Routes } = require('discord-api-types/v9');
const { REST } = require('@discordjs/rest');

// --- Configuration ---
const PREFIX = '!tavernier';
const CURRENCY = '🪙';
const TAX_RATE = 0.10; // 10% de taxe de taverne

// Carte des boissons + métadonnées + effets
// meta: { type, tastes[], alcoholic }
// effects: variation d'états utilisateur (ivresse, energie, humeur, concentration, hydratation, charisme)
const MENU = {
    biere_blonde: {
        label: 'Bière blonde', price: 3.5,
        meta: { type: 'bière', tastes: ['amer', 'malté'], alcoholic: true },
        effects: { ivresse: 1, humeur: 1, hydratation: -1 }
    },
    biere_ambree: {
        label: 'Bière ambrée', price: 3.5,
        meta: { type: 'bière', tastes: ['caramélisé', 'amer'], alcoholic: true },
        effects: { ivresse: 1, humeur: 1, hydratation: -1 }
    },
    biere_brune: {
        label: 'Bière brune', price: 3.5,
        meta: { type: 'bière', tastes: ['torréfié', 'amer'], alcoholic: true },
        effects: { ivresse: 1, humeur: 1, hydratation: -1 }
    },
    hydromel: {
        label: 'Hydromel', price: 5,
        meta: { type: 'traditionnel', tastes: ['miel', 'doux'], alcoholic: true },
        effects: { ivresse: 2, humeur: 1, hydratation: -1 }
    },
    cidre: {
        label: 'Cidre', price: 5,
        meta: { type: 'cidre', tastes: ['pomme', 'acidulé'], alcoholic: true },
        effects: { ivresse: 1, humeur: 1, hydratation: -1 }
    },
    vin_de_noix: {
        label: 'Vin de noix', price: 6,
        meta: { type: 'apéritif', tastes: ['noix', 'amer', 'doux'], alcoholic: true },
        effects: { ivresse: 2, humeur: 1, concentration: -1 }
    },
    the: {
        label: 'Thé', price: 2.5,
        meta: { type: 'chaud', tastes: ['herbacé'], alcoholic: false },
        effects: { energie: 1, hydratation: 1, concentration: 1 }
    },
    espresso: {
        label: 'Espresso', price: 2,
        meta: { type: 'chaud', tastes: ['torréfié', 'amer'], alcoholic: false },
        effects: { energie: 2, concentration: 1, hydratation: -1 }
    },
    jus_pomme: {
        label: 'Jus de pomme', price: 2.5,
        meta: { type: 'jus', tastes: ['pomme', 'doux'], alcoholic: false },
        effects: { hydratation: 1, humeur: 1 }
    },
    jus_ananas: {
        label: 'Jus d\'ananas', price: 2.5,
        meta: { type: 'jus', tastes: ['ananas', 'sucré'], alcoholic: false },
        effects: { hydratation: 1, humeur: 1 }
    },
    jus_orange: {
        label: 'Jus d\'orange', price: 2.5,
        meta: { type: 'jus', tastes: ['agrumes', 'acidulé'], alcoholic: false },
        effects: { hydratation: 1, energie: 1 }
    },
    potion_soin: {
        label: 'Potion de soin', price: 7,
        meta: { type: 'potion', tastes: ['mystique'], alcoholic: false },
        effects: { humeur: 1, concentration: 1, hydratation: 1 }
    },
    potion_magie: {
        label: 'Potion de magie', price: 7,
        meta: { type: 'potion', tastes: ['éthéré'], alcoholic: false },
        effects: { concentration: 2, energie: 1, humeur: 1 }
    },
    potion_vigueur: {
        label: 'Potion de vigueur', price: 7,
        meta: { type: 'potion', tastes: ['tonique'], alcoholic: false },
        effects: { energie: 2, humeur: 1 }
    },
    cacolac: {
        label: 'Cacolac', price: 2.5,
        meta: { type: 'lait', tastes: ['cacao', 'doux'], alcoholic: false },
        effects: { humeur: 1, energie: 1 }
    },
    boisson_malicieuse: {
        label: 'Boisson malicieuse', price: 1,
        meta: { type: 'mystère', tastes: ['surprise'], alcoholic: false },
        effects: { humeur: 1 }
    },

    // Nouveaux ajouts
    cafe_latte: {
        label: 'Café latte', price: 3,
        meta: { type: 'chaud', tastes: ['lacté', 'torréfié'], alcoholic: false },
        effects: { energie: 2, humeur: 1, hydratation: -1 }
    },
    cappuccino: {
        label: 'Cappuccino', price: 3,
        meta: { type: 'chaud', tastes: ['mousseux', 'torréfié'], alcoholic: false },
        effects: { energie: 2, humeur: 1, hydratation: -1 }
    },
    flat_white: {
        label: 'Flat white', price: 3,
        meta: { type: 'chaud', tastes: ['lacté', 'torréfié'], alcoholic: false },
        effects: { energie: 2, concentration: 1, hydratation: -1 }
    },
    latte_ours: {
        label: 'Latte de l\'ours', price: 3.5,
        meta: { type: 'signature', tastes: ['lacté', 'miel'], alcoholic: false },
        effects: { energie: 2, humeur: 2, hydratation: -1 }
    },
    pina_colada: {
        label: 'Piña colada', price: 6,
        meta: { type: 'cocktail', tastes: ['ananas', 'coco', 'sucré'], alcoholic: true },
        effects: { ivresse: 2, humeur: 2, hydratation: -1 }
    },
    sex_on_the_beach: {
        label: 'Sex on the beach', price: 6,
        meta: { type: 'cocktail', tastes: ['pêche', 'agrumes', 'sucré'], alcoholic: true },
        effects: { ivresse: 2, humeur: 2, hydratation: -1 }
    },
    mojito: {
        label: 'Mojito', price: 6,
        meta: { type: 'cocktail', tastes: ['menthe', 'citron vert', 'sucré'], alcoholic: true },
        effects: { ivresse: 2, humeur: 2, hydratation: -1 }
    },
    sangria: {
        label: 'Sangria', price: 5,
        meta: { type: 'cocktail', tastes: ['fruité', 'épices'], alcoholic: true },
        effects: { ivresse: 2, humeur: 2, hydratation: -1 }
    },
    vin_blanc_sec: {
        label: 'Vin blanc sec', price: 4,
        meta: { type: 'vin', tastes: ['frais', 'minéral'], alcoholic: true },
        effects: { ivresse: 1, concentration: -1, hydratation: -1 }
    },
    vin_blanc_moelleux: {
        label: 'Vin blanc moelleux', price: 4.5,
        meta: { type: 'vin', tastes: ['doux', 'mielleux'], alcoholic: true },
        effects: { ivresse: 1, humeur: 1, hydratation: -1 }
    },
    vin_rouge_bourgogne: {
        label: 'Vin rouge de Bourgogne', price: 5,
        meta: { type: 'vin', tastes: ['tannique', 'fruits rouges'], alcoholic: true },
        effects: { ivresse: 2, humeur: 1, concentration: -1, hydratation: -1 }
    },
    vin_rouge_bordeaux: {
        label: 'Vin rouge de Bordeaux', price: 5,
        meta: { type: 'vin', tastes: ['boisé', 'tannique'], alcoholic: true },
        effects: { ivresse: 2, humeur: 1, concentration: -1, hydratation: -1 }
    },
    kombucha: {
        label: 'Kombucha', price: 4,
        meta: { type: 'fermenté', tastes: ['acidulé', 'thé'], alcoholic: false },
        effects: { hydratation: 1, concentration: 1, humeur: 1 }
    },
    vodka: {
        label: 'Vodka', price: 5,
        meta: { type: 'spiritueux', tastes: ['neutre'], alcoholic: true },
        effects: { ivresse: 3, concentration: -2, hydratation: -1, charisme: 1 }
    },
    tequila: {
        label: 'Tequila', price: 5,
        meta: { type: 'spiritueux', tastes: ['agave'], alcoholic: true },
        effects: { ivresse: 3, concentration: -2, hydratation: -1, charisme: 1 }
    },
    rhum_blanc: {
        label: 'Rhum blanc', price: 5,
        meta: { type: 'spiritueux', tastes: ['canne', 'sucré'], alcoholic: true },
        effects: { ivresse: 3, concentration: -2, hydratation: -1, charisme: 1 }
    },
    rhum_ambre: {
        label: 'Rhum ambré', price: 5,
        meta: { type: 'spiritueux', tastes: ['vanille', 'boisé'], alcoholic: true },
        effects: { ivresse: 3, concentration: -2, hydratation: -1, charisme: 1 }
    },
    smoothie_pomme: {
        label: 'Smoothie pomme', price: 4,
        meta: { type: 'smoothie', tastes: ['pomme', 'doux'], alcoholic: false },
        effects: { hydratation: 1, energie: 1, humeur: 1 }
    },
    smoothie_ananas_passion: {
        label: 'Smoothie ananas passion', price: 4,
        meta: { type: 'smoothie', tastes: ['ananas', 'passion', 'sucré'], alcoholic: false },
        effects: { hydratation: 1, energie: 1, humeur: 2 }
    },
    smoothie_fraise: {
        label: 'Smoothie fraise', price: 4,
        meta: { type: 'smoothie', tastes: ['fraise', 'sucré'], alcoholic: false },
        effects: { hydratation: 1, energie: 1, humeur: 2 }
    },
    smoothie_coco: {
        label: 'Smoothie coco', price: 4,
        meta: { type: 'smoothie', tastes: ['coco', 'doux'], alcoholic: false },
        effects: { hydratation: 2, humeur: 1 }
    },
    ice_tea_peche: {
        label: 'Ice tea pêche', price: 3,
        meta: { type: 'thé glacé', tastes: ['pêche', 'doux'], alcoholic: false },
        effects: { hydratation: 1, energie: 1, humeur: 1 }
    },
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

// --- ÉCONOMIE ---
// Stockage en RAM : userId -> { balance: number, lastDaily: number (ms), streak: number }
const economy = new Map();
const WORK_COOLDOWN_MS = 60 * 60 * 1000; // 1h entre deux "travail"
const DAILY_MIN = 20, DAILY_MAX = 50;
const WORK_MIN = 10, WORK_MAX = 25;

const workCooldowns = new Map(); // userId -> expire timestamp

function getWallet(userId) {
    if (!economy.has(userId)) economy.set(userId, { balance: 100, lastDaily: 0, streak: 0 }); // 100 🪙 de départ
    return economy.get(userId);
}
function addCoins(userId, amount) {
    const w = getWallet(userId);
    w.balance = Math.max(0, w.balance + Math.floor(amount));
    return w.balance;
}
function subCoins(userId, amount) {
    const w = getWallet(userId);
    const a = Math.floor(amount);
    if (w.balance < a) return false;
    w.balance -= a;
    return true;
}
function formatCoins(n) { return `${n} ${CURRENCY}`; }

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


// Cooldowns
const cooldowns = new Collection();
const COOLDOWN_MS = 1000;

// =====================
//   IMGFLIP — templates
// =====================

const IMGFLIP_LIST_URL = 'https://api.imgflip.com/get_memes';

// Cache simple (12h)
const memeTemplatesCache = {
    list: [], // {id, name, url, width, height, box_count}
    ts: 0
};
const MEME_CACHE_MS = 12 * 60 * 60 * 1000;

async function getMemeTemplates(force = false) {
    const now = Date.now();
    if (!force && memeTemplatesCache.list.length && (now - memeTemplatesCache.ts) < MEME_CACHE_MS) {
        return memeTemplatesCache.list;
    }
    const res = await fetch(IMGFLIP_LIST_URL);
    const data = await res.json();
    if (!data.success) throw new Error('Imgflip: impossible de récupérer les templates');
    memeTemplatesCache.list = data.data.memes || [];
    memeTemplatesCache.ts = now;
    return memeTemplatesCache.list;
}

function searchMemeTemplates(templates, query = '') {
    if (!query) return templates;
    const q = query.toLowerCase();
    return templates.filter(t =>
        t.name.toLowerCase().includes(q) ||
        String(t.id).includes(q)
    );
}

// Utilitaires

// =====================
//    DÉCROISSANCE & SEUILS
// =====================

// Intervalle de décroissance (ex: toutes les 10 minutes)
const DECAY_INTERVAL_MS = 10 * 60 * 1000;

// Règles de décroissance par tick (valeur à ajouter à chaque attribut)
const DECAY_RULES = {
    intox: -1,
    energy: -1,
    mood: -1,
    focus: -1,
    hydration: -1,
    charisma: -1,
};

// Limites min/max par attribut
const STATE_LIMITS = {
    intox: { min: 0, max: 10 },
    energy: { min: -5, max: 10 },
    mood: { min: -5, max: 10 },
    focus: { min: -5, max: 10 },
    hydration: { min: -5, max: 10 },
    charisma: { min: 0, max: 10 },
};

// Contexte utilisateur pour annonces (dernier salon + derniers paliers)
const userContext = new Map(); // userId -> { lastChannelId: string|null, stages: Set<string> }

function getUserCtx(userId) {
    if (!userContext.has(userId)) userContext.set(userId, { lastChannelId: null, stages: new Set() });
    return userContext.get(userId);
}
function touchUserChannel(userId, channelId) {
    const ctx = getUserCtx(userId);
    ctx.lastChannelId = channelId;
}

// Clamp dans les bornes
function clampState(state) {
    for (const [k, lim] of Object.entries(STATE_LIMITS)) {
        if (typeof state[k] !== 'number') continue;
        if (state[k] < lim.min) state[k] = lim.min;
        if (state[k] > lim.max) state[k] = lim.max;
    }
    return state;
}

// === Sélecteur de boissons avec boutons ===
const DRINKS_PER_PAGE = 10;

function chunk(array, size) {
    const out = [];
    for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
    return out;
}

function totalDrinkPages() {
    return Math.max(1, Math.ceil(Object.keys(MENU).length / DRINKS_PER_PAGE));
}

function buildDrinkRows(page = 0) {
    const keys = Object.keys(MENU);
    const maxPage = totalDrinkPages() - 1;
    const p = Math.min(Math.max(0, page), maxPage);

    const start = p * DRINKS_PER_PAGE;
    const slice = keys.slice(start, start + DRINKS_PER_PAGE);

    const drinkButtons = slice.map(k =>
        new MessageButton()
            .setCustomId(`buy:${k}`)
            .setLabel(MENU[k].label)
            .setStyle('PRIMARY')
    );

    // 5 boutons par ligne
    const rows = chunk(drinkButtons, 5).map(btns => new MessageActionRow().addComponents(btns));

    // Navigation
    const prev = new MessageButton()
        .setCustomId(`menu:page:${p - 1}`)
        .setLabel('◀️')
        .setStyle('SECONDARY')
        .setDisabled(p <= 0);

    const info = new MessageButton()
        .setCustomId('menu:info')
        .setLabel(`Page ${p + 1}/${maxPage + 1}`)
        .setStyle('SECONDARY')
        .setDisabled(true);

    const next = new MessageButton()
        .setCustomId(`menu:page:${p + 1}`)
        .setLabel('▶️')
        .setStyle('SECONDARY')
        .setDisabled(p >= maxPage);

    rows.push(new MessageActionRow().addComponents(prev, info, next));
    return rows;
}

function buildDrinksEmbed(page = 0) {
    const keys = Object.keys(MENU);
    const start = page * DRINKS_PER_PAGE;
    const slice = keys.slice(start, start + DRINKS_PER_PAGE);

    const embed = new MessageEmbed()
        .setTitle('🍺 Sélecteur de boissons')
        .setDescription(HAPPY_HOUR.active ? 'Happy Hour en cours : -25% sur tout !' : 'Clique sur un bouton pour commander')
        .setFooter({ text: `Page ${page + 1}/${totalDrinkPages()} • ${HAPPY_HOUR.active ? 'Happy Hour -25%' : 'Taverne ouverte'}` });

    slice.forEach((k) => {
        const it = MENU[k];
        const base = it.price;
        const price = applyHappyHour(base);
        const priceText = (HAPPY_HOUR.active && price !== base)
            ? `~~${formatPrice(base)}~~ **${formatPrice(price)}**`
            : `**${formatPrice(price)}**`;

        embed.addField(
            `${it.label} (\`${k}\`)`,
            [
                `Prix : ${priceText}`,
                `Meta : ${formatMeta(it.meta)}`,
                `Effets : ${formatEffectsDelta(it.effects)}`
            ].join('\n'),
            false
        );
    });

    return embed;
}

async function sendDrinksSelectorInteraction(interaction, page = 0) {
    const embed = buildDrinksEmbed(page);
    const components = buildDrinkRows(page);
    return interaction.reply({ embeds: [embed], components, ephemeral: false });
}

async function sendDrinksSelectorMessage(message, page = 0) {
    const embed = buildDrinksEmbed(page);
    const components = buildDrinkRows(page);
    return message.channel.send({ embeds: [embed], components });
}

// --- Définition des seuils amusants ---
const STAGE_RULES = [
    {
        id: 'tipsy',
        when: (s) => s.intox >= 3,
        up: "Vous vous sentez **légèrement pompette**. Les chansons deviennent subitement meilleures. 🍻",
        down: "Le monde arrête de tanguer. Vous reprenez vos esprits."
    },
    {
        id: 'drunk',
        when: (s) => s.intox >= 5,
        up: "Ouhla… **bien ivre** ! Vos pas improvisent une danse inconnue. 🥴",
        down: "Vous êtes **moins ivre**. Vos pieds coopèrent à nouveau."
    },
    {
        id: 'blackout',
        when: (s) => s.intox >= 8,
        up: "**Trou noir imminent** ! Vous cherchez vos clés… qui sont dans votre main. 🌚",
        down: "Retour de lucidité… partielle. Vous vous souvenez de votre prénom !"
    },
    {
        id: 'dehydrated',
        when: (s) => s.hydration <= -3,
        up: "**Déshydraté** ! Un verre d’eau ferait des miracles. 💧",
        down: "Hydratation en **amélioration**. La gorge vous remercie."
    },
    {
        id: 'exhausted',
        when: (s) => s.energy <= -3,
        up: "**Épuisé**… Les tabourets deviennent anormalement confortables. 😵",
        down: "Un regain d’entrain ! Vous tenez debout sans bâiller."
    },
    {
        id: 'euphoric',
        when: (s) => s.mood >= 5,
        up: "**Euphorique** ! Vous complimentez absolument tout le monde. ✨",
        down: "Le sourire s’adoucit, mais reste présent."
    },
    {
        id: 'grumpy',
        when: (s) => s.mood <= -3,
        up: "**Ronchon**… Rien ne trouve grâce à vos yeux. 😤",
        down: "L’orage passe. Vous retrouvez un peu de bonne humeur."
    },
    {
        id: 'unfocused',
        when: (s) => s.focus <= -3,
        up: "**Distrait**… Vous perdez le fil au milieu de vos phrases. 🫥",
        down: "L’esprit se **clarifie**. Les idées s’alignent."
    },
    {
        id: 'silver_tongue',
        when: (s) => s.charisma >= 5,
        up: "**Langue d’argent** ! Vos mots brillent, les deals aussi. 💬",
        down: "Moins de verve, mais toujours charmant."
    },
];

// Calcule l’ensemble des stages actifs
function computeStages(state) {
    const active = new Set();
    for (const r of STAGE_RULES) {
        if (r.when(state)) active.add(r.id);
    }
    return active;
}

// Compare anciens/nouveaux stages
function diffStages(oldSet, newSet) {
    const ups = [], downs = [];
    for (const r of STAGE_RULES) {
        const was = oldSet.has(r.id);
        const is = newSet.has(r.id);
        if (!was && is && r.up) ups.push(r.up);
        if (was && !is && r.down) downs.push(r.down);
    }
    return { ups, downs };
}

// Annonce les changements de seuils
async function announceStageChanges(client, userId, state) {
    const ctx = getUserCtx(userId);
    const oldStages = ctx.stages;
    const newStages = computeStages(state);
    const { ups, downs } = diffStages(oldStages, newStages);

    ctx.stages = newStages;

    if (!ctx.lastChannelId || (!ups.length && !downs.length)) return;

    const channel = client.channels.cache.get(ctx.lastChannelId);
    if (!channel || !channel.isText()) return;

    const username = (channel.guild?.members?.cache?.get(userId)?.displayName) ||
        (client.users.cache.get(userId)?.username) || 'Aventurier';

    for (const m of ups) await channel.send(`**${username}** — ${m}`);
    for (const m of downs) await channel.send(`**${username}** — ${m}`);
}

// Applique la décroissance globale
async function applyGlobalDecay(client) {
    for (const [userId, state] of userStates.entries()) {
        for (const [k, d] of Object.entries(DECAY_RULES)) {
            const lim = STATE_LIMITS[k];
            if (typeof state[k] !== 'number') continue;
            if (d < 0 && state[k] > lim.min) {
                state[k] = Math.max(lim.min, state[k] + d);
            }
        }
        clampState(state);
        await announceStageChanges(client, userId, state);
    }
}

// États utilisateur
const userStates = new Map();

// Emojis pour résumés d'effets
const STATE_EMOJI = {
    ivresse: '🍺',
    energie: '⚡',
    humeur: '😊',
    concentration: '🎯',
    hydratation: '💧',
    charisme: '💬',
};

// Valeurs par défaut d'un profil d'états
function defaultState() {
    return { ivresse: 0, energie: 0, humeur: 0, concentration: 0, hydratation: 0, charisme: 0 };
}

function getUserState(userId) {
    if (!userStates.has(userId)) userStates.set(userId, defaultState());
    return userStates.get(userId);
}

// Applique les effets d'une boisson
function applyEffects(state, effects = {}) {
    for (const k of Object.keys(defaultState())) {
        if (typeof effects[k] === 'number') state[k] += effects[k];
    }
}

// Formatage lisible des effets
function formatEffectsDelta(effects = {}) {
    const parts = [];
    for (const [k, v] of Object.entries(effects)) {
        if (!v) continue;
        const sign = v > 0 ? `+${v}` : `${v}`;
        parts.push(`${STATE_EMOJI[k] || ''} ${sign}`);
    }
    return parts.length ? parts.join(' · ') : '—';
}

// Formatage des métadonnées
function formatMeta(meta = {}) {
    const tastes = meta.tastes?.length ? meta.tastes.join(', ') : '—';
    const type = meta.type || '—';
    const alco = meta.alcoholic ? 'oui' : 'non';
    return `Goût: ${tastes} • Type: ${type} • Alcoolisée: ${alco}`;
}

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

client.once('ready', async () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    client.user.setPresence({ activities: [{ name: 'servir une tournée' }], status: 'online' });

    // Enregistrement des commandes slash (guild)
    try {
        const commands = buildSlashCommands();
        const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);
        const guildId = process.env.GUILD_ID; // conseillez de définir GUILD_ID pour l'enregistrement côté guilde
        const clientId = process.env.CLIENT_ID; // ID de l'application/bot

        if (!clientId) {
            console.warn('⚠️ CLIENT_ID manquant. Définissez CLIENT_ID dans votre .env');
        } else if (!guildId) {
            console.warn('⚠️ GUILD_ID manquant. Enregistrement des commandes slash côté guilde ignoré.');
        } else {
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands }
            );
            console.log('✅ Commandes slash (guilde) enregistrées.');
        }

        // Pour un enregistrement global, décommentez ci-dessous
        // await rest.put(Routes.applicationCommands(clientId), { body: commands });
        // console.log('✅ Commandes slash (global) enregistrées.');
    } catch (err) {
        console.error('Erreur enregistrement des commandes slash:', err);
    }

    // Démarre la décroissance automatique des états
    setInterval(() => {
        applyGlobalDecay(client).catch(err => console.error('Décroissance: erreur', err));
    }, DECAY_INTERVAL_MS);
});

// Accueil des nouveaux
client.on('guildMemberAdd', (member) => {
    const channel = member.guild.systemChannel || member.guild.channels.cache.find(c => c.isText());
    if (!channel) return;
    channel.send(`Bienvenue à la Taverne, ${member}! Accroche ta cape et fais comme chez toi.`);
});

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Réaction aux mots-clés
const TRIGGERS = [
    {
        key: 'sante',
        pattern: /(?:sant[eé]|cheers|tchin)/gi,
        reply: () => pickRandom([
            `${randomToast()} 🍻`,
            "À la vôtre ! 🍺",
            "Attention, la mousse tache ! 🍺",
            "Mais pas des \`Server error, please try again.\`",
            "Que la mousse vous soit légère ! 🍺"
        ])
    },
    {
        key: 'soif',
        pattern: /(?:soif|assoiff[eé]e?)/gi,
        reply: () => pickRandom([
            `Ça tombe bien, la maison regorge de breuvages ! Tape \`${PREFIX} menu\` ou /boissons.`,
            "Assoiffé ? Une tournée arrive bientôt !",
            "J'arrive !!",
            "Le tavernier a déjà sorti les chopes !"
        ])
    },
    {
        key: 'cafe',
        pattern: /(?:caf[eé]|espresso|latte|cappuccino)/gi,
        reply: () => pickRandom([
            "Un petit coup de fouet ? \`espresso\`, \`cafe_latte\` ou \`cappuccino\` t’attendent !",
            "Rien de tel qu’un bon café pour repartir à l’aventure ! On s'en prend un ? ☕",
            "Un café matin, midi, et soir, rien de mieux pour péter la forme ! On passe commande ?",
            "Juste un café de plus, ça fait pas de mal tu sais.",
            "Je viens d'entendre mon mot préféré."
        ])
    },
    {
        key: 'biere',
        pattern: /(?:biere|bière)/gi,
        reply: () => pickRandom([
            "Une cervoise, une !",
            "Y a deux types de personnes, ceux qui aiment la bière, et les menteurs.",
            "Ça tombe bien, j'en ai plein ! Que veux-tu ? Commande avec /boissons ou /commander.",
            "Tu payes ta tournée ?"
        ])
    },
    {
        key: 'the',
        pattern: /(?:th[eé]|thé)/gi,
        reply: () => pickRandom([
            "Feuilles infusées, esprit affûté. Essaie un \`the\` ou un \`ice_tea_peche\` !",
            "Un peu de thé ? Voilà qui calme l’esprit. 🍵",
            "Infusion chaude ou glacée, au choix, ami voyageur. Je prendrai un café pour t'accompagner.",
            "Personnellement ce n'est pas ma tasse de thé mais tu peux toujours en commander."
        ])
    },
    {
        key: 'cocktail',
        pattern: /(?:mojito|sangria|pi(?:n|ñ)a colada|cocktail)/gi,
        reply: () => pickRandom([
            "Le bar à cocktails est ouvert : \`mojito\`, \`pina_colada\`, \`sangria\`… 🍹",
            "Un cocktail exotique, ça te dit ?",
            "Secoué, pas remué ! 🍸"
        ])
    },
    {
        key: 'merci',
        pattern: /(?:merci|thanks|thx)/gi,
        reply: () => pickRandom([
            `Avec plaisir ! Et n’oublie pas de vérifier ton \`${PREFIX} addition\` 😉`,
            "Toujours heureux de rendre service !",
            "Pas de quoi, c’est offert par la maison !"
        ])
    },
    {
        key: 'bonjour_tavernier',
        pattern: /^(?:\s*)(?:bonjour|salut|coucou|hey)\s+tavernier\b[!?.]*\s*$/iu,
        reply: () => pickRandom([
            randomToast(),
            "Bienvenue voyageur ! Qu'est-ce que je te sers ? 🍻",
            "Salutations ! Que veux-tu boire ?",
            "Salut à toi ! Installe-toi donc. Que puis-je faire pour toi ?"
        ])
    },
    {
        key: 'gg',
        pattern: /(?:bravo|bien (?:jou[eé])|gg)/gi,
        reply: () => pickRandom([
            "🥳 À cette victoire ! Une tournée ?",
            "Bien joué ! La maison offre la prochaine !",
            "Victoire digne d’un toast ! 🍺"
        ])
    },
];

function randomToast() { return TOASTS[Math.floor(Math.random() * TOASTS.length)]; }
function randomLore() { return LORE[Math.floor(Math.random() * LORE.length)]; }

// Anti-spam pour les triggers
const triggerCooldowns = new Map(); // Map<userId, Map<key, expireTimestamp>>
const TRIGGER_COOLDOWN_MS = 1000; // 15s par mot-clé par utilisateur

function inTriggerCooldown(userId, key) {
    if (!triggerCooldowns.has(userId)) triggerCooldowns.set(userId, new Map());
    const userMap = triggerCooldowns.get(userId);
    const now = Date.now();
    const expire = userMap.get(key) || 0;
    if (now < expire) return true;
    userMap.set(key, now + TRIGGER_COOLDOWN_MS);
    return false;
}

// ----------------------
//        MESSAGES
// ----------------------
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    for (const t of TRIGGERS) {
        if (t.pattern.test(message.content)) {
            if (inTriggerCooldown(message.author.id, t.key)) return;
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
        case 'commander': return orderDrinkMessage(message, args);
        case 'boissons': return sendDrinksSelectorMessage(message, 0);
        case 'addition': return showBill(message);
        case 'payer': return payBill(message);
        case 'happyhour': return toggleHappyHourMessage(message, args);
        case 'histoire': return message.reply(randomLore());
        case 'toast': return message.reply(randomToast());
        case 'dujour': return specialOfDay(message);
        case 'des': return rollDiceMessage(message, args);
        case 'pileface': return coinFlipMessage(message);
        case 'meme': return createMemeMessage(message, args);
        case 'memes': return listMemesMessage(message, args.join(' '));
        case 'help': case 'aide': return sendHelp(message);
        case 'solde': return balanceMessage(message);
        case 'daily': return dailyMessage(message);
        case 'travail': return workMessage(message);
        case 'don': return donateMessage(message, args);
        default: return message.reply(`Je n'ai pas compris, ami. Tape \`${PREFIX} help\` pour la carte et les commandes.`);
    }
});

// ----------------------
//      INTERACTIONS
// ----------------------

client.on('interactionCreate', async (interaction) => {
    // -------- Autocomplete --------
    if (interaction.isAutocomplete()) {
        try {
            const focused = interaction.options.getFocused(true); // { name, value }
            const q = (focused.value || '').toLowerCase();

            // Autocomplete boissons (commande /commander)
            if (interaction.commandName === 'commander' && focused.name === 'boisson') {
                const all = Object.entries(MENU).map(([key, item]) => ({
                    name: `${item.label} (${key})`,
                    value: key
                }));
                const filtered = all
                    .filter(c => c.name.toLowerCase().includes(q) || c.value.toLowerCase().includes(q))
                    .slice(0, 25);
                await interaction.respond(filtered);
                return;
            }

            // Autocomplete templates Imgflip (commande /meme)
            if (interaction.commandName === 'meme' && focused.name === 'template_id') {
                const templates = await getMemeTemplates();
                const filtered = searchMemeTemplates(templates, q)
                    .slice(0, 25)
                    .map(t => ({
                        name: `${t.name} [ID:${t.id}] (${t.box_count} zones)`,
                        value: String(t.id)
                    }));
                await interaction.respond(filtered.length ? filtered : [{ name: 'Aucun résultat', value: q || ' ' }]);
                return;
            }

        } catch (e) {
            console.error('Autocomplete error:', e);
            try { await interaction.respond([{ name: 'Erreur autocomplétion', value: 'err' }]); } catch { }
        }
        return;
    }

    // Boutons (achat + pagination)
    if (interaction.isButton()) {
        try {
            const id = interaction.customId || '';
            // Achat : buy:<key>
            if (id.startsWith('buy:')) {
                const key = id.split(':')[1];
                if (!MENU[key]) return interaction.reply({ content: 'Boisson inconnue.', ephemeral: true });
                // Réutilise la logique existante
                return orderDrinkInteraction(interaction, key);
            }

            // Pagination : menu:page:<n>
            if (id.startsWith('menu:page:')) {
                const n = parseInt(id.split(':')[2], 10);
                const embed = buildDrinksEmbed(n);
                const components = buildDrinkRows(n);
                return interaction.update({ embeds: [embed], components });
            }

            // Info (inactif)
            if (id === 'menu:info') {
                return interaction.deferUpdate();
            }

            return interaction.reply({ content: 'Action inconnue.', ephemeral: true });
        } catch (e) {
            console.error('Button error:', e);
            if (interaction.deferred || interaction.replied) {
                return interaction.followUp({ content: 'Erreur lors du traitement du bouton.', ephemeral: true });
            }
            return interaction.reply({ content: 'Erreur lors du traitement du bouton.', ephemeral: true });
        }
        // Ne pas continuer, on a géré le bouton
    }

    // -------- Commands --------
    if (!interaction.isCommand()) return;

    const name = interaction.commandName;
    const userId = interaction.user.id;
    const cd = inCooldown(name, userId);
    if (cd) {
        return interaction.reply({ content: `Doucement, voyageur ! Patiente encore ${cd}s avant de relancer \`${name}\`.`, ephemeral: true });
    }

    try {
        switch (name) {
            case 'menu':
                return sendMenuInteraction(interaction);
            case 'salut':
                return greetInteraction(interaction);
            case 'commander': {
                const drink = interaction.options.getString('boisson', true);
                return orderDrinkInteraction(interaction, drink);
            }
            case 'boissons':
                return sendDrinksSelectorInteraction(interaction, 0);
            case 'addition':
                return showBillInteraction(interaction);
            case 'payer':
                return payBillInteraction(interaction);
            case 'happyhour': {
                const state = interaction.options.getString('etat'); // on/off/empty
                return toggleHappyHourInteraction(interaction, state);
            }
            case 'solde': return balanceInteraction(interaction);
            case 'daily': return dailyInteraction(interaction);
            case 'travail': return workInteraction(interaction);
            case 'don': return donateInteraction(interaction);
            case 'histoire':
                return interaction.reply(randomLore());
            case 'toast':
                return interaction.reply(randomToast());
            case 'dujour':
                return specialOfDayInteraction(interaction);
            case 'etat':
                return stateInteraction(interaction);
            case 'des': {
                const pattern = interaction.options.getString('lancer') || '1d20';
                return rollDiceInteraction(interaction, pattern);
            }
            case 'pileface':
                return coinFlipInteraction(interaction);
            case 'meme': {
                const template_id = interaction.options.getString('template_id', true);
                const haut = interaction.options.getString('haut', true);
                const bas = interaction.options.getString('bas', true);
                return createMemeInteraction(interaction, template_id, haut, bas);
            }
            case 'memes': {
                const q = interaction.options.getString('recherche') || '';
                const max = interaction.options.getInteger('max') || 10;
                return listMemesInteraction(interaction, q, max);
            }
            case 'aide':
                return helpInteraction(interaction);
            default:
                return interaction.reply({ content: 'Commande inconnue.', ephemeral: true });
        }
    } catch (e) {
        console.error('Erreur interaction:', e);
        if (interaction.replied || interaction.deferred) {
            return interaction.followUp({ content: `Oups, une erreur est survenue: ${e.message}`, ephemeral: true });
        }
        return interaction.reply({ content: `Oups, une erreur est survenue: ${e.message}`, ephemeral: true });
    }
});

// --- Commandes (communes) ---
function badgeFor(meta) {
    const alco = meta?.alcoholic ? '🍷' : '🥤';
    const type = meta?.type ? `• ${meta.type}` : '';
    const taste = meta?.tastes?.length ? `• ${meta.tastes.slice(0, 2).join(', ')}` : '';
    return `${alco} ${type} ${taste}`.trim();
}

function sendMenu(message) {
    const special = todaySpecial();
    const lines = Object.entries(MENU).map(([key, item]) => {
        const base = item.price;
        const price = applyHappyHour(base);
        const hh = HAPPY_HOUR.active && price !== base
            ? ` ~~${formatPrice(base)}~~ **${formatPrice(price)}**`
            : ` **${formatPrice(price)}**`;
        const badges = badgeFor(item.meta);
        return `• **${item.label}** (\`${key}\`) —${hh}\n   > ${badges}`;
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

function orderDrinkMessage(message, args) {
    const key = (args[0] || '').toLowerCase();
    if (!key || !MENU[key]) {
        return message.reply(`Je ne trouve pas cette boisson. Tape \`${PREFIX} menu\` pour voir la carte.`);
    }
    const item = MENU[key];
    const price = applyHappyHour(item.price);

    const bill = getBill(message.author.id);
    bill.items.push({ key, label: item.label, price });
    bill.subtotal += price;

    const state = getUserState(message.author.id);
    applyEffects(state, item.effects);
    clampState(state);

    touchUserChannel(message.author.id, message.channel.id);
    announceStageChanges(client, message.author.id, state).catch(() => { });

    const metaLine = formatMeta(item.meta);
    const effectsLine = formatEffectsDelta(item.effects);

    return message.channel.send(
        `Une **${item.label}** pour ${message.member?.displayName || message.author.username} ! ` +
        `Ça fera ${formatPrice(price)}.\n` +
        `> ${metaLine}\n` +
        `> Effets: ${effectsLine}`
    );
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

    const ok = subCoins(message.author.id, Math.round(total));
    if (!ok) {
        const bal = getWallet(message.author.id).balance;
        return message.reply(`Solde insuffisant : il te faut **${formatPrice(total)}**, tu as **${formatCoins(bal)}**.`);
    }

    tabs.set(message.author.id, { items: [], subtotal: 0 });
    const bal = getWallet(message.author.id).balance;
    return message.channel.send(`Merci pour ta visite ! Tu as réglé **${formatPrice(total)}**. Nouveau solde : **${formatCoins(bal)}**.`);
}

function balanceMessage(message) {
    const w = getWallet(message.author.id);
    return message.reply(`Ton solde est de **${formatCoins(w.balance)}**.`);
}

function dailyMessage(message) {
    const w = getWallet(message.author.id);
    const now = Date.now();
    const last = w.lastDaily || 0;
    const elapsed = now - last;
    const oneDay = 24 * 60 * 60 * 1000;

    if (elapsed < oneDay) {
        const rest = Math.ceil((oneDay - elapsed) / (60 * 1000));
        return message.reply(`Tu as déjà récupéré ta récompense quotidienne. Reviens dans ~${rest} min.`);
    }

    // streak si < 48h, sinon reset
    if (last && elapsed <= 2 * oneDay) w.streak = (w.streak || 0) + 1;
    else w.streak = 1;

    const base = randInt(DAILY_MIN, DAILY_MAX);
    const bonus = Math.min(20, w.streak * 2); // +2 par jour de série, cap à +20
    const gain = base + bonus;

    addCoins(message.author.id, gain);
    w.lastDaily = now;

    return message.reply(`Récompense quotidienne : **+${formatCoins(gain)}** (streak x${w.streak}, bonus ${bonus} 🪙).`);
}

function workMessage(message) {
    const now = Date.now();
    const exp = workCooldowns.get(message.author.id) || 0;
    if (now < exp) {
        const left = Math.ceil((exp - now) / (60 * 1000));
        return message.reply(`Doucement l'ami, reviens travailler dans ~${left} min.`);
    }
    const gain = randInt(WORK_MIN, WORK_MAX);
    addCoins(message.author.id, gain);
    workCooldowns.set(message.author.id, now + WORK_COOLDOWN_MS);
    return message.reply(`Tu donnes un coup de main au comptoir et gagnes **+${formatCoins(gain)}**.`);
}

function donateMessage(message, args) {
    // Usage: !tavernier don @user 50
    const target = message.mentions.users.first();
    const amount = parseInt(args[1] || '0', 10);
    if (!target || isNaN(amount) || amount <= 0) {
        return message.reply(`Usage : \`${PREFIX} don @utilisateur <montant>\``);
    }
    if (target.id === message.author.id) return message.reply("Tu ne peux pas te donner des pièces à toi-même 😄");

    if (!subCoins(message.author.id, amount)) {
        const bal = getWallet(message.author.id).balance;
        return message.reply(`Solde insuffisant. Il te reste **${formatCoins(bal)}**.`);
    }
    addCoins(target.id, amount);
    const bal = getWallet(message.author.id).balance;
    return message.channel.send(`${message.author} a donné **${formatCoins(amount)}** à ${target}. Nouveau solde de ${message.member?.displayName || message.author.username} : **${formatCoins(bal)}**.`);
}

function toggleHappyHourMessage(message, args) {
    if (!message.member.permissions.has('MANAGE_GUILD')) return message.reply("Seul le patron peut annoncer l'Happy Hour !");
    if (!args[0]) return message.reply(`Happy Hour est **${HAPPY_HOUR.active ? 'activée' : 'désactivée'}**.`);
    const on = args[0].toLowerCase();
    if (on === 'on') { HAPPY_HOUR.active = true; return message.channel.send('🔔 Happy Hour ! -25% sur tout !'); }
    if (on === 'off') { HAPPY_HOUR.active = false; return message.channel.send("Happy Hour terminée."); }
}

function stateToLines(state) {
    return Object.entries(state).map(([k, v]) => `${STATE_EMOJI[k] || ''} ${k}: **${v}**`).join('\n');
}

function stateInteraction(interaction) {
    const st = getUserState(interaction.user.id);
    if (!st) return interaction.reply({ content: 'Aucun état enregistré pour vous pour l’instant.', ephemeral: true });
    return interaction.reply({
        content: `Vos états actuels :\n${stateToLines(st)}`,
        ephemeral: true
    });
}

function specialOfDay(message) {
    const sp = todaySpecial();
    return message.reply(`Le spécial du jour est **${sp.label}** (\`${sp.key}\`) à ${formatPrice(applyHappyHour(sp.price))}.`);
}

function rollDiceMessage(message, args) {
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

function coinFlipMessage(message) {
    const r = Math.random() < 0.5 ? 'Pile' : 'Face';
    return message.reply(`🪙 **${r}** !`);
}

async function createMemeMessage(message, args) {
    // Usage: !tavernier meme <template_id> | haut | bas
    const parts = args.join(' ').split('|').map(p => p.trim());
    if (parts.length < 3) return message.reply("Format: `!tavernier meme <template_id> | texte haut | texte bas`");
    const template_id = parts[0];
    const text0 = parts[1];
    const text1 = parts[2];

    return createMemeCore({ send: (content) => message.channel.send(content), reply: (content) => message.reply(content) }, message.author.id, template_id, text0, text1);
}

// >>> NOUVEAU : liste des templates (message) <<<
async function listMemesMessage(message, query) {
    try {
        const templates = await getMemeTemplates();
        const filtered = searchMemeTemplates(templates, query).slice(0, 15);
        if (!filtered.length) return message.reply('Aucun template trouvé pour ta recherche.');
        const lines = filtered.map(t => `• **${t.name}** — ID: \`${t.id}\` (${t.box_count} zones)`);
        const embed = new MessageEmbed()
            .setTitle('🖼️ Templates Imgflip')
            .setDescription(lines.join('\n'))
            .setFooter({ text: query ? `Filtré par: ${query}` : 'Astuce: utilise /meme et commence à taper pour l’autocomplétion.' })
            .setThumbnail(filtered[0].url); // <<< miniature du 1er résultat
        return message.channel.send({ embeds: [embed] });
    } catch (e) {
        console.error('listMemesMessage error:', e);
        return message.reply(`Impossible de récupérer les templates: ${e.message}`);
    }
}

function sendHelp(message) {
    const embed = new MessageEmbed()
        .setTitle('👨‍🍳 Le Tavernier — Aide')
        .setDescription(`Préfixe: \`${PREFIX}\`\n\n**Commandes**\n• \`menu\`, \`commander <boisson>\`, \`addition\`, \`payer\`\n• \`dujour\`, \`histoire\`, \`toast\`\n• \`des [XdY]\`, \`pileface\`\n• \`meme <template_id> | haut | bas\` — Génère un mème via Imgflip\n• \`memes [recherche]\` — Liste/recherche des templates Imgflip\n• \`happyhour on|off\` (Admin)\nAinsi que leurs équivalents en commandes slash.`);
    return message.channel.send({ embeds: [embed] });
}

// --- Implémentations pour les interactions ---
function sendMenuInteraction(interaction) {
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

    return interaction.reply({ embeds: [embed] });
}

function greetInteraction(interaction) {
    const nickname = interaction.member?.nickname || interaction.user.username;
    return interaction.reply(`Salut, ${nickname} ! Installe-toi, que puis-je te servir ?`);
}

function orderDrinkInteraction(interaction, key) {
    key = (key || '').toLowerCase();
    if (!key || !MENU[key]) {
        return interaction.reply({ content: `Je ne trouve pas cette boisson. Utilise /menu pour voir la carte.`, ephemeral: true });
    }
    const item = MENU[key];
    const price = applyHappyHour(item.price);

    const bill = getBill(interaction.user.id);
    bill.items.push({ key, label: item.label, price });
    bill.subtotal += price;

    const state = getUserState(interaction.user.id);
    applyEffects(state, item.effects);
    clampState(state);

    touchUserChannel(interaction.user.id, interaction.channelId);
    announceStageChanges(client, interaction.user.id, state).catch(() => { });

    const metaLine = formatMeta(item.meta);
    const effectsLine = formatEffectsDelta(item.effects);

    return interaction.reply(
        `Une **${item.label}** pour ${interaction.member?.nick || interaction.user.username} ! ` +
        `Ça fera ${formatPrice(price)}.\n` +
        `> ${metaLine}\n` +
        `> Effets: ${effectsLine}`
    );
}

function showBillInteraction(interaction) {
    const bill = getBill(interaction.user.id);
    if (!bill.items.length) return interaction.reply({ content: "Votre note est vierge pour l'instant.", ephemeral: true });
    const { tax, total } = calcTotals(bill.subtotal);
    const lines = bill.items.map((it, i) => `${i + 1}. ${it.label} — ${formatPrice(it.price)}`);
    const embed = new MessageEmbed()
        .setTitle(`🧾 Addition de ${interaction.member?.nick || interaction.user.username}`)
        .setDescription(lines.join('\n'))
        .addField('Sous-total', formatPrice(bill.subtotal), true)
        .addField('Taxe (10%)', formatPrice(tax), true)
        .addField('Total', `**${formatPrice(total)}**`, false);
    return interaction.reply({ embeds: [embed] });
}

function payBillInteraction(interaction) {
    const bill = getBill(interaction.user.id);
    if (!bill.items.length) return interaction.reply({ content: 'Rien à régler.', ephemeral: true });
    const { total } = calcTotals(bill.subtotal);

    const ok = subCoins(interaction.user.id, Math.round(total));
    if (!ok) {
        const bal = getWallet(interaction.user.id).balance;
        return interaction.reply({ content: `Solde insuffisant : il te faut **${formatPrice(total)}**, tu as **${formatCoins(bal)}**.`, ephemeral: true });
    }

    tabs.set(interaction.user.id, { items: [], subtotal: 0 });
    const bal = getWallet(interaction.user.id).balance;
    return interaction.reply(`Merci pour votre visite ! Vous avez réglé **${formatPrice(total)}**. Nouveau solde : **${formatCoins(bal)}**.`);
}

function balanceInteraction(interaction) {
    const w = getWallet(interaction.user.id);
    return interaction.reply({ content: `Votre solde est de **${formatCoins(w.balance)}**.`, ephemeral: true });
}

function dailyInteraction(interaction) {
    // Réutilise la version message avec un petit wrapper
    const w = getWallet(interaction.user.id);
    const now = Date.now();
    const last = w.lastDaily || 0;
    const elapsed = now - last;
    const oneDay = 24 * 60 * 60 * 1000;

    if (elapsed < oneDay) {
        const rest = Math.ceil((oneDay - elapsed) / (60 * 1000));
        return interaction.reply({ content: `Récompense déjà prise. Reviens dans ~${rest} min.`, ephemeral: true });
    }
    if (last && elapsed <= 2 * oneDay) w.streak = (w.streak || 0) + 1; else w.streak = 1;

    const base = randInt(DAILY_MIN, DAILY_MAX);
    const bonus = Math.min(20, w.streak * 2);
    const gain = base + bonus;

    addCoins(interaction.user.id, gain);
    w.lastDaily = now;

    return interaction.reply(`Récompense quotidienne : **+${formatCoins(gain)}** (streak x${w.streak}, bonus ${bonus} 🪙).`);
}

function workInteraction(interaction) {
    const now = Date.now();
    const exp = workCooldowns.get(interaction.user.id) || 0;
    if (now < exp) {
        const left = Math.ceil((exp - now) / (60 * 1000));
        return interaction.reply({ content: `Reviens travailler dans ~${left} min.`, ephemeral: true });
    }
    const gain = randInt(WORK_MIN, WORK_MAX);
    addCoins(interaction.user.id, gain);
    workCooldowns.set(interaction.user.id, now + WORK_COOLDOWN_MS);
    return interaction.reply(`Merci du coup de main ! **+${formatCoins(gain)}**.`);
}

async function donateInteraction(interaction) {
    const user = interaction.options.getUser('destinataire', true);
    const amount = interaction.options.getInteger('montant', true);
    if (user.id === interaction.user.id) {
        return interaction.reply({ content: "Vous ne pouvez pas vous donner des pièces à vous-même 😄", ephemeral: true });
    }
    if (amount <= 0) {
        return interaction.reply({ content: "Montant invalide.", ephemeral: true });
    }
    if (!subCoins(interaction.user.id, amount)) {
        const bal = getWallet(interaction.user.id).balance;
        return interaction.reply({ content: `Solde insuffisant. Il vous reste **${formatCoins(bal)}**.`, ephemeral: true });
    }
    addCoins(user.id, amount);
    const bal = getWallet(interaction.user.id).balance;
    return interaction.reply(`${interaction.user} a donné **${formatCoins(amount)}** à ${user}. Nouveau solde : **${formatCoins(bal)}**.`);
}


function toggleHappyHourInteraction(interaction, state) {
    if (!interaction.memberPermissions || !interaction.memberPermissions.has('MANAGE_GUILD')) {
        return interaction.reply({ content: "Seul le patron peut annoncer l'Happy Hour !", ephemeral: true });
    }
    if (!state) {
        return interaction.reply({ content: `Happy Hour est **${HAPPY_HOUR.active ? 'activée' : 'désactivée'}**.`, ephemeral: true });
    }
    const on = state.toLowerCase();
    if (on === 'on') { HAPPY_HOUR.active = true; return interaction.reply('🔔 Happy Hour ! -25% sur tout !'); }
    if (on === 'off') { HAPPY_HOUR.active = false; return interaction.reply('Happy Hour terminée.'); }
    return interaction.reply({ content: 'Valeur attendue: on/off', ephemeral: true });
}

function specialOfDayInteraction(interaction) {
    const sp = todaySpecial();
    return interaction.reply(`Le spécial du jour est **${sp.label}** (\`${sp.key}\`) à ${formatPrice(applyHappyHour(sp.price))}.`);
}

function rollDiceInteraction(interaction, input) {
    input = (input || '1d20').toLowerCase();
    const match = input.match(/(\d*)d(\d+)/);
    if (!match) return interaction.reply({ content: 'Format invalide. Exemple: `2d6`', ephemeral: true });
    let count = parseInt(match[1] || '1', 10);
    const faces = parseInt(match[2], 10);
    if (count > 20) count = 20;
    const rolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * faces));
    const sum = rolls.reduce((a, b) => a + b, 0);
    return interaction.reply(`🎲 ${input} → [ ${rolls.join(', ')} ] = **${sum}**`);
}

function coinFlipInteraction(interaction) {
    const r = Math.random() < 0.5 ? 'Pile' : 'Face';
    return interaction.reply(`🪙 **${r}** !`);
}

async function createMemeInteraction(interaction, template_id, text0, text1) {
    return createMemeCore({ send: (content) => interaction.reply(content), reply: (content) => interaction.reply({ content, ephemeral: true }) }, interaction.user.id, template_id, text0, text1);
}

async function createMemeCore(adapter, userId, template_id, text0, text1) {
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
        return adapter.send(`Voici ton mème : ${data.data.url}`);
    } catch (e) {
        return adapter.reply(`Erreur création du mème : ${e.message}`);
    }
}

// >>> NOUVEAU : liste des templates (slash) <<<
async function listMemesInteraction(interaction, query = '', max = 10) {
    try {
        const templates = await getMemeTemplates();
        const filtered = searchMemeTemplates(templates, query).slice(0, Math.min(25, Math.max(1, max)));
        if (!filtered.length) return interaction.reply({ content: 'Aucun template trouvé.', ephemeral: true });
        const lines = filtered.map(t => `• **${t.name}** — ID: \`${t.id}\` (${t.box_count} zones)`);
        const embed = new MessageEmbed()
            .setTitle('🖼️ Templates Imgflip')
            .setDescription(lines.join('\n'))
            .setFooter({ text: query ? `Filtré par: ${query}` : 'Astuce: commence à taper dans /meme pour l’autocomplétion.' })
            .setThumbnail(filtered[0].url); // <<< miniature du 1er résultat
        return interaction.reply({ embeds: [embed], ephemeral: false });
    } catch (e) {
        console.error('listMemesInteraction error:', e);
        return interaction.reply({ content: `Impossible de récupérer les templates: ${e.message}`, ephemeral: true });
    }
}

function helpInteraction(interaction) {
    const embed = new MessageEmbed()
        .setTitle('👨‍🍳 Le Tavernier — Aide')
        .setDescription(`Tu peux utiliser les commandes via /<nom> ou avec le préfixe \`${PREFIX}\`.\n\n**Commandes disponibles**\n• /menu, /commander, /addition, /payer\n• /dujour, /histoire, /toast\n• /des, /pileface\n• /meme (autocomplétion pour \`template_id\`)\n• /memes (liste/recherche des templates)\n• /happyhour (Admin)`);
    return interaction.reply({ embeds: [embed], ephemeral: true });
}

// ----------------------
//   CONSTRUCTION DES SLASH COMMANDS
// ----------------------
function buildSlashCommands() {
    // Construction dynamique des choix de boissons
    const commands = [
        {
            name: 'menu',
            description: 'Afficher la carte des boissons',
        },
        {
            name: 'salut',
            description: 'Dire bonjour au tavernier',
        },
        {
            name: 'commander',
            description: 'Commander une boisson',
            options: [
                {
                    name: 'boisson',
                    description: 'La boisson à commander',
                    type: 3, // STRING
                    required: true,
                    autocomplete: true
                }
            ]
        },
        {
            name: 'solde',
            description: 'Afficher votre solde de pièces',
        },
        {
            name: 'daily',
            description: 'Récupérer votre récompense quotidienne',
        },
        {
            name: 'travail',
            description: 'Aider le tavernier et gagner un peu d’argent (cooldown 1h)',
        },
        {
            name: 'don',
            description: 'Donner des pièces à un autre aventurier',
            options: [
                { name: 'destinataire', description: 'À qui donner', type: 6, required: true }, // USER
                { name: 'montant', description: 'Combien donner', type: 4, required: true },   // INTEGER
            ]
        },
        {
            name: 'boissons',
            description: 'Choisir une boisson via des boutons',
        },
        {
            name: 'addition',
            description: "Voir votre note",
        },
        {
            name: 'payer',
            description: "Payer votre addition",
        },
        {
            name: 'happyhour',
            description: "Activer/désactiver l'Happy Hour (admin)",
            options: [
                {
                    name: 'etat',
                    description: 'on ou off (laisser vide pour connaître l\'état)',
                    type: 3, // STRING
                    required: false,
                    choices: [
                        { name: 'on', value: 'on' },
                        { name: 'off', value: 'off' }
                    ]
                }
            ]
        },
        {
            name: 'histoire',
            description: 'Écouter une anecdote de taverne',
        },
        {
            name: 'toast',
            description: 'Porter un toast',
        },
        {
            name: 'etat',
            description: 'Voir vos états actuels (énergie, humeur, ivresse, etc.)',
        },
        {
            name: 'dujour',
            description: 'Connaître le spécial du jour',
        },
        {
            name: 'des',
            description: 'Lancer des dés (format XdY, ex: 2d6)',
            options: [
                {
                    name: 'lancer',
                    description: 'Notation des dés (ex: 1d20, 3d8) — défaut 1d20',
                    type: 3, // STRING
                    required: false
                }
            ]
        },
        {
            name: 'pileface',
            description: 'Pile ou face',
        },
        {
            name: 'meme',
            description: 'Générer un mème via Imgflip',
            options: [
                { name: 'template_id', description: 'ID du template Imgflip (autocomplete)', type: 3, required: true, autocomplete: true },
                { name: 'haut', description: 'Texte du haut', type: 3, required: true },
                { name: 'bas', description: 'Texte du bas', type: 3, required: true }
            ]
        },
        // >>> NOUVEAU
        {
            name: 'memes',
            description: 'Lister/rechercher des templates Imgflip',
            options: [
                { name: 'recherche', description: 'Filtrer par nom ou ID', type: 3, required: false },
                { name: 'max', description: 'Nombre max (1-25)', type: 4, required: false }
            ]
        },
        {
            name: 'aide',
            description: "Afficher l'aide du tavernier",
        }
    ];
    return commands;
}

// Connexion
client.login(process.env.DISCORD_TOKEN);

// Keep-alive (p. ex. hébergement gratuit)
const http = require('http');
const PORT = process.env.PORT || 10000;
http.createServer((_, res) => res.end('ok')).listen(PORT);
