require('dotenv').config();
const { Client, Intents, Collection, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const fetch = require('node-fetch');
const { Routes } = require('discord-api-types/v9');
const { REST } = require('@discordjs/rest');

// --- Configuration ---
const CURRENCY = '🪙';
const TAX_RATE = 0.10; // 10% de taxe de taverne

// Carte des boissons + métadonnées + effets
const DRINKS_MENU = {
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
        meta: { type: 'agrumes', tastes: ['agrumes', 'acidulé'], alcoholic: false },
        effects: { hydratation: 1, energie: 1 }
    },
    potion_soin: {
        label: 'Potion de soin', price: 7,
        meta: { type: 'potion', tastes: ['mystique'], alcoholic: false },
        effects: { humeur: 1, concentration: 1, hydratation: 1, blessure: 2 }
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
    }
};

const FOOD_MENU = {
    cassoulet: {
        label: 'Cassoulet', price: 12,
        meta: { type: 'plat chaud', tastes: ['haricots blancs', 'saucisse', 'canard confit', 'ail'], vegetarian: false },
        effects: { energie: 3, humeur: 2, concentration: -1, faim: 5 }
    },
    petit_sale_lentilles: {
        label: 'Petit salé aux lentilles', price: 10,
        meta: { type: 'plat chaud', tastes: ['porc fumé', 'lentilles', 'carottes'], vegetarian: false },
        effects: { energie: 3, humeur: 1, hydratation: 1, faim: 4 }
    },
    saucisson_brioche: {
        label: 'Saucisson brioché', price: 9,
        meta: { type: 'plat froid/chaud', tastes: ['pâte briochée', 'saucisson', 'beurre'], vegetarian: false },
        effects: { energie: 2, humeur: 2, concentration: -1, faim: 3 }
    },
    pot_au_feu: {
        label: 'Pot-au-feu', price: 11,
        meta: { type: 'plat chaud', tastes: ['bœuf', 'légumes', 'bouillon'], vegetarian: false },
        effects: { energie: 3, humeur: 1, hydratation: 2, faim: 5 }
    },
    tartiflette: {
        label: 'Tartiflette', price: 11,
        meta: { type: 'plat chaud', tastes: ['pommes de terre', 'reblochon', 'lardons'], vegetarian: false },
        effects: { energie: 3, humeur: 2, concentration: -1, faim: 4 }
    },
    boeuf_bourgignon: {
        label: 'Bœuf bourguignon', price: 13,
        meta: { type: 'plat chaud', tastes: ['bœuf', 'vin rouge', 'champignons'], vegetarian: false },
        effects: { energie: 3, humeur: 2, ivresse: 1, faim: 5 }
    },
    confit_de_canard: {
        label: 'Confit de canard', price: 12,
        meta: { type: 'plat chaud', tastes: ['canard', 'gras', 'ail'], vegetarian: false },
        effects: { energie: 3, humeur: 2, concentration: -1, faim: 5 }
    },
    blanquette_de_veau: {
        label: 'Blanquette de veau', price: 12,
        meta: { type: 'plat chaud', tastes: ['veau', 'crème', 'champignons'], vegetarian: false },
        effects: { energie: 2, humeur: 2, concentration: 1, faim: 4 }
    },
    gratin_dauphinois: {
        label: 'Gratin dauphinois', price: 8,
        meta: { type: 'accompagnement/plat', tastes: ['pommes de terre', 'crème', 'ail'], vegetarian: true },
        effects: { energie: 2, humeur: 2, concentration: -1, faim: 3 }
    },
    soupe_a_l_oignon: {
        label: 'Soupe à l\'oignon', price: 7,
        meta: { type: 'soupe', tastes: ['oignons caramélisés', 'fromage gratiné', 'bouillon'], vegetarian: true },
        effects: { energie: 1, humeur: 1, hydratation: 2, faim: 2 }
    },
    quiche_lorraine: {
        label: 'Quiche lorraine', price: 8,
        meta: { type: 'plat chaud', tastes: ['pâte brisée', 'lardons', 'œufs', 'crème'], vegetarian: false },
        effects: { energie: 2, humeur: 1, concentration: 1, faim: 3 }
    },
    tarte_flambée: {
        label: 'Tarte flambée', price: 9,
        meta: { type: 'plat chaud', tastes: ['pâte fine', 'crème', 'oignons', 'lardons'], vegetarian: false },
        effects: { energie: 2, humeur: 1, concentration: 1, faim: 3 }
    },
    choucroute_garnie: {
        label: 'Choucroute garnie', price: 14,
        meta: { type: 'plat chaud', tastes: ['chou fermenté', 'saucisses', 'pommes de terre'], vegetarian: false },
        effects: { energie: 3, humeur: 1, hydratation: 1, faim: 6 }
    },
    croque_monsieur: {
        label: 'Croque-monsieur', price: 6,
        meta: { type: 'plat chaud', tastes: ['pain de mie', 'jambon', 'fromage', 'béchamel'], vegetarian: false },
        effects: { energie: 2, humeur: 2, concentration: 1, faim: 2 }
    },
    salade_paysanne: {
        label: 'Salade paysanne', price: 8,
        meta: { type: 'plat froid', tastes: ['lardons', 'œuf', 'croûtons', 'vinaigrette'], vegetarian: false },
        effects: { energie: 1, humeur: 1, hydratation: 1, faim: 1 }
    },
    tourte_aux_champignons: {
        label: 'Tourte aux champignons', price: 9,
        meta: { type: 'plat chaud', tastes: ['pâte feuilletée', 'champignons', 'crème'], vegetarian: true },
        effects: { energie: 2, humeur: 1, concentration: 1, faim: 3 }
    },
    poulet_rotisserie: {
        label: 'Poulet rôti', price: 10,
        meta: { type: 'plat chaud', tastes: ['poulet', 'herbes', 'peau croustillante'], vegetarian: false },
        effects: { energie: 3, humeur: 2, concentration: 1, faim: 4 }
    },
    ratatouille: {
        label: 'Ratatouille', price: 8,
        meta: { type: 'plat chaud', tastes: ['aubergine', 'courgette', 'poivron', 'tomate'], vegetarian: true },
        effects: { energie: 1, humeur: 1, hydratation: 2, faim: 2 }
    },
    aligot: {
        label: 'Aligot', price: 7,
        meta: { type: 'accompagnement/plat', tastes: ['purée', 'tome fraîche', 'ail'], vegetarian: true },
        effects: { energie: 2, humeur: 2, concentration: -1, faim: 3 }
    },
    andouillettes: {
        label: 'Andouillettes', price: 10,
        meta: { type: 'plat chaud', tastes: ['boyaux', 'épices', 'moutarde'], vegetarian: false },
        effects: { energie: 2, humeur: 1, charisme: 1, faim: 2 }
    },
    galette_saucisse: {
        label: 'Galette-saucisse', price: 6,
        meta: { type: 'plat froid/chaud', tastes: ['galette de blé', 'saucisse'], vegetarian: false },
        effects: { energie: 2, humeur: 2, concentration: 1, faim: 2 }
    },
    hachis_parmentier: {
        label: 'Hachis Parmentier', price: 9,
        meta: { type: 'plat chaud', tastes: ['viande hachée', 'purée', 'fromage'], vegetarian: false },
        effects: { energie: 3, humeur: 2, concentration: -1, faim: 4 }
    },
    escargots_beurre_persille: {
        label: 'Escargots au beurre persillé', price: 10,
        meta: { type: 'entrée', tastes: ['escargots', 'beurre', 'persil', 'ail'], vegetarian: false },
        effects: { energie: 1, humeur: 1, charisme: 1, faim: 1 }
    },
};

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
    "Un aventurier a oublié sa cape d'invisibilité ici. Si vous la voyez, dites-le moi.",
    "Le troisième tabouret du comptoir est toujours réservé. On dit que c'est pour le Fantôme de l'Aubergiste, qui revient chaque hiver vérifier ses comptes.",
    "Un voyageur a un jour commandé une 'Bière du Temps Perdu'. Il est encore assis au fond de la salle, attendant son verre.",
    "La cave de la taverne est plus grande à l'intérieur qu'à l'extérieur. Personne n'ose y aller après minuit.",
    "Un jour, une serviette se mit à parler. Elle disait des vérités... mais personne ne voulut l'écouter.",
    "Le miroir au-dessus de la cheminée reflète parfois des clients qui ne sont pas dans la pièce.",
    "La soupe du jour change toujours de goût, même si c'est toujours la même recette. Certains y entendent des murmures.",
    "Un aventurier a tenté de voler notre recette de hydromel. On l'a retrouvé trois jours plus tard, transformé en tonneau.",
    "La chandelle à votre gauche ? Elle brûle depuis 200 ans. Éteignez-la à vos risques et périls.",
    "La dernière fois que quelqu'un a commandé un 'Café Noir des Ombres', il a disparu avant la première gorgée.",
    "On dit que si vous écoutez assez longtemps, les murs chuchotent les noms de ceux qui ne sont jamais repartis.",
    "Le vin rouge servi ici provient d'une vigne qui pousse... quelque part hors de ce monde.",
    "Un jour, un magicien a transformé notre chat en table. Depuis, on sert les clients dessus. Elle ronronne encore.",
    "La porte des toilettes ne mène pas toujours aux toilettes. Mais c'est trop tard quand on s'en aperçoit.",
    "La 'Potion de Soin' a déjà ressuscité un mort. Il travaille maintenant en cuisine.",
    "Le dernier client qui a crié 'C'EST QUOI CET ARNAQUE ?!' est devenu une statue de sel. Elle décore l'entrée.",
    "Si vous entendez une flûte jouer une mélodie inconnue, ne la suivez pas. Le barde qui la joue n'est plus... humain.",
    "Le fromage sur notre plateau vient d'une ferme où les vaches ont trois yeux. C'est pour ça qu'il est si crémeux.",
    "Un client a un jour commandé 'la même chose que lui' en pointant le vide. On lui a servi quand même.",
    "La cave à vin abrite quelque chose qui respire. On lui laisse une bouteille de temps en temps... par politesse.",
    "Le livre de comptes de la taverne s'écrit tout seul. Personne n'a jamais osé le lire jusqu'à la dernière page.",
    "Si vous voyez une ombre sans propriétaire, ne la saluez pas. Elle pourrait vous répondre."
];

