// --- DECKOS KERNEL v5.1 (GM Edition) ---
// This file manages the central state, persistence, and DOM helpers.

// 1. SYSTEM DEFAULTS
const DEF = {
    ver: 5,
    gold: 100,
    
    // User Progress
    col: [],
    decks: [],
    bank: 0,
    lastOracle: 0,
    
    // Game Rules (The "Cartridge")
    pool: [],
    stats: ['ATK', 'DEF', 'SPD'], 
    campaign: [], // Custom Saga Nodes
    
    // System Flags
    wall: '',
    gmMode: false, // Hidden Admin Mode
    activeDeckId: null,
    
    // Rarity Config
    rarity: [
        { id: 'c', n: 'Common', c: '#8e8e93', w: 500, lim: 99 },
        { id: 'u', n: 'Uncommon', c: '#30d158', w: 250, lim: 10 },
        { id: 'r', n: 'Rare', c: '#0a84ff', w: 100, lim: 5 },
        { id: 'e', n: 'Epic', c: '#bf5af2', w: 25, lim: 3 },
        { id: 'l', n: 'Legendary', c: '#ffd60a', w: 5, lim: 1 },
        { id: 'm', n: 'Mythic', c: '#ff453a', w: 1, lim: 1 }
    ]
};

// 2. STATE (Live Binding)
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

// 5. PERSISTENCE (Save/Load)
export const save = () => {
    localStorage.setItem('dos_v5', JSON.stringify(state));
    updateUI();
};

export const load = () => {
    const l = localStorage.getItem('dos_v5');
    // Migration Logic (Handle v4 data if present)
    const old = localStorage.getItem('dos_v4');
    
    if (l) {
        const p = JSON.parse(l);
        // Merge to ensure new fields (like gmMode) exist even in old saves
        Object.assign(state, { ...DEF, ...p });
    } else if (old) {
        // Migrate v4 to v5
        const p = JSON.parse(old);
        state.pool = p.pool || [];
        state.col = p.col || [];
        state.stats = p.stats || ['ATK','DEF','SPD'];
        state.wall = p.wall || '';
        state.gold = p.gold || 100;
        console.log("DeckOS: Migrated v4 to v5");
        save();
    }
    
    // Apply Wallpaper
    if (state.wall && $('wallpaper')) {
        $('wallpaper').style.backgroundImage = `url('${state.wall}')`;
    }
    
    // Check GM Mode Visuals
    if (state.gmMode) {
        document.body.classList.add('gm-mode');
    }

    // Start Clock
    setInterval(() => {
        const d = new Date();
        const el = $('clock');
        if (el) el.innerText = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    }, 1000);

    updateUI();
};

// Added 'export' keyword ---
export const updateUI = () => {
    if ($('gold-display')) $('gold-display').innerText = Math.floor(state.gold).toLocaleString();
    if ($('shop-gold')) $('shop-gold').innerText = Math.floor(state.gold).toLocaleString();
    if ($('col-empty') && state.col) $('col-empty').style.display = state.col.length ? 'none' : 'block';
};

// 6. CARTRIDGE SYSTEM (Export/Import Game Rules)
// This separates "My Save File" from "The Game Config"
export const exportCartridge = () => {
    const cartridge = {
        name: "Custom DeckOS Config",
        version: "1.0",
        pool: state.pool,
        stats: state.stats,
        campaign: state.campaign
    };
    return JSON.stringify(cartridge, null, 2);
};

export const importCartridge = (jsonStr) => {
    try {
        const data = JSON.parse(jsonStr);
        if (!Array.isArray(data.pool)) throw new Error("Invalid Pool");
        
        state.pool = data.pool;
        state.stats = data.stats || ['ATK', 'DEF', 'SPD'];
        state.campaign = data.campaign || [];
        
        save();
        notify("Cartridge Loaded Successfully");
        return true;
    } catch (e) {
        console.error(e);
        notify("Invalid Cartridge Data");
        return false;
    }
};

// 7. NAVIGATION
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

export const factoryReset = () => {
    localStorage.clear();
    location.reload();
};
