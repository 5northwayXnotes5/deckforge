// --- DECKOS KERNEL ---
// This file manages the central state, persistence, and DOM helpers.

// 1. SYSTEM DEFAULTS
const DEF = {
    ver: 4,
    gold: 100,
    pool: [],
    col: [],
    decks: [],
    // PRESERVING YOUR CUSTOM STATS FEATURE
    stats: ['ATK', 'DEF', 'SPD'], 
    rarity: [
        { id: 'c', n: 'Common', c: '#8e8e93', w: 500, lim: 99 },
        { id: 'u', n: 'Uncommon', c: '#30d158', w: 250, lim: 10 },
        { id: 'r', n: 'Rare', c: '#0a84ff', w: 100, lim: 5 },
        { id: 'e', n: 'Epic', c: '#bf5af2', w: 25, lim: 3 },
        { id: 'l', n: 'Legendary', c: '#ffd60a', w: 5, lim: 1 },
        { id: 'm', n: 'Mythic', c: '#ff453a', w: 1, lim: 1 }
    ],
    wall: ''
};

// 2. STATE (Live Binding)
// All apps will import this variable to read/write data.
export let state = JSON.parse(JSON.stringify(DEF));

// 3. DOM HELPERS
export const $ = (id) => document.getElementById(id);
export const uid = () => Math.random().toString(36).slice(2);
export const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 4. NOTIFICATION SYSTEM
export const notify = (msg) => {
    const el = $('toast');
    const txt = $('toast-msg');
    if (el && txt) {
        txt.innerText = msg;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 3000);
    }
};

// 5. UI UPDATER
// Call this whenever gold or critical state changes
export const updateUI = () => {
    if ($('gold-display')) $('gold-display').innerText = state.gold.toLocaleString();
    if ($('shop-gold')) $('shop-gold').innerText = state.gold.toLocaleString();
    if ($('col-empty')) $('col-empty').style.display = state.col.length ? 'none' : 'block';
};

// 6. PERSISTENCE (Save/Load)
export const save = () => {
    localStorage.setItem('dos_v4', JSON.stringify(state));
    updateUI();
};

export const load = () => {
    const l = localStorage.getItem('dos_v4');
    if (l) {
        const p = JSON.parse(l);
        if (p.ver === 4) {
            // Full load
            Object.assign(state, p);
        } else {
            // Migration logic (Legacy support)
            state.pool = p.pool || [];
            state.col = p.collection || p.col || [];
            state.gold = 200; // Reset gold on version mismatch/upgrade
            console.log("DeckOS: Migrated from older version.");
        }
    }
    
    // Apply Wallpaper
    if (state.wall && $('wallpaper')) {
        $('wallpaper').style.backgroundImage = `url('${state.wall}')`;
    }
    
    // Start Clock
    setInterval(() => {
        const d = new Date();
        const el = $('clock');
        if (el) el.innerText = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    }, 1000);

    updateUI();
};

// 7. NAVIGATION
// This handles the visual switching. Specific app logic (like initializing the Duel board)
// will be handled in main.js triggers.
export const openAppWindow = (id) => {
    document.querySelectorAll('.app-window').forEach(e => e.classList.remove('active'));
    const win = $(`app-${id}`);
    if (win) win.classList.add('active');
    document.body.classList.add('app-open');
};

export const goHome = () => {
    document.querySelectorAll('.app-window').forEach(e => e.classList.remove('active'));
    document.body.classList.remove('app-open');
};

// 8. DATA MANAGEMENT (Settings/Demo)
// Keeping this here so other apps can trigger a "Factory Reset" or "Demo Load"
export const factoryReset = () => {
    localStorage.clear();
    location.reload();
};

export const loadDemoData = () => {
    const demoPool = [
        {id:uid(), name:'Pikachu', img:'https://img.icons8.com/color/96/pikachu-pokemon.png'},
        {id:uid(), name:'Charmander', img:'https://img.icons8.com/color/96/charmander.png'},
        {id:uid(), name:'Squirtle', img:'https://img.icons8.com/color/96/squirtle.png'},
        {id:uid(), name:'Bulbasaur', img:'https://img.icons8.com/color/96/bulbasaur.png'},
        {id:uid(), name:'Gengar', img:'https://img.icons8.com/color/96/gengar.png'},
        {id:uid(), name:'Dragon', img:'https://img.icons8.com/color/96/dragon.png'},
        {id:uid(), name:'Knight', img:'https://img.icons8.com/color/96/knight.png'},
        {id:uid(), name:'Wizard', img:'https://img.icons8.com/color/96/wizard.png'}
    ];
    state.pool = demoPool;
    save();
    notify("Demo Data Loaded");
};