const HAPPY_HOUR = { active: false, discount: 0.25 }; // -25%

const tabs = new Map();
const economy = new Map();
const WORK_COOLDOWN_MS = 60 * 60 * 1000; // 1h entre deux "travail"
const DAILY_MIN = 20, DAILY_MAX = 50;
const WORK_MIN = 10, WORK_MAX = 25;
const workCooldowns = new Map();
const COOLDOWN_MS = 1000;
const cooldowns = new Collection();

// --- ÉCONOMIE ---
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

const MENU = { ...DRINKS_MENU, ...FOOD_MENU };

// =====================
//   IMGFLIP — templates
// =====================
const IMGFLIP_LIST_URL = 'https://api.imgflip.com/get_memes';
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

// =====================
//    DÉCROISSANCE & SEUILS
// =====================
const DECAY_INTERVAL_MS = 10 * 60 * 1000;
const DECAY_RULES = {
    ivresse: -1,
    energie: -1,
    humeur: -1,
    concentration: -1,
    hydratation: -1,
    charisme: -1,
    faim: -1, // NOUVEAU
    soif: -1, // NOUVEAU
};
const STATE_LIMITS = {
    ivresse: { min: 0, max: 10 },
    energie: { min: -5, max: 10 },
    humeur: { min: -5, max: 10 },
    concentration: { min: -5, max: 10 },
    hydratation: { min: -5, max: 10 },
    charisme: { min: 0, max: 10 },
    faim: { min: -5, max: 10 }, // NOUVEAU
    soif: { min: -5, max: 10 }, // NOUVEAU
    blessure: { min: 0, max: 10 }, // NOUVEAU
};

const userContext = new Map();
function getUserCtx(userId) {
    if (!userContext.has(userId)) userContext.set(userId, { lastChannelId: null, stages: new Set() });
    return userContext.get(userId);
}

function touchUserChannel(userId, channelId) {
    const ctx = getUserCtx(userId);
    ctx.lastChannelId = channelId;
}

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
const FOOD_PER_PAGE = 10;

function chunk(array, size) {
    const out = [];
    for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
    return out;
}

function totalDrinkPages() {
    return Math.max(1, Math.ceil(Object.keys(DRINKS_MENU).length / DRINKS_PER_PAGE));
}

function buildDrinkRows(page = 0) {
    const keys = Object.keys(DRINKS_MENU);
    const maxPage = totalDrinkPages() - 1;
    const p = Math.min(Math.max(0, page), maxPage);
    const start = p * DRINKS_PER_PAGE;
    const slice = keys.slice(start, start + DRINKS_PER_PAGE);
    const drinkButtons = slice.map(k =>
        new MessageButton()
            .setCustomId(`buy:${k}`)
            .setLabel(DRINKS_MENU[k].label)
            .setStyle('PRIMARY')
    );
    const rows = chunk(drinkButtons, 5).map(btns => new MessageActionRow().addComponents(btns));
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
    const keys = Object.keys(DRINKS_MENU);
    const start = page * DRINKS_PER_PAGE;
    const slice = keys.slice(start, start + DRINKS_PER_PAGE);
    const embed = new MessageEmbed()
        .setTitle('🍺 Sélecteur de boissons')
        .setDescription(HAPPY_HOUR.active ? 'Happy Hour en cours : -25% sur tout !' : 'Clique sur un bouton pour commander')
        .setFooter({ text: `Page ${page + 1}/${totalDrinkPages()} • ${HAPPY_HOUR.active ? 'Happy Hour -25%' : 'Taverne ouverte'}` });
    slice.forEach((k) => {
        const it = DRINKS_MENU[k];
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

// === Sélecteur de plats avec boutons (NEW) ===
function totalFoodPages() {
    return Math.max(1, Math.ceil(Object.keys(FOOD_MENU).length / FOOD_PER_PAGE));
}

function buildFoodRows(page = 0) {
    const keys = Object.keys(FOOD_MENU);
    const maxPage = totalFoodPages() - 1;
    const p = Math.min(Math.max(0, page), maxPage);
    const start = p * FOOD_PER_PAGE;
    const slice = keys.slice(start, start + FOOD_PER_PAGE);
    const foodButtons = slice.map(k =>
        new MessageButton()
            .setCustomId(`buyfood:${k}`)
            .setLabel(FOOD_MENU[k].label)
            .setStyle('PRIMARY')
    );
    const rows = chunk(foodButtons, 5).map(btns => new MessageActionRow().addComponents(btns));
    const prev = new MessageButton()
        .setCustomId(`manger:page:${p - 1}`)
        .setLabel('◀️')
        .setStyle('SECONDARY')
        .setDisabled(p <= 0);
    const info = new MessageButton()
        .setCustomId('manger:info')
        .setLabel(`Page ${p + 1}/${maxPage + 1}`)
        .setStyle('SECONDARY')
        .setDisabled(true);
    const next = new MessageButton()
        .setCustomId(`manger:page:${p + 1}`)
        .setLabel('▶️')
        .setStyle('SECONDARY')
        .setDisabled(p >= maxPage);
    rows.push(new MessageActionRow().addComponents(prev, info, next));
    return rows;
}

function buildFoodEmbed(page = 0) {
    const keys = Object.keys(FOOD_MENU);
    const start = page * FOOD_PER_PAGE;
    const slice = keys.slice(start, start + FOOD_PER_PAGE);
    const embed = new MessageEmbed()
        .setTitle('🍽️ Sélecteur de plats')
        .setDescription('Clique sur un bouton pour commander')
        .setFooter({ text: `Page ${page + 1}/${totalFoodPages()}` });
    slice.forEach((k) => {
        const it = FOOD_MENU[k];
        const price = it.price;
        const priceText = `**${formatPrice(price)}**`;
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

async function sendFoodSelectorInteraction(interaction, page = 0) {
    const embed = buildFoodEmbed(page);
    const components = buildFoodRows(page);
    return interaction.reply({ embeds: [embed], components, ephemeral: false });
}
// === Fin des ajouts pour le sélecteur de plats ===

const STAGE_RULES = [
    // RÈGLES EXISTANTES
    {
        id: 'tipsy',
        when: (s) => s.ivresse >= 3,
        up: "Vous vous sentez **légèrement pompette**. Les chansons deviennent subitement meilleures. 🍻",
        down: "Le monde arrête de tanguer. Vous reprenez vos esprits."
    },
    {
        id: 'drunk',
        when: (s) => s.ivresse >= 5,
        up: "Ouhla… **bien ivre** ! Vos pas improvisent une danse inconnue. 🥴",
        down: "Vous êtes **moins ivre**. Vos pieds coopèrent à nouveau."
    },
    {
        id: 'blackout',
        when: (s) => s.ivresse >= 8,
        up: "**Trou noir imminent** ! Vous cherchez vos clés… qui sont dans votre main. 🌚",
        down: "Retour de lucidité… partielle. Vous vous souvenez de votre prénom !"
    },
    {
        id: 'dehydrated',
        when: (s) => s.hydratation <= -3,
        up: "**Déshydraté** ! Un verre d'eau ferait des miracles. 💧",
        down: "Hydratation en **amélioration**. La gorge vous remercie."
    },
    {
        id: 'exhausted',
        when: (s) => s.energie <= -3,
        up: "**Épuisé**… Les tabourets deviennent anormalement confortables. 😵",
        down: "Un regain d'entrain ! Vous tenez debout sans bâiller."
    },
    {
        id: 'euphoric',
        when: (s) => s.humeur >= 5,
        up: "**Euphorique** ! Vous complimentez absolument tout le monde. ✨",
        down: "Le sourire s'adoucit, mais reste présent."
    },
    {
        id: 'grumpy',
        when: (s) => s.humeur <= -3,
        up: "**Ronchon**… Rien ne trouve grâce à vos yeux. 😤",
        down: "L'orage passe. Vous retrouvez un peu de bonne humeur."
    },
    {
        id: 'unfocused',
        when: (s) => s.concentration <= -3,
        up: "**Distrait**… Vous perdez le fil au milieu de vos phrases. 🫥",
        down: "L'esprit se **clarifie**. Les idées s'alignent."
    },
    {
        id: 'silver_tongue',
        when: (s) => s.charisme >= 5,
        up: "**Langue d'argent** ! Vos mots brillent, les deals aussi. 💬",
        down: "Moins de verve, mais toujours charmant."
    },
    // NOUVELLES RÈGLES
    {
        id: 'hungry',
        when: (s) => s.faim <= -3,
        up: "Votre estomac crie famine. Il est temps de passer à table ! 😩",
        down: "Votre estomac s'est tu. Vous êtes rassasié."
    },
    {
        id: 'full',
        when: (s) => s.faim >= 5,
        up: "Vous avez **le ventre plein**. Une sieste s'impose. 😴",
        down: "La digestion est finie. Vous n'êtes plus lourd."
    },
    {
        id: 'thirsty',
        when: (s) => s.soif <= -3,
        up: "**Soif intense** ! Votre gorge est aussi sèche que le désert. 🏜️",
        down: "Votre soif a été étanchée. La vie est belle."
    },
    {
        id: 'wounded',
        when: (s) => s.blessure >= 3,
        up: "Vous êtes **blessé**. Chaque mouvement est une douleur. 🤕",
        down: "Vos blessures sont **en voie de guérison**. La douleur s'estompe."
    },
];

function computeStages(state) {
    const active = new Set();
    for (const r of STAGE_RULES) {
        if (r.when(state)) active.add(r.id);
    }
    return active;
}

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

const userStates = new Map();
const STATE_EMOJI = {
    ivresse: '🍺',
    energie: '⚡',
    humeur: '😊',
    concentration: '🎯',
    hydratation: '💧',
    charisme: '💬',
    faim: '🍕', // NOUVEAU
    soif: '🥤', // NOUVEAU
    blessure: '🩹', // NOUVEAU
};

function defaultState() {
    return { ivresse: 0, energie: 0, humeur: 0, concentration: 0, hydratation: 0, charisme: 0, faim: 0, soif: 0, blessure: 0 }; // NOUVEAU
}

function getUserState(userId) {
    if (!userStates.has(userId)) {
        userStates.set(userId, defaultState());
    }
    return userStates.get(userId);
}

function applyEffects(state, effects = {}) {
    for (const k of Object.keys(defaultState())) {
        if (typeof effects[k] === 'number') state[k] += effects[k];
    }
}

function formatEffectsDelta(effects = {}) {
    const parts = [];
    for (const [k, v] of Object.entries(effects)) {
        if (!v) continue;
        const sign = v > 0 ? `+${v}` : `${v}`;
        parts.push(`${STATE_EMOJI[k] || ''} ${sign}`);
    }
    return parts.length ? parts.join(' · ') : '—';
}

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
    const keys = Object.keys(DRINKS_MENU);
    const index = new Date().getDate() % keys.length;
    const key = keys[index];
    return { key, ...DRINKS_MENU[key] };
}

function todaySpecialFood() {
    const keys = Object.keys(FOOD_MENU);
    const index = new Date().getDate() % keys.length;
    const key = keys[index];
    return { key, ...FOOD_MENU[key] };
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
    try {
        const commands = buildSlashCommands();
        const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);
        const guildId = process.env.GUILD_ID;
        const clientId = process.env.CLIENT_ID;
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
    } catch (err) {
        console.error('Erreur enregistrement des commandes slash:', err);
    }
    setInterval(() => {
        applyGlobalDecay(client).catch(err => console.error('Décroissance: erreur', err));
    }, DECAY_INTERVAL_MS);
});

client.on('guildMemberAdd', (member) => {
    const channel = member.guild.systemChannel || member.guild.channels.cache.find(c => c.isText());
    if (!channel) return;
    channel.send(`Bienvenue à la Taverne, ${member}! Accroche ta cape et fais comme chez toi.`);
});

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomToast() { return TOASTS[Math.floor(Math.random() * TOASTS.length)]; }
function randomLore() { return LORE[Math.floor(Math.random() * LORE.length)]; }

function transformDrunkText(text) {
    return text.split('').map(c => {
        if (Math.random() < 0.5) {
            return c.toUpperCase();
        } else {
            return c.toLowerCase();
        }
    }).join('');
}

function transformEnergeticText(text) {
    const emoji = '⚡';
    return text.split(' ').map(word => word + emoji).join(' ');
}

function transformMessageText(userId, text) {
    const state = getUserState(userId);
    let transformedText = text;
    if (state.ivresse > 10) {
        transformedText = transformDrunkText(transformedText);
    }
    if (state.energie > 10) {
        transformedText = transformEnergeticText(transformedText);
    }
    return transformedText;
}

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    const userId = message.author.id;
    const transformedText = transformMessageText(userId, message.content);
    if (transformedText !== message.content) {
        await message.delete();
        await message.channel.send(`${message.author}: ${transformedText}`);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isAutocomplete()) {
        try {
            const focused = interaction.options.getFocused(true);
            const q = (focused.value || '').toLowerCase();
            // L'autocomplétion pour /commander a été retirée
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

    if (interaction.isButton()) {
        try {
            const id = interaction.customId || '';
            if (id.startsWith('buy:')) {
                const key = id.split(':')[1];
                if (!MENU[key]) return interaction.reply({ content: 'Article inconnu.', ephemeral: true });
                return orderItemInteraction(interaction, key);
            }
            if (id.startsWith('menu:page:')) {
                const n = parseInt(id.split(':')[2], 10);
                const embed = buildDrinksEmbed(n);
                const components = buildDrinkRows(n);
                return interaction.update({ embeds: [embed], components });
            }
            // Gère les boutons pour le nouveau menu de plats
            if (id.startsWith('buyfood:')) {
                const key = id.split(':')[1];
                if (!FOOD_MENU[key]) return interaction.reply({ content: 'Plat inconnu.', ephemeral: true });
                return orderItemInteraction(interaction, key);
            }
            if (id.startsWith('manger:page:')) {
                const n = parseInt(id.split(':')[2], 10);
                const embed = buildFoodEmbed(n);
                const components = buildFoodRows(n);
                return interaction.update({ embeds: [embed], components });
            }
            if (id === 'menu:info' || id === 'manger:info') {
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
    }

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
            // La commande 'commander' a été retirée
            case 'manger': {
                return sendFoodSelectorInteraction(interaction, 0);
            }
            case 'boissons':
                return sendDrinksSelectorInteraction(interaction, 0);
            case 'addition':
                return showBillInteraction(interaction);
            case 'payer':
                return payBillInteraction(interaction);
            case 'happyhour': {
                const state = interaction.options.getString('etat');
                return toggleHappyHourInteraction(interaction, state);
            }
            case 'solde':
                return balanceInteraction(interaction);
            case 'daily':
                return dailyInteraction(interaction);
            case 'travail':
                return workInteraction(interaction);
            case 'don':
                return donateInteraction(interaction);
            case 'histoire':
                return interaction.reply(randomLore());
            case 'toast':
                return interaction.reply(randomToast());
            case 'dujour':
                return specialOfDayInteraction(interaction);
            case 'state':
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

function badgeFor(meta) {
    const alco = meta?.alcoholic ? '🍷' : '🥤';
    const type = meta?.type ? `• ${meta.type}` : '';
    const taste = meta?.tastes?.length ? `• ${meta.tastes.slice(0, 2).join(', ')}` : '';
    return `${alco} ${type} ${taste}`.trim();
}

function sendMenuInteraction(interaction) {
    const specialDrink = todaySpecial();
    const specialFood = todaySpecialFood();

    const drinkLines = Object.entries(DRINKS_MENU).map(([key, item]) => {
        const base = item.price;
        const price = applyHappyHour(base);
        const hh = HAPPY_HOUR.active && price !== base ? ` ~~${formatPrice(base)}~~ **${formatPrice(price)}**` : ` **${formatPrice(price)}**`;
        const badges = badgeFor(item.meta);
        return `• **${item.label}** (\`${key}\`) —${hh}\n   > ${badges}`;
    });

    const foodLines = Object.entries(FOOD_MENU).map(([key, item]) => {
        const price = item.price;
        const badges = badgeFor(item.meta);
        return `• **${item.label}** (\`${key}\`) — **${formatPrice(price)}**\n   > ${badges}`;
    });

    const embed = new MessageEmbed()
        .setTitle('🍺 Carte de la Taverne')
        .addField('Boissons', drinkLines.join('\n'))
        .addField('Spécial du jour (Boisson)', `**${specialDrink.label}** (\`${specialDrink.key}\`) à ${formatPrice(applyHappyHour(specialDrink.price))}`)
        .addField('Plats', foodLines.join('\n'))
        .addField('Spécial du jour (Plat)', `**${specialFood.label}** (\`${specialFood.key}\`) à ${formatPrice(specialFood.price)}`)
        .setFooter({ text: HAPPY_HOUR.active ? 'Happy Hour en cours — -25% sur tout !' : 'Bonnes manières et bons récits toujours bienvenus.' });
    return interaction.reply({ embeds: [embed] });
}

function greetInteraction(interaction) {
    const nickname = interaction.member?.nickname || interaction.user.username;
    return interaction.reply(`Salut, ${nickname} ! Installe-toi, que puis-je te servir ?`);
}

function orderItemInteraction(interaction, key) {
    key = (key || '').toLowerCase();
    let item;
    let isDrink = false;
    let isFood = false;
    if (DRINKS_MENU[key]) {
        item = DRINKS_MENU[key];
        isDrink = true;
    } else if (FOOD_MENU[key]) {
        item = FOOD_MENU[key];
        isFood = true;
    } else {
        return interaction.reply({ content: `Je ne trouve pas cet article. Utilise /menu pour voir la carte.`, ephemeral: true });
    }
    const price = isDrink ? applyHappyHour(item.price) : item.price;
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
    const itemType = isDrink ? 'boisson' : 'plat';
    const article = isDrink ? 'Une' : 'Un';
    return interaction.reply(
        `${article} **${item.label}** pour ${interaction.member?.nickname || interaction.user.username} ! ` +
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
        .setTitle(`🧾 Addition de ${interaction.member?.nickname || interaction.user.username}`)
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

function stateInteraction(interaction) {
    const st = getUserState(interaction.user.id);
    if (!st) return interaction.reply({
        content: 'Aucun état enregistré pour vous pour l\'instant.', ephemeral: true
    });
    return interaction.reply({
        content: `Vos états actuels :\n${stateToLines(st)}`,
        ephemeral: true
    });
}

function stateToLines(state) {
    return Object.entries(state).map(([k, v]) => `${STATE_EMOJI[k] || ''} ${k}: **${v}**`).join('\n');
}

function specialOfDayInteraction(interaction) {
    const spDrink = todaySpecial();
    const spFood = todaySpecialFood();
    const embed = new MessageEmbed()
        .setTitle('⭐ Spéciaux du jour')
        .addField('Boisson', `**${spDrink.label}** (\`${spDrink.key}\`) à ${formatPrice(applyHappyHour(spDrink.price))}`)
        .addField('Plat', `**${spFood.label}** (\`${spFood.key}\`) à ${formatPrice(spFood.price)}`);
    return interaction.reply({ embeds: [embed] });
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

async function listMemesInteraction(interaction, query = '', max = 10) {
    try {
        const templates = await getMemeTemplates();
        const filtered = searchMemeTemplates(templates, query).slice(0, Math.min(25, Math.max(1, max)));
        if (!filtered.length) return interaction.reply({ content: 'Aucun template trouvé.', ephemeral: true });
        const lines = filtered.map(t => `• **${t.name}** — ID: \`${t.id}\` (${t.box_count} zones)`);
        const embed = new MessageEmbed()
            .setTitle('🖼️ Templates Imgflip')
            .setDescription(lines.join('\n'))
            .setFooter({
                text: query ? `Filtré par: ${query}` : 'Astuce: commence à taper dans /meme pour l\'autocomplétion.'
            })
            .setThumbnail(filtered[0].url);
        return interaction.reply({ embeds: [embed], ephemeral: false });
    } catch (e) {
        console.error('listMemesInteraction error:', e);
        return interaction.reply({ content: `Impossible de récupérer les templates: ${e.message}`, ephemeral: true });
    }

}

function helpInteraction(interaction) {
    const embed = new MessageEmbed()
        .setTitle('👨‍🍳 Le Tavernier — Aide')
        .setDescription(`Tu peux utiliser les commandes via /<nom>.\n\n**Commandes disponibles**\n• /menu, /manger, /addition, /payer\n• /boissons, /solde, /daily, /travail, /don\n• /dujour, /histoire, /toast, /state\n• /des, /pileface\n• /meme (autocomplétion pour \`template_id\`)\n• /memes (liste/recherche des templates)\n• /happyhour (Admin)`);
    return interaction.reply({ embeds: [embed], ephemeral: true });
}

function buildSlashCommands() {
    const commands = [
        {
            name: 'menu',
            description: 'Afficher la carte des boissons et plats',
        },
        {
            name: 'salut',
            description: 'Dire bonjour au tavernier',
        },
        // La commande 'commander' a été retirée
        {
            name: 'manger',
            description: 'Commander un plat',
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
            description: 'Aider le tavernier et gagner un peu d\'argent (cooldown 1h)',
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
            name: 'state',
            description: 'Voir vos états actuels (énergie, humeur, ivresse, etc.)',
        },
        {
            name: 'dujour',
            description: 'Connaître les spéciaux du jour',
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

function calcTotals(subtotal) {
    const tax = subtotal * TAX_RATE;
    return { tax, total: subtotal + tax };
}

client.login(process.env.DISCORD_TOKEN);

const http = require('http');
const PORT = process.env.PORT || 10000;
http.createServer((_, res) => res.end('ok')).listen(PORT);